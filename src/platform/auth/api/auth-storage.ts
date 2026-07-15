import type {
  AccountRole,
  AuthProvider,
  TeacherAccount,
} from "@/platform/auth/types/auth-types";
import type { AuthSessionResponseDTO } from "@/platform/auth/api/auth-api";
import {
  clearStoredAuthSessions,
  hasStoredAuthCredential,
  readTeacherSessionSnapshot,
  readStoredAuthSession,
  resolveCurrentPortal,
  setTeacherSessionSnapshot,
  TEACHER_LOCAL_SESSION_KEY,
  TEACHER_TEMP_SESSION_KEY,
  portalSessionKey,
  type StoredAuthSession,
  type StoredAuthIdentity,
} from "@/platform/auth/api/auth-token-storage";
import { clearCrossDomainSession } from "@/platform/auth/api/cross-domain-session";
import { tr } from "@/platform/i18n";
import { getApiBase } from "@/lib/platform";
import {
  getPersistedJsonValue,
  removePersistedJsonValue,
  setPersistedJsonValue,
} from "@/stores/persisted-store";

type AccountSession = StoredAuthIdentity & {
  loggedInAt: string;
};

const ACCOUNTS_KEY = "erg-learning.accounts";
export const AUTH_ACCOUNT_CHANGED_EVENT = "erg-auth-account-changed";
const defaultAccounts: TeacherAccount[] = [];

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

function writeAccounts(accounts: TeacherAccount[]) {
  if (!canUseStorage()) return;
  setPersistedJsonValue(ACCOUNTS_KEY, accounts);
}

export function listAccounts() {
  if (!canUseStorage()) return defaultAccounts;

  const stored = getPersistedJsonValue<Array<TeacherAccount & { password?: string }>>(ACCOUNTS_KEY, []);
  if (!stored.length) {
    writeAccounts(defaultAccounts);
    return defaultAccounts;
  }

  const sanitized = stored.map(({ password: _legacyPassword, ...account }) => account);
  if (stored.some((account) => "password" in account)) writeAccounts(sanitized);
  return sanitized;
}

function readSession(portal: StoredAuthSession["portal"] = resolveCurrentPortal()) {
  if (!canUseStorage()) return null;
  if (portal) return readStoredAuthSession(portal) as AccountSession | null;

  // Try SSO hydration first — if another portal set a cookie or passed an sso_token,
  // this writes the session into localStorage before we read it.
  const candidates = [
    parseJson<AccountSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "crm")), null),
    parseJson<AccountSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "admin")), null),
    parseJson<AccountSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lms")), null),
    parseJson<AccountSession | null>(window.sessionStorage.getItem(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lcms")), null),
    readTeacherSessionSnapshot() as AccountSession | null,
  ];
  const validSession = candidates.find(hasStoredAuthCredential);

  if (!validSession && candidates.some(Boolean)) {
    clearSession();
  }

  return validSession ?? null;
}

function writeSession(session: AccountSession) {
  setTeacherSessionSnapshot(session);
  if (!canUseStorage()) return;

  const portal = session.portal && session.portal !== "elearning" ? session.portal : "lms";
  const localKey = portalSessionKey(TEACHER_LOCAL_SESSION_KEY, portal);
  const tempKey = portalSessionKey(TEACHER_TEMP_SESSION_KEY, portal);
  window.sessionStorage.setItem(tempKey, JSON.stringify(session));
  removePersistedJsonValue(localKey);
}

function notifyAuthAccountChanged() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new CustomEvent(AUTH_ACCOUNT_CHANGED_EVENT));
}

function clearSession() {
  clearCrossDomainSession();
  clearStoredAuthSessions();
}

function saveAccount(nextAccount: TeacherAccount) {
  const existing = listAccounts();
  const accounts = existing.some((account) => account.id === nextAccount.id)
    ? existing.map((account) => (account.id === nextAccount.id ? nextAccount : account))
    : [...existing, nextAccount];
  writeAccounts(accounts);
  return nextAccount;
}

export function saveCurrentAccount(nextAccount: TeacherAccount) {
  const saved = saveAccount(nextAccount);
  notifyAuthAccountChanged();
  return saved;
}

export function getCurrentAccount(portal: StoredAuthSession["portal"] = resolveCurrentPortal()) {
  const session = readSession(portal);
  if (!session) return null;
  if (requiresServerSession() && !session.accessToken) return null;

  return listAccounts().find((account) => account.id === session.accountId) ?? accountFromSession(session);
}

function requiresServerSession() {
  return Boolean(getApiBase());
}

export function saveServerAuthSession(result: AuthSessionResponseDTO, rememberMe: boolean, portal: StoredAuthSession["portal"] = "lms") {
  const previousSession = readSession(portal);
  const isNewAuthSession = Boolean(result.accessToken || result.refreshToken);
  const accessToken = result.accessToken ?? previousSession?.accessToken;
  if (requiresServerSession() && !accessToken) {
    throw new Error("Backend login did not return an access token, so LMS APIs cannot be called.");
  }

  const jwtClaims = accessToken ? decodeJwtPayload(accessToken) : null;
  const jwtPortals = portalsFromJwtClaims(jwtClaims);
  const jwtPermissions = permissionsFromJwtClaims(jwtClaims);
  const jwtTenantId = typeof jwtClaims?.tenantId === "string"
    ? jwtClaims.tenantId
    : typeof jwtClaims?.tenant_id === "string"
      ? jwtClaims.tenant_id
      : undefined;
  const portals = result.portals ?? jwtPortals ?? (isNewAuthSession ? [portal] : previousSession?.portals ?? [portal]);
  const permissions = result.permissions ?? jwtPermissions ?? (isNewAuthSession ? [] : previousSession?.permissions ?? []);
  const deniedPermissions = result.deniedPermissions ?? (isNewAuthSession ? [] : previousSession?.deniedPermissions ?? []);
  const roles = result.roles ?? (isNewAuthSession ? [] : previousSession?.roles ?? []);
  const account: TeacherAccount = {
    ...result.account,
  };
  const existing = listAccounts();
  const nextAccounts = existing.some((entry) => entry.id === account.id)
    ? existing.map((entry) => (entry.id === account.id ? account : entry))
    : [...existing, account];

  writeAccounts(nextAccounts);
  writeSession({
    accountId: account.id,
    rememberMe,
    loggedInAt: new Date().toISOString(),
    accessToken,
    refreshToken: result.refreshToken ?? previousSession?.refreshToken,
    expiresAt: result.expiresAt ?? previousSession?.expiresAt,
    permissions,
    deniedPermissions,
    roles,
    portal,
    portals,
    tenantId: result.tenantId ?? jwtTenantId ?? previousSession?.tenantId,
  });
  notifyAuthAccountChanged();

  return account;
}

function accountFromSession(session: AccountSession): TeacherAccount | null {
  const claims = session.accessToken ? decodeJwtPayload(session.accessToken) : null;
  const email = (typeof claims?.email === "string" ? claims.email : "") || (typeof claims?.sub === "string" ? claims.sub : "");

  if (!email) return null;

  const roles = Array.isArray(claims?.roles) ? claims.roles.filter((role): role is string => typeof role === "string") : [];
  const role = mapRoleFromRoles(roles);
  const fullName =
    (typeof claims?.fullName === "string" ? claims.fullName : "") ||
    (typeof claims?.full_name === "string" ? claims.full_name : "") ||
    (typeof claims?.name === "string" ? claims.name : "") ||
    email;

  return {
    id: session.accountId || email,
    fullName,
    email,
    role,
    provider: "password",
    department: "ERG",
    title: role === "admin" ? "Quản trị viên" : "Giáo viên",
    features: ["LMS", "Kho học liệu", "Quiz bank", "Báo cáo"],
    createdAt: session.loggedInAt,
    lastLoginAt: session.loggedInAt,
  };
}

function mapRoleFromRoles(roles: string[]): AccountRole {
  const normalized = roles.map((role) => role.toLowerCase());
  if (normalized.some((role) => ["admin", "super_admin", "system.super_admin", "erg_super_admin", "global_admin", "lms_admin"].includes(role))) {
    return "admin";
  }
  if (normalized.some((role) => ["coordinator", "manager", "center_manager"].includes(role))) return "coordinator";
  return "teacher";
}

function portalsFromJwtClaims(payload: JwtPayload | null): StoredAuthSession["portals"] {
  const portals = Array.isArray(payload?.portals) ? payload.portals : [];
  const portal = typeof payload?.portal === "string" ? [payload.portal] : [];
  const normalized = [...portals, ...portal]
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter((item): item is "admin" | "crm" | "lcms" | "lms" | "elearning" | "*" =>
      item === "admin" || item === "crm" || item === "lcms" || item === "lms" || item === "elearning" || item === "*",
    );

  return normalized.length ? Array.from(new Set(normalized)) : undefined;
}

function permissionsFromJwtClaims(payload: JwtPayload | null): StoredAuthSession["permissions"] {
  const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
  const normalized = permissions
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);

  return normalized.length ? Array.from(new Set(normalized)) : undefined;
}

type JwtPayload = {
  email?: unknown;
  fullName?: unknown;
  full_name?: unknown;
  name?: unknown;
  sub?: unknown;
  tenantId?: unknown;
  tenant_id?: unknown;
  permissions?: unknown;
  portal?: unknown;
  portals?: unknown;
  roles?: unknown;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function logoutAccount() {
  clearSession();
  notifyAuthAccountChanged();
}

export function updateAccountProfile(
  accountId: string,
  payload: { fullName: string; phone?: string; department: string; title: string; avatarUrl?: string; bio?: string },
) {
  const account = listAccounts().find((entry) => entry.id === accountId);
  if (!account) {
    throw new Error(tr("auth.errorAccountNotFound"));
  }

  return saveAccount({
    ...account,
    fullName: payload.fullName.trim(),
    phone: payload.phone?.trim() ?? account.phone,
    department: payload.department.trim(),
    title: payload.title.trim(),
    avatarUrl: payload.avatarUrl?.trim() ?? account.avatarUrl,
    bio: payload.bio?.trim() ?? account.bio,
    isProfileCompleted: true,
  });
}

export function roleLabel(role: AccountRole) {
  switch (role) {
    case "admin":
      return tr("auth.roleAdmin");
    case "coordinator":
      return tr("auth.roleCoordinator");
    case "teacher":
    default:
      return tr("auth.roleTeacher");
  }
}

export function providerLabel(provider: AuthProvider) {
  switch (provider) {
    case "google":
      return tr("auth.providerGoogle");
    case "apple":
      return tr("auth.providerApple");
    case "password":
    default:
      return tr("auth.providerInternalEmail");
  }
}
