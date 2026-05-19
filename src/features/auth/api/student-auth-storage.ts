import {
  STUDENT_LOCAL_SESSION_KEY,
  STUDENT_TEMP_SESSION_KEY,
} from "@/features/auth/api/auth-token-storage";
import { apiRequest, hasApiBase } from "@/lib/api-client";

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

  const localSession = parseJson<StudentSession | null>(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY), null);
  if (localSession) return localSession;

  return parseJson<StudentSession | null>(window.sessionStorage.getItem(STUDENT_TEMP_SESSION_KEY), null);
}

export function loginStudent(input: StudentLoginInput) {
  return loginStudentWithApi(input);
}

export async function loginStudentWithApi(input: StudentLoginInput) {
  if (!hasApiBase()) {
    throw new Error("API chưa được cấu hình nên không thể đăng nhập học sinh bằng tài khoản thật.");
  }

  const response = await apiRequest<{
    user?: { email?: string; fullName?: string; id?: string };
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      rememberMe: input.rememberMe,
    }),
  });

  const session: StudentSession = {
    accessToken: response.accessToken,
    className: "",
    email: response.user?.email ?? input.email.trim().toLowerCase(),
    expiresAt: response.expiresIn ? new Date(Date.now() + response.expiresIn * 1000).toISOString() : undefined,
    id: response.user?.id,
    loggedInAt: new Date().toISOString(),
    name: response.user?.fullName ?? input.email.trim(),
    portal: "elearning",
    refreshToken: response.refreshToken,
    rememberMe: input.rememberMe,
    viewerKind: "student",
  };

  if (!canUseStorage()) return session;

  if (input.rememberMe) {
    window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.removeItem(STUDENT_TEMP_SESSION_KEY);
    return session;
  }

  window.sessionStorage.setItem(STUDENT_TEMP_SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(STUDENT_LOCAL_SESSION_KEY);
  return session;
}

export function logoutStudentSession() {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(STUDENT_LOCAL_SESSION_KEY);
  window.sessionStorage.removeItem(STUDENT_TEMP_SESSION_KEY);
}
