import { getApiBase } from "@/lib/platform";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import {
  classifyClientTelemetryOutcome,
  clientTelemetryNow,
  normalizeTelemetryEndpoint,
  recordClientTelemetry,
} from "@/lib/client-telemetry";
import { isBffAuthEnabled } from "@/platform/auth/bff/auth-mode";
import {
  ACCOUNT_DISABLED,
  ACCOUNT_DISABLED_EVENT,
  ApiClientError,
  AUTH_REAUTH_REQUIRED_EVENT,
  AUTH_SESSION_REPLACED,
  AUTH_SESSION_REPLACED_EVENT,
  AUTHORIZATION_CHANGED_EVENT,
  AUTHZ_VERSION_CHANGED,
  createRequestId,
  RATE_LIMIT_AUTO_RETRY_MAX_SECONDS,
  withRetryAfter,
} from "@/lib/api-client/errors";
import { getCsrfToken, isCommandMethod } from "@/lib/api-client/csrf";
import { currentBackOfficePortal, portalFromPath, requiresAuth } from "@/lib/api-client/portal";
import {
  getRequestAccessToken,
  invalidateStoredAuthSession,
  refreshStoredAuthSession,
  shouldRefreshAfterResponse,
} from "@/lib/api-client/refresh";
import {
  getApiResponseRequestId,
  getEnvelopeMessage,
  getErrorBody,
  inheritApiResponseRequestId,
  isApiEnvelope,
  readResponseBody,
  rememberResponseRequestId,
  type ApiEnvelope,
  type ApiRequestOptions,
} from "@/lib/api-client/response";
import { DEFAULT_API_TIMEOUT_MS, fetchApi } from "@/lib/api-client/transport";

// Public surface of the API client; the pieces live in ./api-client/*.
export {
  ACCOUNT_DISABLED,
  ACCOUNT_DISABLED_EVENT,
  ApiClientError,
  AUTH_REAUTH_REQUIRED_EVENT,
  AUTH_SESSION_INVALID_EVENT,
  AUTH_SESSION_REPLACED,
  AUTH_SESSION_REPLACED_EVENT,
  AUTHORIZATION_CHANGED_EVENT,
  AUTHZ_VERSION_CHANGED,
} from "@/lib/api-client/errors";
export { getApiResponseRequestId, inheritApiResponseRequestId, type ApiRequestOptions } from "@/lib/api-client/response";
export { isBffAuthEnabled };

const inFlightGetRequests = new Map<string, Promise<unknown>>();

export function hasApiBase() {
  return Boolean(getApiBase());
}

export function getBackOfficePortal(): StoredAuthSession["portal"] {
  return currentBackOfficePortal();
}

export async function apiRequest<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  if (path.split("?", 1)[0] === API_ENDPOINTS.graphql) {
    return performApiRequest<T>(path, init);
  }

  const startedAt = clientTelemetryNow();
  const method = (init?.method ?? "GET").toUpperCase();
  const portal = init?.portal ?? portalFromPath(path);
  try {
    const result = await performApiRequest<T>(path, init);
    recordClientTelemetry({
      durationMs: clientTelemetryNow() - startedAt,
      kind: "rest",
      method,
      name: normalizeTelemetryEndpoint(path),
      outcome: "success",
      portal,
      requestId: getApiResponseRequestId(result),
      timestamp: Date.now(),
    });
    return result;
  } catch (error) {
    recordClientTelemetry({
      durationMs: clientTelemetryNow() - startedAt,
      errorCode: error instanceof ApiClientError ? error.code : undefined,
      kind: "rest",
      method,
      name: normalizeTelemetryEndpoint(path),
      outcome: classifyClientTelemetryOutcome(error, init?.signal ?? undefined),
      portal,
      requestId: error instanceof ApiClientError ? error.requestId : undefined,
      status: error instanceof ApiClientError ? error.status : undefined,
      timestamp: Date.now(),
    });
    throw error;
  }
}

async function performApiRequest<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new ApiClientError("API base URL is not configured.", "API_BASE_MISSING", 0);
  }

  const portal = init?.portal ?? portalFromPath(path);
  const token = await getRequestAccessToken(portal, path, init);

  if (!token && requiresAuth(path, init) && !isBffAuthEnabled()) {
    // Thiếu token cho một request nền KHÔNG có nghĩa là phiên đã chết — chỉ throw
    // để query đó fail cục bộ. Việc logout do refreshStoredAuthSessionOnce lo khi
    // refresh token thực sự bị backend từ chối.
    throw new ApiClientError("Authentication session is missing or expired.", "UNAUTHORIZED", 401);
  }

  const headers = new Headers(init?.headers);
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!headers.has("Content-Type") && init?.body !== undefined && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }
  // X-Tenant-ID / X-Portal: backend không còn đọc từ client để authz (A1)
  // - tenantId lấy từ session đã đăng nhập
  // - portal suy ra từ URL path
  // FE không cần gửi 2 header này nữa; gửi vào cũng bị bỏ qua (không lỗi)
  // GraphQL: nếu gửi X-Tenant-ID sai tenant → 403, nên bỏ gửi hoặc đảm bảo khớp session
  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", createRequestId());
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (isBffAuthEnabled() && isCommandMethod(init?.method) && path !== API_ENDPOINTS.auth.csrf) {
    const csrf = await getCsrfToken();
    if (!headers.has(csrf.headerName)) headers.set(csrf.headerName, csrf.token);
  }

  const url = `${apiBase}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  // A caller-specific AbortSignal must not share a request: aborting one observer
  // should never cancel the request observed by another caller.
  const canDedupeGet = method === "GET" && init?.body === undefined && !init?.signal;
  const dedupeKey = canDedupeGet ? buildGetDedupeKey(url, headers, init, portal) : "";

  if (dedupeKey) {
    const inFlight = inFlightGetRequests.get(dedupeKey);
    if (inFlight) return inFlight as Promise<T>;
  }

  const request = executeApiRequest<T>(url, headers, init, { path, portal });

  if (dedupeKey) {
    inFlightGetRequests.set(dedupeKey, request);
    request.then(
      () => inFlightGetRequests.delete(dedupeKey),
      () => inFlightGetRequests.delete(dedupeKey),
    );
  }

  return request;
}

const RESPONSE_VARIANT_HEADERS = ["accept", "accept-language", "if-modified-since", "if-none-match", "range"] as const;

function buildGetDedupeKey(
  url: string,
  headers: Headers,
  init: ApiRequestOptions | undefined,
  portal: StoredAuthSession["portal"] | undefined,
) {
  const variantHeaders = RESPONSE_VARIANT_HEADERS.map((name) => `${name}:${headers.get(name) ?? ""}`).join("|");
  return [
    url,
    `portal:${portal ?? "unknown"}`,
    `auth:${headers.get("Authorization") ?? "anonymous"}`,
    `cache:${init?.cache ?? "no-store"}`,
    `credentials:${init?.credentials ?? "include"}`,
    `envelope:${init?.unwrapEnvelope === false ? "raw" : "data"}`,
    `timeout:${init?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS}`,
    `response:${init?.responseType ?? "json"}`,
    variantHeaders,
  ].join("|");
}

async function executeApiRequest<T>(
  url: string,
  headers: Headers,
  init: ApiRequestOptions | undefined,
  context: { path: string; portal?: StoredAuthSession["portal"] },
): Promise<T> {
  let response = await fetchApi(url, headers, init);
  const waitSeconds = rateLimitRetryDelaySeconds(response, init);
  if (waitSeconds !== undefined) {
    await waitForRetry(waitSeconds * 1000, init?.signal);
    response = await fetchApi(url, headers, init);
  }
  if (response.status === 304) {
    return undefined as T;
  }

  const body = await readResponseBody<ApiEnvelope<T> | T>(response, init?.responseType);
  rememberResponseRequestId(response, body);
  const errorBody = getErrorBody(body);

  if (!response.ok || errorBody) {
    const code = errorBody?.code ?? `HTTP_${response.status}`;
    const message = errorBody?.message ?? getEnvelopeMessage(body) ?? `Request failed: ${response.status}`;
    const error = new ApiClientError(message, code, response.status, withRetryAfter(errorBody?.details, response), errorBody?.requestId);

    if (shouldRefreshAfterResponse(error, context.path, init)) {
      const nextToken = await refreshStoredAuthSession(context.portal);
      if (nextToken) {
        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${nextToken}`);
        const retryResponse = await fetchApi(url, retryHeaders, { ...init, skipAuthRefresh: true });
        if (retryResponse.status === 304) {
          return undefined as T;
        }

        const retryBody = await readResponseBody<ApiEnvelope<T> | T>(retryResponse, init?.responseType);
        rememberResponseRequestId(retryResponse, retryBody);
        const retryErrorBody = getErrorBody(retryBody);

        if (retryResponse.ok && !retryErrorBody) {
          if (isApiEnvelope<T>(retryBody) && "data" in retryBody) {
            return inheritApiResponseRequestId(retryBody.data as T, retryBody);
          }

          return retryBody as T;
        }

        const retryCode = retryErrorBody?.code ?? `HTTP_${retryResponse.status}`;
        const retryMessage = retryErrorBody?.message ?? getEnvelopeMessage(retryBody) ?? `Request failed: ${retryResponse.status}`;
        const retryError = new ApiClientError(retryMessage, retryCode, retryResponse.status, retryErrorBody?.details, retryErrorBody?.requestId);

        // Retry vẫn 401 KHÔNG tự logout: nếu phiên thực sự chết thì refresh đã bị
        // backend từ chối (xử lý trong refreshStoredAuthSessionOnce). 401 lẻ tẻ ở đây
        // chỉ là request thiếu quyền → để query fail cục bộ, giữ nguyên phiên.
        throw retryError;
      }

      throw error;
    }

    if (code === AUTH_SESSION_REPLACED && !init?.skipAuthSessionEvent) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_REPLACED_EVENT, { detail: error }));
    }
    if (code === ACCOUNT_DISABLED && !init?.skipAuthSessionEvent) {
      invalidateStoredAuthSession(error, ACCOUNT_DISABLED_EVENT);
    }
    if (code === AUTHZ_VERSION_CHANGED && !init?.skipAuthSessionEvent) {
      invalidateStoredAuthSession(error, AUTHORIZATION_CHANGED_EVENT);
    }
    if (isBffAuthEnabled() && error.status === 401 && !init?.skipAuthSessionEvent) {
      window.dispatchEvent(new CustomEvent(AUTH_REAUTH_REQUIRED_EVENT, { detail: error }));
    }

    // 401 ở đây KHÔNG tự logout. Nếu access token hết hạn, shouldRefreshAfterResponse
    // đã kích hoạt luồng refresh phía trên; refresh chết thì refreshStoredAuthSessionOnce
    // mới invalidate phiên. 401 do endpoint thiếu quyền / lỗi backend chỉ throw cục bộ,
    // tránh việc một query nền đá người dùng ra khỏi toàn bộ portal.
    throw error;
  }

  if (init?.unwrapEnvelope !== false && isApiEnvelope<T>(body) && "data" in body) {
    return inheritApiResponseRequestId(body.data as T, body);
  }

  return body as T;
}

/** Seconds to wait before the single automatic retry of a rate-limited read; undefined when it must not be retried. */
function rateLimitRetryDelaySeconds(response: Response, init: ApiRequestOptions | undefined) {
  if (response.status !== 429) return undefined;
  const isRead = (init?.method ?? "GET").toUpperCase() === "GET" || init?.retryOnRateLimit === true;
  const seconds = Number(response.headers.get("Retry-After"));
  return isRead && Number.isFinite(seconds) && seconds > 0 && seconds <= RATE_LIMIT_AUTO_RETRY_MAX_SECONDS ? seconds : undefined;
}

function waitForRetry(ms: number, signal: AbortSignal | null | undefined) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
