export const AUTH_SESSION_REPLACED = "AUTH_SESSION_REPLACED";
export const AUTH_SESSION_REPLACED_EVENT = "erg-auth-session-replaced";
export const AUTH_SESSION_INVALID_EVENT = "erg-auth-session-invalid";
export const AUTH_REAUTH_REQUIRED_EVENT = "erg-auth-reauth-required";
export const ACCOUNT_DISABLED = "ACCOUNT_DISABLED";
export const ACCOUNT_DISABLED_EVENT = "erg-auth-account-disabled";
export const AUTHZ_VERSION_CHANGED = "AUTHZ_VERSION_CHANGED";
export const AUTHORIZATION_CHANGED_EVENT = "erg-auth-authorization-changed";

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

/** Copies a numeric `Retry-After` header (429/423 lockouts) into error details as `retryAfterSeconds`. */
export function withRetryAfter(details: unknown, response: Response): unknown {
  const seconds = Number(response.headers.get("Retry-After"));
  if (!Number.isFinite(seconds) || seconds <= 0) return details;
  if (details === undefined || details === null) return { retryAfterSeconds: seconds };
  return typeof details === "object" && !Array.isArray(details) ? { retryAfterSeconds: seconds, ...details } : details;
}

export function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
