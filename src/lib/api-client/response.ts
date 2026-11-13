import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

type ApiErrorBody = {
  code?: string;
  message?: string;
  [key: string]: unknown;
};

export type ApiEnvelope<T> = {
  data?: T;
  error?: ApiErrorBody | string;
  errors?: ApiErrorBody | string | unknown[];
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
  /** Retry once after a short 429 although the method is not GET (read-only GraphQL queries). */
  retryOnRateLimit?: boolean;
};

const apiResponseRequestIds = new WeakMap<object, string>();

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

/** Remembers the response's request id (header wins over body) on the parsed body object. */
export function rememberResponseRequestId(response: Response, body: unknown) {
  const requestId = response.headers.get("X-Request-ID") ?? getApiResponseRequestId(body);
  if (requestId && body && typeof body === "object") {
    apiResponseRequestIds.set(body, requestId);
  }
}

export async function readJson<T>(response: Response): Promise<T> {
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
        // Never surface proxy/Tomcat HTML error pages to users.
        message: /^\s*</.test(text)
          ? `Máy chủ trả về phản hồi không hợp lệ (HTTP ${response.status}).`
          : text.substring(0, 100), // First 100 chars for context
      }
    } as T;
  }
}

export function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { errors?: unknown };
  return "data" in value || "error" in value || "success" in value || "statusCode" in value || "request_id" in value
    || ("errors" in value && !Array.isArray(candidate.errors));
}

export async function readResponseBody<T>(response: Response, responseType: ApiRequestOptions["responseType"]): Promise<T> {
  if (responseType !== "blob") {
    return readJson<T>(response);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!response.ok || contentType.includes("json")) {
    return readJson<T>(response);
  }

  return response.blob() as Promise<T>;
}

export function getErrorBody(value: unknown) {
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

  // Validation failures list their entries (field, message, ...) in an array. Only when the body itself says 4xx/5xx:
  // a GraphQL body carries an errors array next to partial data on a 200.
  if (Array.isArray(value.errors) && value.errors.length > 0 && typeof value.statusCode === "number" && value.statusCode >= 400) {
    return { code: undefined, message: value.message, details: value.errors, requestId: value.request_id };
  }

  if (value.success === false) {
    return {
      code: "API_ERROR",
      message: value.message,
    };
  }

  return null;
}

export function getEnvelopeMessage(value: unknown) {
  return isApiEnvelope<unknown>(value) ? value.message : undefined;
}
