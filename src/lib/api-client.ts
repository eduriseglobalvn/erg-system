import { getApiBase } from "@/lib/platform";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import {
  clearStoredAuthSessions,
  getStoredAccessToken,
  readStoredRefreshSession,
  resolveCurrentPortal,
  updateStoredAuthSessionTokens,
  type StoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";
import { getOrCreateBrowserDeviceId } from "@/platform/auth/api/browser-device-id";
import {
  classifyClientTelemetryOutcome,
  clientTelemetryNow,
  normalizeTelemetryEndpoint,
  recordClientTelemetry,
} from "@/lib/client-telemetry";
import { isBffAuthEnabled } from "@/platform/auth/bff/auth-mode";
export { isBffAuthEnabled };

export const AUTH_SESSION_REPLACED = "AUTH_SESSION_REPLACED";
export const AUTH_SESSION_REPLACED_EVENT = "erg-auth-session-replaced";
export const AUTH_SESSION_INVALID_EVENT = "erg-auth-session-invalid";
export const AUTH_REAUTH_REQUIRED_EVENT = "erg-auth-reauth-required";
export const ACCOUNT_DISABLED = "ACCOUNT_DISABLED";
export const ACCOUNT_DISABLED_EVENT = "erg-auth-account-disabled";
export const AUTHZ_VERSION_CHANGED = "AUTHZ_VERSION_CHANGED";
export const AUTHORIZATION_CHANGED_EVENT = "erg-auth-authorization-changed";

type ApiErrorBody = {
  code?: string;
  message?: string;
  [key: string]: unknown;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: ApiErrorBody | string;
  errors?: ApiErrorBody | string;
  message?: string;
  request_id?: string;
  statusCode?: number;
  success?: boolean;
};

export type ApiRequestOptions = RequestInit & {
  auth?: "public" | "required";
  portal?: StoredAuthSession["portal"];
  skipAuthSessionEvent?: boolean;
  skipAuthRefresh?: boolean;
  timeoutMs?: number;
  unwrapEnvelope?: boolean;
  responseType?: "json" | "blob";
};

const DEFAULT_API_TIMEOUT_MS = 15_000;
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const inFlightRefreshRequests = new Map<string, Promise<string | null>>();
const apiResponseRequestIds = new WeakMap<object, string>();
let csrfTokenPromise: Promise<{ headerName: string; token: string }> | null = null;

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;

  constructor(message: string, code: string, status: number, details?: unknown, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export function hasApiBase() {
  return Boolean(getApiBase());
}

export function getApiResponseRequestId(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const directRequestId = "request_id" in value && typeof value.request_id === "string"
    ? value.request_id
    : undefined;
  return directRequestId || apiResponseRequestIds.get(value);
}

export function inheritApiResponseRequestId<T>(target: T, source: unknown): T {
  const requestId = getApiResponseRequestId(source);
  if (requestId && target && typeof target === "object") {
    apiResponseRequestIds.set(target, requestId);
  }
  return target;
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
  // X-Portal: backend suy ra từ URL path, không cần gửi nữa
  // if (portal && !headers.has("X-Portal")) {
  //   headers.set("X-Portal", portal);
  // }

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
  const response = await fetchApi(url, headers, init);
  if (response.status === 304) {
    return undefined as T;
  }

  const body = await readResponseBody<ApiEnvelope<T> | T>(response, init?.responseType);
  const responseRequestId = response.headers.get("X-Request-ID") ?? getApiResponseRequestId(body);
  if (responseRequestId && body && typeof body === "object") {
    apiResponseRequestIds.set(body, responseRequestId);
  }
  const errorBody = getErrorBody(body);

  if (!response.ok || errorBody) {
    const code = errorBody?.code ?? `HTTP_${response.status}`;
    const message = errorBody?.message ?? getEnvelopeMessage(body) ?? `Request failed: ${response.status}`;
    const error = new ApiClientError(message, code, response.status, errorBody?.details, errorBody?.requestId);

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
        const retryRequestId = retryResponse.headers.get("X-Request-ID") ?? getApiResponseRequestId(retryBody);
        if (retryRequestId && retryBody && typeof retryBody === "object") {
          apiResponseRequestIds.set(retryBody, retryRequestId);
        }
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

async function fetchApi(url: string, headers: Headers, init?: ApiRequestOptions) {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const timeoutController = timeoutMs > 0 && typeof AbortController !== "undefined" ? new AbortController() : null;
  const sourceSignal = init?.signal;
  if (sourceSignal?.aborted) {
    throw sourceSignal.reason;
  }
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let removeSourceAbortListener: (() => void) | undefined;

  if (timeoutController && sourceSignal) {
    if (sourceSignal.aborted) {
      timeoutController.abort(sourceSignal.reason);
    } else {
      const onSourceAbort = () => timeoutController.abort(sourceSignal.reason);
      sourceSignal.addEventListener("abort", onSourceAbort, { once: true });
      removeSourceAbortListener = () => sourceSignal.removeEventListener("abort", onSourceAbort);
    }
  }

  if (timeoutController) {
    timeoutId = setTimeout(() => timeoutController.abort(new Error("API_REQUEST_TIMEOUT")), timeoutMs);
  }

  const { signal: _signal, timeoutMs: _timeoutMs, responseType: _responseType, ...fetchInit } = init ?? {};

  try {
    return await fetch(url, {
      ...fetchInit,
      headers,
      cache: init?.cache ?? "no-store",
      credentials: init?.credentials ?? "include",
      referrerPolicy: init?.referrerPolicy ?? "no-referrer",
      signal: timeoutController?.signal ?? sourceSignal,
    });
  } catch (error) {
    if (sourceSignal?.aborted) {
      throw sourceSignal.reason;
    }
    if (timeoutController?.signal.aborted && timeoutController.signal.reason instanceof Error && timeoutController.signal.reason.message === "API_REQUEST_TIMEOUT") {
      throw new ApiClientError(`API request timed out after ${timeoutMs}ms.`, "REQUEST_TIMEOUT", 408);
    }

    throw new ApiClientError(
      error instanceof Error && error.message ? error.message : "Cannot connect to API server.",
      "NETWORK_ERROR",
      0,
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    removeSourceAbortListener?.();
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // If it's not JSON, return a structured error instead of throwing a SyntaxError
    // This happens often with 404 HTML pages from proxies/backends
    return {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: text.substring(0, 100) // First 100 chars for context
      }
    } as T;
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { errors?: unknown };
  return "data" in value || "error" in value || "success" in value || "statusCode" in value || "request_id" in value
    || ("errors" in value && !Array.isArray(candidate.errors));
}

async function readResponseBody<T>(response: Response, responseType: ApiRequestOptions["responseType"]): Promise<T> {
  if (responseType !== "blob") {
    return readJson<T>(response);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!response.ok || contentType.includes("json")) {
    return readJson<T>(response);
  }

  return response.blob() as Promise<T>;
}

function getErrorBody(value: unknown) {
  if (!isApiEnvelope<unknown>(value)) {
    return null;
  }

  if (value.error) {
    return typeof value.error === "string"
      ? { code: value.error, message: value.message, details: value.error, requestId: value.request_id }
      : { code: value.error.code, message: value.error.message ?? value.message, details: value.error, requestId: value.request_id };
  }

  if (value.errors && !Array.isArray(value.errors)) {
    return typeof value.errors === "string"
      ? { code: value.errors, message: value.message, details: value.errors, requestId: value.request_id }
      : { code: value.errors.code, message: value.message, details: value.errors, requestId: value.request_id };
  }

  if (value.success === false) {
    return {
      code: "API_ERROR",
      message: value.message,
    };
  }

  return null;
}

function getEnvelopeMessage(value: unknown) {
  return isApiEnvelope<unknown>(value) ? value.message : undefined;
}

function isUnauthorizedSessionError(status: number, code: string, message: string) {
  const normalizedCode = code.trim().toLowerCase();
  const normalizedMessage = message.trim().toLowerCase();
  return (
    status === 401 ||
    normalizedCode === "unauthorized" ||
    normalizedCode === "invalid_token" ||
    normalizedMessage.includes("invalid token") ||
    normalizedMessage.includes("expired token") ||
    normalizedMessage.includes("token expired")
  );
}

async function getRequestAccessToken(portal: StoredAuthSession["portal"] | undefined, path: string, init?: ApiRequestOptions) {
  const token = getStoredAccessToken(portal);
  if (token || !requiresAuth(path, init) || init?.skipAuthRefresh) {
    return token;
  }

  const refreshSession = readStoredRefreshSession(portal);
  if (!refreshSession?.refreshToken) {
    return undefined;
  }

  return refreshStoredAuthSession(portal);
}

function shouldRefreshAfterResponse(error: ApiClientError, path: string, init?: ApiRequestOptions) {
  if (init?.skipAuthRefresh) return false;
  if (!requiresAuth(path, init)) return false;
  if ([AUTH_SESSION_REPLACED, ACCOUNT_DISABLED, AUTHZ_VERSION_CHANGED].includes(error.code)) return false;
  return isUnauthorizedSessionError(error.status, error.code, error.message);
}

async function refreshStoredAuthSession(portal?: StoredAuthSession["portal"]) {
  const session = readStoredRefreshSession(portal);
  if (!session?.refreshToken) return null;

  const key = session.refreshToken;
  const inFlight = inFlightRefreshRequests.get(key);
  if (inFlight) return inFlight;

  const request = refreshStoredAuthSessionOnce(session, portal);
  inFlightRefreshRequests.set(key, request);
  request.finally(() => inFlightRefreshRequests.delete(key));
  return request;
}

async function refreshStoredAuthSessionOnce(session: NonNullable<ReturnType<typeof readStoredRefreshSession>>, portal?: StoredAuthSession["portal"]) {
  const apiBase = getApiBase();
  if (!apiBase) return null;

  try {
    const headers = new Headers({
      "Content-Type": "application/json",
      "X-Request-ID": createRequestId(),
    });

    const response = await fetchApi(`${apiBase}/api/v1/auth/refresh`, headers, {
      method: "POST",
      body: JSON.stringify({
        refreshToken: session.refreshToken,
        deviceId: getOrCreateBrowserDeviceId(),
      }),
      skipAuthRefresh: true,
    });
    const body = await readJson<ApiEnvelope<RefreshTokenResponse> | RefreshTokenResponse>(response);
    const errorBody = getErrorBody(body);

    if (!response.ok || errorBody) {
      const code = errorBody?.code ?? `HTTP_${response.status}`;
      const message = errorBody?.message ?? getEnvelopeMessage(body) ?? `Request failed: ${response.status}`;
      throw new ApiClientError(message, code, response.status);
    }

    const data = unwrapRefreshTokenResponse(body);
    const accessToken = data.accessToken ?? data.access_token;
    const refreshToken = data.refreshToken ?? data.refresh_token;
    const expiresIn = data.expiresIn ?? data.expires_in;

    if (!accessToken) {
      throw new ApiClientError("Refresh response did not include an access token.", "AUTH_REFRESH_MISSING_ACCESS_TOKEN", 401);
    }

    updateStoredAuthSessionTokens(portal ?? session.portal, {
      accessToken,
      refreshToken,
      expiresAt: expiresInToDate(expiresIn),
    });

    return accessToken;
  } catch (error) {
    const authError =
      error instanceof ApiClientError
        ? error
        : new ApiClientError(error instanceof Error ? error.message : "Cannot refresh authentication session.", "AUTH_REFRESH_FAILED", 401);
    invalidateStoredAuthSession(authError);
    return null;
  }
}

type RefreshTokenResponse = {
  accessToken?: string;
  access_token?: string;
  expiresIn?: number;
  expires_in?: number;
  refreshToken?: string;
  refresh_token?: string;
  tokenType?: string;
};

function unwrapRefreshTokenResponse(body: ApiEnvelope<RefreshTokenResponse> | RefreshTokenResponse): RefreshTokenResponse {
  if (isApiEnvelope<RefreshTokenResponse>(body)) {
    return body.data ?? {};
  }

  return body;
}

function invalidateStoredAuthSession(error: ApiClientError, eventName = AUTH_SESSION_INVALID_EVENT) {
  clearStoredAuthSessions();
  window.dispatchEvent(new CustomEvent(eventName, { detail: error }));
}

function expiresInToDate(expiresIn?: number) {
  if (!expiresIn || !Number.isFinite(expiresIn)) return undefined;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

function portalFromPath(path: string): StoredAuthSession["portal"] | undefined {
  const normalized = path.toLowerCase();
  if (normalized.includes(API_ENDPOINTS.routing.curriculumBase) || normalized.includes(API_ENDPOINTS.routing.contentBase)) return "lcms";
  if (
    normalized.includes(API_ENDPOINTS.legacy.v1UsersMe) ||
    normalized.includes(`${API_ENDPOINTS.routing.legacyUsersBase}/me`)
  ) {
    return resolveCurrentPortal();
  }
  if (
    normalized.includes(API_ENDPOINTS.routing.adminBase) ||
    normalized.includes(API_ENDPOINTS.routing.legacyAdminBase) ||
    normalized.includes(API_ENDPOINTS.routing.legacyUsersBase) ||
    normalized.includes(API_ENDPOINTS.routing.usersBase) ||
    normalized.includes(API_ENDPOINTS.routing.centers)
  ) {
    return currentBackOfficePortal();
  }
  if (normalized.includes(API_ENDPOINTS.routing.versionedBase)) return "lms";
  if (normalized.includes(API_ENDPOINTS.routing.legacyLmsBase)) return "lms";
  if (normalized.includes(API_ENDPOINTS.routing.elearningBase)) return "elearning";
  return undefined;
}

function currentBackOfficePortal(): StoredAuthSession["portal"] {
  const portal = resolveCurrentPortal();
  return portal === "crm" || portal === "lcms" ? portal : "admin";
}

export function getBackOfficePortal(): StoredAuthSession["portal"] {
  return currentBackOfficePortal();
}

function requiresAuth(path: string, init?: ApiRequestOptions) {
  if (init?.auth) return init.auth === "required";
  const normalized = path.toLowerCase().split("?")[0] ?? "";

  if (isPublicApiPath(normalized)) {
    return false;
  }

  return Boolean(portalFromPath(normalized));
}

function isPublicApiPath(path: string) {
  return (
    path === API_ENDPOINTS.auth.login ||
    path === API_ENDPOINTS.auth.refresh
  );
}

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isCommandMethod(method?: string) {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes((method ?? "GET").toUpperCase());
}

async function getCsrfToken() {
  if (csrfTokenPromise) return csrfTokenPromise;
  csrfTokenPromise = (async () => {
    const response = await fetch(`${getApiBase()}${API_ENDPOINTS.auth.csrf}`, {
      credentials: "include",
      headers: { "X-Request-ID": createRequestId() },
    });
    if (!response.ok) {
      throw new ApiClientError("Cannot initialize CSRF protection.", "CSRF_INITIALIZATION_FAILED", response.status);
    }
    return response.json() as Promise<{ headerName: string; token: string }>;
  })();
  try {
    return await csrfTokenPromise;
  } catch (error) {
    csrfTokenPromise = null;
    throw error;
  }
}
