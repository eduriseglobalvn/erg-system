import {
  AUTH_SESSION_FALLBACK_MAX_AGE_MS,
  persistStudentSession,
  STUDENT_LOCAL_SESSION_KEY,
  STUDENT_TEMP_SESSION_KEY,
} from "@/platform/auth/api/auth-token-storage";
import { ApiClientError, apiRequest, hasApiBase, isBffAuthEnabled, withRefreshLock } from "@/lib/api-client";
import { getLoginDeviceMetadata } from "@/platform/auth/api/auth-api";
import { getApiBase } from "@/lib/platform";
import { getPersistedJsonValue, removePersistedJsonValue } from "@/stores/persisted-store";
import { getOrCreateBrowserDeviceId } from "@/platform/auth/api/browser-device-id";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { AUTH_BYPASS_ENABLED, DEFAULT_BYPASS_STUDENT_SESSION } from "@/platform/auth/config/auth-bypass";

export type StudentSession = {
  accessToken?: string;
  className: string;
  email: string;
  expiresAt?: string;
  id?: string;
  loggedInAt: string;
  name: string;
  schoolName?: string;
  rememberMe: boolean;
  refreshToken?: string;
  permissions?: string[];
  deniedPermissions?: string[];
  portal?: "elearning";
  title?: string;
  viewerKind?: "student" | "teacher";
};

type StudentLoginInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseJson<T>(value: string | null, fallback: T) {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getCurrentStudentSession() {
  if (!canUseStorage()) return null;

  // Older builds stored a full session (with access token) here; only the refresh-token-only "remember me" slot may stay.
  if (getPersistedJsonValue<StudentSession | null>(STUDENT_LOCAL_SESSION_KEY, null)?.accessToken) removePersistedJsonValue(STUDENT_LOCAL_SESSION_KEY);

  const tempSession = parseJson<StudentSession | null>(window.sessionStorage.getItem(STUDENT_TEMP_SESSION_KEY), null);
  if (isValidStudentSession(tempSession)) return tempSession;
  if (tempSession) window.sessionStorage.removeItem(STUDENT_TEMP_SESSION_KEY);

  return AUTH_BYPASS_ENABLED ? DEFAULT_BYPASS_STUDENT_SESSION : null;
}

export function loginStudent(input: StudentLoginInput) {
  return loginStudentWithApi(input);
}

export async function loginStudentWithApi(input: StudentLoginInput) {
  if (!hasApiBase()) {
    throw new Error("API chưa được cấu hình nên không thể đăng nhập học sinh bằng tài khoản thật.");
  }

  if (isBffAuthEnabled()) {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const query = new URLSearchParams({ portal: "elearning", returnTo });
    window.location.assign(`${getApiBase()}${API_ENDPOINTS.auth.login}?${query.toString()}`);
    return new Promise<StudentSession>(() => undefined);
  }

  const response = await apiRequest<{
    user?: { email?: string; fullName?: string; id?: string };
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    permissions?: string[];
    deniedPermissions?: string[];
    expiresIn?: number;
    expires_in?: number;
  }>(API_ENDPOINTS.auth.login, {
    portal: "elearning",
    method: "POST",
    body: JSON.stringify({
      ...getLoginDeviceMetadata(),
      identifier: input.email,
      password: input.password,
      rememberMe: input.rememberMe,
      portal: "elearning",
    }),
  });

  const accessToken = response.accessToken ?? response.access_token;
  const refreshToken = response.refreshToken ?? response.refresh_token;
  const expiresIn = response.expiresIn ?? response.expires_in;
  const session: StudentSession = {
    accessToken,
    className: "",
    email: response.user?.email ?? input.email.trim().toLowerCase(),
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
    id: response.user?.id,
    loggedInAt: new Date().toISOString(),
    name: response.user?.fullName ?? input.email.trim(),
    portal: "elearning",
    refreshToken,
    permissions: response.permissions ?? [],
    deniedPermissions: response.deniedPermissions ?? [],
    rememberMe: input.rememberMe,
    viewerKind: "student",
  };

  if (!canUseStorage()) return session;

  persistStudentSession(session);
  return session;
}

/** Startup: trade a remembered refresh token for a fresh student session. A rejected token signs out; a network error keeps it for the next start. */
export async function restoreRememberedStudentSession() {
  if (!canUseStorage() || !hasApiBase() || isBffAuthEnabled() || getCurrentStudentSession()) return;
  await withRefreshLock(restoreRememberedStudentSessionOnce);
}

async function restoreRememberedStudentSessionOnce() {
  // Read inside the lock: a tab that started at the same time may already have rotated the token.
  const remembered = getPersistedJsonValue<StudentSession | null>(STUDENT_LOCAL_SESSION_KEY, null);
  if (!remembered?.refreshToken) return;

  try {
    const response = await apiRequest<{ accessToken?: string; access_token?: string; refreshToken?: string; refresh_token?: string; expiresIn?: number; expires_in?: number }>(API_ENDPOINTS.auth.refresh, {
      portal: "elearning",
      method: "POST",
      body: JSON.stringify({ refreshToken: remembered.refreshToken, deviceId: getOrCreateBrowserDeviceId() }),
      skipAuthRefresh: true,
    });
    const accessToken = response.accessToken ?? response.access_token;
    if (!accessToken) throw new ApiClientError("Refresh response did not include an access token.", "AUTH_REFRESH_MISSING_ACCESS_TOKEN", 401);
    const expiresIn = response.expiresIn ?? response.expires_in;
    persistStudentSession({
      ...remembered,
      accessToken,
      refreshToken: response.refreshToken ?? response.refresh_token ?? remembered.refreshToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) removePersistedJsonValue(STUDENT_LOCAL_SESSION_KEY);
  }
}

export function logoutStudentSession() {
  if (!canUseStorage()) return;

  removePersistedJsonValue(STUDENT_LOCAL_SESSION_KEY);
  window.sessionStorage.removeItem(STUDENT_TEMP_SESSION_KEY);
}

function isValidStudentSession(session: StudentSession | null | undefined): session is StudentSession {
  if (!session?.accessToken) return false;

  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : null;
  if (expiresAt && Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;

  if (!expiresAt) {
    const loggedInAt = Date.parse(session.loggedInAt);
    if (!Number.isFinite(loggedInAt)) return false;
    if (loggedInAt + AUTH_SESSION_FALLBACK_MAX_AGE_MS <= Date.now()) return false;
  }

  return true;
}
