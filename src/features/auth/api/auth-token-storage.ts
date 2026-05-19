export type StoredAuthSession = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  permissions?: string[];
  portal?: "hoclieu" | "lms" | "elearning";
  portals?: Array<"hoclieu" | "lms" | "elearning" | "*">;
};

export type StoredAuthIdentity = StoredAuthSession & {
  accountId: string;
  rememberMe: boolean;
};

export const TEACHER_LOCAL_SESSION_KEY = "erg-learning.session";
export const TEACHER_TEMP_SESSION_KEY = "erg-learning.session.temp";
export const STUDENT_LOCAL_SESSION_KEY = "erg-learning.student-session";
export const STUDENT_TEMP_SESSION_KEY = "erg-learning.student-session.temp";

let teacherSessionSnapshot: StoredAuthIdentity | null = null;

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

export function hasStoredAuthCredential(session: StoredAuthSession | null | undefined): session is StoredAuthSession {
  if (!session) return false;

  if (session.expiresAt && Number.isFinite(Date.parse(session.expiresAt)) && Date.parse(session.expiresAt) <= Date.now()) {
    return false;
  }

  return Boolean(session.accessToken || ("accountId" in session && session.accountId));
}

export function setTeacherSessionSnapshot(session: StoredAuthIdentity) {
  teacherSessionSnapshot = session;
}

export function clearTeacherSessionSnapshot() {
  teacherSessionSnapshot = null;
}

export function readTeacherSessionSnapshot() {
  return teacherSessionSnapshot;
}

export function readStoredAuthSession(portal?: StoredAuthSession["portal"]): StoredAuthSession | null {
  if (!canUseStorage()) return null;

  const teacherSessions = [
    teacherSessionSnapshot,
    parseJson<StoredAuthSession | null>(window.localStorage.getItem(TEACHER_LOCAL_SESSION_KEY), null),
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(TEACHER_TEMP_SESSION_KEY), null),
  ].filter(hasStoredAuthCredential);

  const studentSessions = [
    parseJson<StoredAuthSession | null>(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY), null),
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(STUDENT_TEMP_SESSION_KEY), null),
  ].filter(hasStoredAuthCredential);

  if (!portal) {
    return teacherSessions[0] ?? studentSessions[0] ?? null;
  }

  if (portal === "elearning") {
    return studentSessions.find((s) => s.portal === "elearning") ?? studentSessions[0] ?? teacherSessions[0] ?? null;
  }

  // LMS, HocLieu share the same teacher token — the backend uses a single JWT for all teacher portals.
  // So for ANY teacher portal, just return the first teacher session that has a token.
  return teacherSessions.find((s) => Boolean(s?.accessToken)) ?? teacherSessions[0] ?? null;
}

export function getStoredAccessToken(portal?: StoredAuthSession["portal"]) {
  return readStoredAuthSession(portal)?.accessToken;
}
