import {
  AUTH_SESSION_FALLBACK_MAX_AGE_MS,
  STUDENT_LOCAL_SESSION_KEY,
  STUDENT_TEMP_SESSION_KEY,
} from "@/platform/auth/api/auth-token-storage";
import { apiRequest, hasApiBase, isBffAuthEnabled } from "@/lib/api-client";
import { getApiBase } from "@/lib/platform";
import { removePersistedJsonValue } from "@/stores/persisted-store";
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

  removePersistedJsonValue(STUDENT_LOCAL_SESSION_KEY);

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

  window.sessionStorage.setItem(STUDENT_TEMP_SESSION_KEY, JSON.stringify(session));
  removePersistedJsonValue(STUDENT_LOCAL_SESSION_KEY);
  return session;
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
