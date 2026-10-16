import { getPersistedJsonValue, removePersistedJsonValue } from "@/stores/persisted-store";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

export type StoredAuthSession = {
  accountEmail?: string;
  accessToken?: string;
  loggedInAt?: string;
  refreshToken?: string;
  tenantId?: string;
  expiresAt?: string;
  permissions?: string[];
  deniedPermissions?: string[];
  roles?: string[];
  /** Canonical capabilities projected by the verified backend session. */
  workspaces?: Workspace[];
  portal?: "admin" | "crm" | "lcms" | "lms" | "elearning";
  portals?: Array<"admin" | "crm" | "lcms" | "lms" | "elearning" | "*">;
};

export type StoredAuthIdentity = StoredAuthSession & {
  accountId: string;
  rememberMe: boolean;
};

export const TEACHER_LOCAL_SESSION_KEY = "erg-learning.session";
export const TEACHER_TEMP_SESSION_KEY = "erg-learning.session.temp";
export const STUDENT_LOCAL_SESSION_KEY = "erg-learning.student-session";
export const STUDENT_TEMP_SESSION_KEY = "erg-learning.student-session.temp";
export const AUTH_SESSION_FALLBACK_MAX_AGE_MS = 12 * 60 * 60 * 1000;
export const AUTH_SESSION_STORAGE_CHANGED_EVENT = "erg-auth-session-storage-changed";

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
  if (!session.accessToken) return false;

  const expiresAt = readSessionExpiry(session);
  if (expiresAt && expiresAt <= Date.now()) {
    return false;
  }

  if (!expiresAt) {
    const loggedInAt = parseDate(session.loggedInAt);
    if (!loggedInAt) return false;
    if (loggedInAt + AUTH_SESSION_FALLBACK_MAX_AGE_MS <= Date.now()) return false;
  }

  return true;
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

  if (!portal) {
    return readStoredAuthSession(resolveCurrentPortal());
  }

  const teacherSessions = [
    teacherSessionSnapshot,
    legacyPersistentSession<StoredAuthSession>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "crm")),
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "crm")), null),
    legacyPersistentSession<StoredAuthSession>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "admin")),
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "admin")), null),
    legacyPersistentSession<StoredAuthSession>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms")),
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lms")), null),
    legacyPersistentSession<StoredAuthSession>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms")),
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lcms")), null),
  ].filter(hasStoredAuthCredential);

  const studentSessions = [
    parseJson<StoredAuthSession | null>(window.sessionStorage.getItem(STUDENT_TEMP_SESSION_KEY), null),
  ].filter(hasStoredAuthCredential);

  if (portal === "elearning") {
    // The canonical /student route may reuse a teacher/admin credential.
    // Workspace guards and the backend still enforce the actual entitlement.
    return studentSessions.find((session) => session.portal === "elearning") ?? studentSessions[0] ?? teacherSessions[0] ?? null;
  }

  return teacherSessions.find((session) => sessionMatchesRequestedPortal(session, portal)) ?? null;
}

export function getStoredAccessToken(portal?: StoredAuthSession["portal"]) {
  return readStoredAuthSession(portal)?.accessToken;
}

export function readStoredRefreshSession(portal?: StoredAuthSession["portal"]): StoredAuthIdentity | null {
  if (!canUseStorage()) return null;

  const targetPortal = portal ?? resolveCurrentPortal();
  const session = readRawStoredAuthSession(targetPortal);
  if (!session?.refreshToken) return null;

  return session;
}

export function updateStoredAuthSessionTokens(
  portal: StoredAuthSession["portal"],
  tokens: {
    accessToken: string;
    expiresAt?: string;
    refreshToken?: string;
  },
) {
  if (!tokens.accessToken) return null;

  const session = readStoredRefreshSession(portal) ?? readRawStoredAuthSession(portal);
  if (!session) return null;

  const nextSession: StoredAuthIdentity = {
    ...session,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? session.refreshToken,
    expiresAt: tokens.expiresAt ?? session.expiresAt,
  };

  writeStoredAuthIdentity(nextSession);
  return nextSession;
}

export function clearStoredAuthSessions() {
  clearTeacherSessionSnapshot();
  if (!canUseStorage()) return;

  removePersistedJsonValue(TEACHER_LOCAL_SESSION_KEY);
  window.sessionStorage.removeItem(TEACHER_TEMP_SESSION_KEY);
  for (const portal of ["admin", "crm", "lms", "lcms"] as const) {
    removePersistedJsonValue(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, portal));
    window.sessionStorage.removeItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, portal));
  }
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_STORAGE_CHANGED_EVENT, { detail: null }));
}

export function readStoredAuthIdentity(portal?: StoredAuthSession["portal"]) {
  return readRawStoredAuthSession(portal);
}

export function writeStoredAuthIdentity(session: StoredAuthIdentity) {
  writeRawStoredAuthSession(session);
  if (canUseStorage()) {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_STORAGE_CHANGED_EVENT, { detail: session }));
  }
}

export function portalSessionKey(baseKey: string, portal: Exclude<NonNullable<StoredAuthSession["portal"]>, "elearning">) {
  return `${baseKey}.${portal}`;
}

export function resolveCurrentPortal(): NonNullable<StoredAuthSession["portal"]> {
  if (!canUseStorage()) return "lms";

  const host = (window.location.hostname ?? "").toLowerCase();
  const pathname = (window.location.pathname ?? "").toLowerCase();
  if (host.startsWith("crm.")) return "crm";
  if (host.startsWith("elearning.")) return "elearning";
  if (host.startsWith("lcms.")) return "lcms";
  if (host.startsWith("lms.")) return pathname.startsWith("/admin") ? "lcms" : "lms";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/admin") || pathname.startsWith("/lcms")) return "lcms";
  // /student is a shared workspace route on the canonical LMS host. Keep
  // the teacher/admin credential selected until the route guard projects it.
  if (pathname.startsWith("/student")) return "lms";
  return "lms";
}

function sessionMatchesPortal(session: StoredAuthSession, portal: Exclude<NonNullable<StoredAuthSession["portal"]>, "elearning">) {
  if (session.portal === portal) return true;

  const portals = session.portals ?? [];
  if (portals.includes("*") || portals.includes(portal)) return true;

  return false;
}

function sessionMatchesRequestedPortal(session: StoredAuthSession, portal: Exclude<NonNullable<StoredAuthSession["portal"]>, "elearning">) {
  if (sessionMatchesPortal(session, portal)) return true;
  if (portal !== "lms" || !isSharedStudentPath()) return false;

  const portals = session.portals ?? [];
  return session.portal === "admin" || session.portal === "lcms" || portals.includes("admin") || portals.includes("lcms");
}

function isSharedStudentPath() {
  const pathname = (window.location.pathname ?? "").toLowerCase();
  const host = (window.location.hostname ?? "").toLowerCase();
  return pathname.startsWith("/student") && !host.startsWith("elearning.");
}

function readRawStoredAuthSession(portal?: StoredAuthSession["portal"]): StoredAuthIdentity | null {
  if (!canUseStorage()) return null;

  const targetPortal = portal ?? resolveCurrentPortal();
  const candidates = [
    teacherSessionSnapshot,
    legacyPersistentSession<StoredAuthIdentity>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "crm")),
    parseJson<StoredAuthIdentity | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "crm")), null),
    legacyPersistentSession<StoredAuthIdentity>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "admin")),
    parseJson<StoredAuthIdentity | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "admin")), null),
    legacyPersistentSession<StoredAuthIdentity>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms")),
    parseJson<StoredAuthIdentity | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lms")), null),
    legacyPersistentSession<StoredAuthIdentity>(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms")),
    parseJson<StoredAuthIdentity | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lcms")), null),
  ].filter((session): session is StoredAuthIdentity => Boolean(session?.accountId));

  if (targetPortal === "elearning") {
    // Refreshing a shared teacher/admin credential must update its original
    // portal slot; writeStoredAuthIdentity uses session.portal for that.
    return candidates.find(canRefreshStudentViewerSession) ?? null;
  }

  return candidates.find((session) => sessionMatchesRequestedPortal(session, targetPortal)) ?? null;
}

function canRefreshStudentViewerSession(session: StoredAuthIdentity) {
  const workspaces = session.workspaces ?? [];
  const portals = session.portals ?? [];
  return workspaces.includes("STUDENT") || portals.includes("*") || portals.includes("elearning") || ["admin", "lcms", "lms"].includes(session.portal ?? "");
}

function writeRawStoredAuthSession(session: StoredAuthIdentity) {
  setTeacherSessionSnapshot(session);
  if (!canUseStorage()) return;

  const portal = session.portal && session.portal !== "elearning" ? session.portal : "lms";
  const localKey = portalSessionKey(TEACHER_LOCAL_SESSION_KEY, portal);
  const tempKey = portalSessionKey(TEACHER_TEMP_SESSION_KEY, portal);

  window.sessionStorage.setItem(tempKey, JSON.stringify(session));
  removePersistedJsonValue(localKey);
}

function legacyPersistentSession<T>(key: string): T | null {
  if (import.meta.env.VITE_AUTH_MODE === "oidc-bff") return null;
  return getPersistedJsonValue<T | null>(key, null);
}

function readSessionExpiry(session: StoredAuthSession) {
  const storedExpiry = parseDate(session.expiresAt);
  if (storedExpiry) return storedExpiry;

  return readJwtExpiry(session.accessToken);
}

function parseDate(value?: string) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function readJwtExpiry(token?: string) {
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = window.atob(padded);
    const claims = JSON.parse(decoded) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}
