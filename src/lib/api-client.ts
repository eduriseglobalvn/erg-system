import { getApiBase } from "@/lib/platform";
import { getStoredAccessToken, resolveCurrentPortal, type StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

export const AUTH_SESSION_REPLACED = "AUTH_SESSION_REPLACED";
export const AUTH_SESSION_REPLACED_EVENT = "erg-auth-session-replaced";
export const AUTH_SESSION_INVALID_EVENT = "erg-auth-session-invalid";

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

type ApiRequestOptions = RequestInit & {
  portal?: StoredAuthSession["portal"];
  skipAuthSessionEvent?: boolean;
};

const inFlightGetRequests = new Map<string, Promise<unknown>>();

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

export async function apiRequest<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new ApiClientError("API base URL is not configured.", "API_BASE_MISSING", 0);
  }

  const headers = new Headers(init?.headers);
  const portal = init?.portal ?? portalFromPath(path);
  const token = getStoredAccessToken(portal);

  if (!token && requiresAuth(path)) {
    const error = new ApiClientError("Authentication session is missing or expired.", "UNAUTHORIZED", 401);
    if (!init?.skipAuthSessionEvent) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT, { detail: error }));
    }
    throw error;
  }

  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!headers.has("Content-Type") && init?.body !== undefined && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("X-Tenant-ID")) {
    headers.set("X-Tenant-ID", import.meta.env.VITE_TENANT_ID?.trim() || "erg");
  }
  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", createRequestId());
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (portal && !headers.has("X-Portal")) {
    headers.set("X-Portal", portal);
  }

  const url = `${apiBase}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const canDedupeGet = method === "GET" && init?.body === undefined;
  const dedupeKey = canDedupeGet ? `${url}|${headers.get("Authorization") ?? "anonymous"}` : "";

  if (dedupeKey) {
    const inFlight = inFlightGetRequests.get(dedupeKey);
    if (inFlight) return inFlight as Promise<T>;
  }

  const request = executeApiRequest<T>(url, headers, init);

  if (dedupeKey) {
    inFlightGetRequests.set(dedupeKey, request);
    request.then(
      () => inFlightGetRequests.delete(dedupeKey),
      () => inFlightGetRequests.delete(dedupeKey),
    );
  }

  return request;
}

async function executeApiRequest<T>(url: string, headers: Headers, init?: ApiRequestOptions): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    credentials: init?.credentials ?? "include",
    referrerPolicy: init?.referrerPolicy ?? "no-referrer",
  });

  const body = await readJson<ApiEnvelope<T> | T>(response);
  const errorBody = getErrorBody(body);

  if (!response.ok || errorBody) {
    const code = errorBody?.code ?? `HTTP_${response.status}`;
    const message = errorBody?.message ?? getEnvelopeMessage(body) ?? `Request failed: ${response.status}`;
    const error = new ApiClientError(message, code, response.status);

    if (code === AUTH_SESSION_REPLACED && !init?.skipAuthSessionEvent) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_REPLACED_EVENT, { detail: error }));
    }

    if (isUnauthorizedSessionError(response.status, code, message) && !init?.skipAuthSessionEvent) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_INVALID_EVENT, { detail: error }));
    }

    throw error;
  }

  if (isApiEnvelope<T>(body) && "data" in body) {
    return body.data as T;
  }

  return body as T;
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

function portalFromPath(path: string): StoredAuthSession["portal"] | undefined {
  const normalized = path.toLowerCase();
  if (normalized.includes("/api/v1/admin/hoclieu")) return "lcms";
  if (normalized.includes("/api/v1/hoclieu")) return "lms";
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
  if (normalized.includes("/api/hoclieu")) return "lms";
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
    path === "/api/auth/login" ||
    path === "/api/v1/auth/login" ||
    path === "/api/v1/auth/register" ||
    path === "/api/lms/auth/login" ||
    path === "/api/lms/auth/register" ||
    path.startsWith("/api/lms/auth/providers/")
  );
}

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
