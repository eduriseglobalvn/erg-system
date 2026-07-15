import { getApiBase } from "@/lib/platform";
import {
  clearStoredAuthSessions,
  getStoredAccessToken,
  readStoredRefreshSession,
  resolveCurrentPortal,
  updateStoredAuthSessionTokens,
  type StoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";

export const AUTH_SESSION_REPLACED = "AUTH_SESSION_REPLACED";
export const AUTH_SESSION_REPLACED_EVENT = "erg-auth-session-replaced";
export const AUTH_SESSION_INVALID_EVENT = "erg-auth-session-invalid";
export const AUTH_REAUTH_REQUIRED_EVENT = "erg-auth-reauth-required";

type ApiErrorBody = {
  code?: string;
  message?: string;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: ApiErrorBody | string;
  message?: string;
  success?: boolean;
};

export type ApiRequestOptions = RequestInit & {
  portal?: StoredAuthSession["portal"];
  skipAuthSessionEvent?: boolean;
  skipAuthRefresh?: boolean;
  timeoutMs?: number;
  unwrapEnvelope?: boolean;
};

const DEFAULT_API_TIMEOUT_MS = 15_000;
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const inFlightRefreshRequests = new Map<string, Promise<string | null>>();
let csrfTokenPromise: Promise<{ headerName: string; token: string }> | null = null;

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

export function hasApiBase() {
  return Boolean(getApiBase());
}

export function isBffAuthEnabled() {
  return import.meta.env.VITE_AUTH_MODE === "oidc-bff";
}

export async function apiRequest<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new ApiClientError("API base URL is not configured.", "API_BASE_MISSING", 0);
  }

  const portal = init?.portal ?? portalFromPath(path);
  const token = await getRequestAccessToken(portal, path, init);

  if (!token && requiresAuth(path) && !isBffAuthEnabled()) {
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
  if (isBffAuthEnabled() && isCommandMethod(init?.method) && path !== "/api/v1/auth/csrf") {
    const csrf = await getCsrfToken();
    if (!headers.has(csrf.headerName)) headers.set(csrf.headerName, csrf.token);
  }
  // X-Portal: backend suy ra từ URL path, không cần gửi nữa
  // if (portal && !headers.has("X-Portal")) {
  //   headers.set("X-Portal", portal);
  // }

  const url = `${apiBase}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const canDedupeGet = method === "GET" && init?.body === undefined;
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

  const body = await readJson<ApiEnvelope<T> | T>(response);
  const errorBody = getErrorBody(body);

  if (!response.ok || errorBody) {
    const code = errorBody?.code ?? `HTTP_${response.status}`;
    const message = errorBody?.message ?? getEnvelopeMessage(body) ?? `Request failed: ${response.status}`;
    const error = new ApiClientError(message, code, response.status);

    if (shouldRefreshAfterResponse(error, context.path, init)) {
      const nextToken = await refreshStoredAuthSession(context.portal);
      if (nextToken) {
        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${nextToken}`);
        const retryResponse = await fetchApi(url, retryHeaders, { ...init, skipAuthRefresh: true });
        if (retryResponse.status === 304) {
          return undefined as T;
        }

        const retryBody = await readJson<ApiEnvelope<T> | T>(retryResponse);
        const retryErrorBody = getErrorBody(retryBody);

        if (retryResponse.ok && !retryErrorBody) {
          if (isApiEnvelope<T>(retryBody) && "data" in retryBody) {
            return retryBody.data as T;
          }

          return retryBody as T;
        }

        const retryCode = retryErrorBody?.code ?? `HTTP_${retryResponse.status}`;
        const retryMessage = retryErrorBody?.message ?? getEnvelopeMessage(retryBody) ?? `Request failed: ${retryResponse.status}`;
        const retryError = new ApiClientError(retryMessage, retryCode, retryResponse.status);

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
    return body.data as T;
  }

  return body as T;
}

async function fetchApi(url: string, headers: Headers, init?: ApiRequestOptions) {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const timeoutController = timeoutMs > 0 && typeof AbortController !== "undefined" ? new AbortController() : null;
  const sourceSignal = init?.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (timeoutController && sourceSignal) {
    if (sourceSignal.aborted) {
      timeoutController.abort(sourceSignal.reason);
    } else {
      sourceSignal.addEventListener("abort", () => timeoutController.abort(sourceSignal.reason), { once: true });
    }
  }

  if (timeoutController) {
    timeoutId = setTimeout(() => timeoutController.abort(new Error("API_REQUEST_TIMEOUT")), timeoutMs);
  }

  const { signal: _signal, timeoutMs: _timeoutMs, ...fetchInit } = init ?? {};

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
  return Boolean(value && typeof value === "object" && ("data" in value || "error" in value || "success" in value));
}

function getErrorBody(value: unknown) {
  if (!isApiEnvelope<unknown>(value)) {
    return null;
  }

  if (value.error) {
    return typeof value.error === "string" ? { code: value.error, message: value.message } : value.error;
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
  if (token || !requiresAuth(path) || init?.skipAuthRefresh) {
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
  if (!requiresAuth(path)) return false;
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
      "X-Tenant-ID": import.meta.env.VITE_TENANT_ID?.trim() || "erg",
      "X-Request-ID": createRequestId(),
    });
    if (session.portal) {
      headers.set("X-Portal", session.portal);
    }

    const response = await fetchApi(`${apiBase}/api/v1/auth/refresh`, headers, {
      method: "POST",
      body: JSON.stringify({
        refreshToken: session.refreshToken,
        deviceId: readDeviceId(),
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

function invalidateStoredAuthSession(error: ApiClientError) {
  clearStoredAuthSessions();
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT, { detail: error }));
}

function expiresInToDate(expiresIn?: number) {
  if (!expiresIn || !Number.isFinite(expiresIn)) return undefined;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

function readDeviceId() {
  if (typeof window === "undefined") return undefined;
  try {
    const storageKey = "erg-auth-device-id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const next = createRequestId();
    window.localStorage.setItem(storageKey, next);
    return next;
  } catch {
    return undefined;
  }
}

function portalFromPath(path: string): StoredAuthSession["portal"] | undefined {
  const normalized = path.toLowerCase();
  if (normalized.includes("/api/curriculum") || normalized.includes("/api/content")) return "lcms";
  if (
    normalized.includes("/api/v1/users/me") ||
    normalized.includes("/api/users/me")
  ) {
    return resolveCurrentPortal();
  }
  if (
    normalized.includes("/api/v1/admin") ||
    normalized.includes("/api/admin") ||
    normalized.includes("/api/users") ||
    normalized.includes("/api/v1/users") ||
    normalized.includes("/api/v1/centers")
  ) {
    return currentBackOfficePortal();
  }
  if (normalized.includes("/api/v1/")) return "lms";
  if (normalized.includes("/api/lms")) return "lms";
  if (normalized.includes("/api/elearning")) return "elearning";
  return undefined;
}

function currentBackOfficePortal(): StoredAuthSession["portal"] {
  const portal = resolveCurrentPortal();
  return portal === "crm" || portal === "lcms" ? portal : "admin";
}

export function getBackOfficePortal(): StoredAuthSession["portal"] {
  return currentBackOfficePortal();
}

function requiresAuth(path: string) {
  const normalized = path.toLowerCase().split("?")[0] ?? "";

  if (isPublicApiPath(normalized)) {
    return false;
  }

  return Boolean(portalFromPath(normalized));
}

function isPublicApiPath(path: string) {
  return (
    path === "/api/v1/auth/login" ||
    path === "/api/v1/auth/refresh"
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
    const response = await fetch(`${getApiBase()}/api/v1/auth/csrf`, {
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
