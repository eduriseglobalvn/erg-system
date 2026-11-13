import { getApiBase } from "@/lib/platform";
import {
  clearStoredAuthSessions,
  getStoredAccessToken,
  readStoredRefreshSession,
  updateStoredAuthSessionTokens,
  type StoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";
import { getOrCreateBrowserDeviceId } from "@/platform/auth/api/browser-device-id";
import {
  ACCOUNT_DISABLED,
  ApiClientError,
  AUTH_SESSION_INVALID_EVENT,
  AUTH_SESSION_REPLACED,
  AUTHZ_VERSION_CHANGED,
  createRequestId,
} from "./errors";
import { requiresAuth } from "./portal";
import { getEnvelopeMessage, getErrorBody, isApiEnvelope, readJson, type ApiEnvelope, type ApiRequestOptions } from "./response";
import { fetchApi } from "./transport";

const inFlightRefreshRequests = new Map<string, Promise<string | null>>();

type RefreshTokenResponse = {
  accessToken?: string;
  access_token?: string;
  expiresIn?: number;
  expires_in?: number;
  refreshToken?: string;
  refresh_token?: string;
  tokenType?: string;
};

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

export async function getRequestAccessToken(portal: StoredAuthSession["portal"] | undefined, path: string, init?: ApiRequestOptions) {
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

export function shouldRefreshAfterResponse(error: ApiClientError, path: string, init?: ApiRequestOptions) {
  if (init?.skipAuthRefresh) return false;
  if (!requiresAuth(path, init)) return false;
  if ([AUTH_SESSION_REPLACED, ACCOUNT_DISABLED, AUTHZ_VERSION_CHANGED].includes(error.code)) return false;
  return isUnauthorizedSessionError(error.status, error.code, error.message);
}

export async function refreshStoredAuthSession(portal?: StoredAuthSession["portal"]) {
  const session = readStoredRefreshSession(portal);
  if (!session?.refreshToken) return null;

  const key = session.refreshToken;
  const inFlight = inFlightRefreshRequests.get(key);
  if (inFlight) return inFlight;

  const request = withRefreshLock(() => refreshStoredAuthSessionOnce(portal));
  inFlightRefreshRequests.set(key, request);
  request.finally(() => inFlightRefreshRequests.delete(key));
  return request;
}

/** One refresh at a time across tabs: the backend treats a reused rotated refresh token as theft and revokes every session of the account. */
export function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  // shortcut: Safari < 15.4 has no Web Locks, so two tabs there can still race; fine while iOS 15.8 is the floor.
  return locks ? locks.request("erg-auth-refresh", run) : run();
}

async function refreshStoredAuthSessionOnce(portal?: StoredAuthSession["portal"]) {
  const apiBase = getApiBase();
  // Read inside the lock: another tab may have rotated the token while this one waited.
  const session = readStoredRefreshSession(portal);
  if (!apiBase || !session?.refreshToken) return null;

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
    // Only a server that answered and refused the token ends the session; offline, timeout, 429 or 5xx keep it for the next try.
    if (authError.status >= 400 && authError.status < 500 && authError.status !== 408 && authError.status !== 429) invalidateStoredAuthSession(authError);
    return null;
  }
}

function unwrapRefreshTokenResponse(body: ApiEnvelope<RefreshTokenResponse> | RefreshTokenResponse): RefreshTokenResponse {
  if (isApiEnvelope<RefreshTokenResponse>(body)) {
    return body.data ?? {};
  }

  return body;
}

export function invalidateStoredAuthSession(error: ApiClientError, eventName = AUTH_SESSION_INVALID_EVENT) {
  clearStoredAuthSessions();
  window.dispatchEvent(new CustomEvent(eventName, { detail: error }));
}

function expiresInToDate(expiresIn?: number) {
  if (!expiresIn || !Number.isFinite(expiresIn)) return undefined;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
