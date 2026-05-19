import type {
  AccountRole,
  AuthProvider,
  TeacherAccount,
} from "@/features/auth/types/auth-types";
import type { AuthSessionResponseDTO } from "@/features/auth/api/auth-api";
import {
  clearTeacherSessionSnapshot,
  hasStoredAuthCredential,
  readTeacherSessionSnapshot,
  setTeacherSessionSnapshot,
  TEACHER_LOCAL_SESSION_KEY,
  TEACHER_TEMP_SESSION_KEY,
  type StoredAuthSession,
  type StoredAuthIdentity,
} from "@/features/auth/api/auth-token-storage";
import { clearCrossDomainSession, hydrateSessionFromCookie, saveCrossDomainSession } from "@/features/auth/api/cross-domain-session";
import { tr } from "@/features/i18n";
import { getApiBase } from "@/lib/platform";

type AccountSession = StoredAuthIdentity & {
  loggedInAt: string;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  department: string;
};

type LoginInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const ACCOUNTS_KEY = "erg-learning.accounts";
export const AUTH_ACCOUNT_CHANGED_EVENT = "erg-auth-account-changed";
const defaultAccounts: TeacherAccount[] = [];

function canUseStorage() {
  return typeof window !== "undefined";
}

let ssoHydrationDone = false;
function hydrateSessionFromCookieOnce() {
  if (ssoHydrationDone) return;
  ssoHydrationDone = true;
  hydrateSessionFromCookie(TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY);
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
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function listAccounts() {
  if (!canUseStorage()) return defaultAccounts;

  const stored = parseJson<TeacherAccount[]>(window.localStorage.getItem(ACCOUNTS_KEY), []);
  if (!stored.length) {
    writeAccounts(defaultAccounts);
    return defaultAccounts;
  }

  return stored;
}

function readSession() {
  if (!canUseStorage()) return null;

  // Try SSO hydration first — if another portal set a cookie or passed an sso_token,
  // this writes the session into localStorage before we read it.
  hydrateSessionFromCookieOnce();

  const candidates = [
    parseJson<AccountSession | null>(window.localStorage.getItem(TEACHER_LOCAL_SESSION_KEY), null),
    parseJson<AccountSession | null>(window.sessionStorage.getItem(TEACHER_TEMP_SESSION_KEY), null),
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

  if (session.rememberMe) {
    window.localStorage.setItem(TEACHER_LOCAL_SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.removeItem(TEACHER_TEMP_SESSION_KEY);
  } else {
    window.sessionStorage.setItem(TEACHER_TEMP_SESSION_KEY, JSON.stringify(session));
    window.localStorage.removeItem(TEACHER_LOCAL_SESSION_KEY);
  }

  // Mirror to cross-domain cookie for SSO between lms/hoclieu subdomains
  saveCrossDomainSession(session);
}

function notifyAuthAccountChanged() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new CustomEvent(AUTH_ACCOUNT_CHANGED_EVENT));
}

function clearSession() {
  clearTeacherSessionSnapshot();
  clearCrossDomainSession();
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TEACHER_LOCAL_SESSION_KEY);
  window.sessionStorage.removeItem(TEACHER_TEMP_SESSION_KEY);
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

export function getCurrentAccount() {
  const session = readSession();
  if (!session) return null;
  if (requiresServerSession() && !session.accessToken) return null;

  return listAccounts().find((account) => account.id === session.accountId) ?? accountFromSession(session);
}

function requiresServerSession() {
  return Boolean(getApiBase());
}

export function saveServerAuthSession(result: AuthSessionResponseDTO, rememberMe: boolean) {
  const previousSession = readSession();
  const isNewAuthSession = Boolean(result.accessToken || result.refreshToken);
  const accessToken = result.accessToken ?? previousSession?.accessToken;
  if (requiresServerSession() && !accessToken) {
    throw new Error("Backend login did not return an access token, so LMS APIs cannot be called.");
  }

  const jwtClaims = accessToken ? decodeJwtPayload(accessToken) : null;
  const jwtPortals = portalsFromJwtClaims(jwtClaims);
  const jwtPermissions = permissionsFromJwtClaims(jwtClaims);
  const portals = result.portals ?? jwtPortals ?? (isNewAuthSession ? ["lms", "hoclieu"] : previousSession?.portals ?? ["lms", "hoclieu"]);
  const permissions = result.permissions ?? jwtPermissions ?? (isNewAuthSession ? [] : previousSession?.permissions ?? []);
  const account: TeacherAccount = {
    ...result.account,
    password: "",
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
    portal: primaryPortalFromPortals(portals),
    portals,
  });
  notifyAuthAccountChanged();

  return account;
}

function primaryPortalFromPortals(portals: StoredAuthSession["portals"]): StoredAuthSession["portal"] | undefined {
  if (!portals?.length) return undefined;
  if (portals.includes("hoclieu")) return "hoclieu";
  if (portals.includes("lms")) return "lms";
  if (portals.includes("elearning")) return "elearning";
  if (portals.includes("*")) return "lms";
  return undefined;
}

function accountFromSession(session: AccountSession): TeacherAccount | null {
  const claims = session.accessToken ? decodeJwtPayload(session.accessToken) : null;
  const email = (typeof claims?.email === "string" ? claims.email : "") || (typeof claims?.sub === "string" ? claims.sub : "");

  if (!email && !session.accountId) return null;

  const roles = Array.isArray(claims?.roles) ? claims.roles.filter((role): role is string => typeof role === "string") : [];
  const role = mapRoleFromRoles(roles);

  return {
    id: session.accountId,
    fullName: role === "admin" ? "Super Administrator" : "ERG Teacher",
    email,
    password: "",
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
    .filter((item): item is "hoclieu" | "lms" | "elearning" | "*" =>
      item === "hoclieu" || item === "lms" || item === "elearning" || item === "*",
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
  sub?: unknown;
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

export function registerAccount(input: RegisterInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const accounts = listAccounts();

  if (accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
    throw new Error(tr("auth.errorEmailExists"));
  }

  const nextAccount: TeacherAccount = {
    id: `account-${Math.random().toString(36).slice(2, 10)}`,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    password: input.password,
    role: "teacher",
    provider: "password",
    department: input.department.trim(),
    title: "Giảng viên mới",
    features: [
      tr("auth.defaultCapabilityDashboard"),
      tr("auth.defaultCapabilityMaterials"),
      tr("auth.defaultCapabilityClasses"),
      tr("auth.defaultCapabilityAccount"),
    ],
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };

  writeAccounts([...accounts, nextAccount]);
  return nextAccount;
}

export function loginWithPassword(input: LoginInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const account = listAccounts().find((entry) => entry.email.toLowerCase() === normalizedEmail);

  if (!account || account.password !== input.password) {
    throw new Error(tr("auth.errorEmailPasswordWrong"));
  }

  const nextAccount = saveAccount({
    ...account,
    lastLoginAt: new Date().toISOString(),
  });

  writeSession({
    accountId: nextAccount.id,
    rememberMe: input.rememberMe,
    loggedInAt: new Date().toISOString(),
    portal: "lms",
  });
  notifyAuthAccountChanged();

  return nextAccount;
}

export function loginWithProvider(provider: Extract<AuthProvider, "google" | "apple">, rememberMe: boolean) {
  const providerEmail = provider === "google" ? "teacher.google@erg.vn" : "teacher.apple@erg.vn";
  const providerName =
    provider === "google" ? "Giảng viên Google ERG" : "Giảng viên Apple ERG";
  const providerDepartment =
    provider === "google" ? "Khối học liệu số" : "Khối đào tạo nội bộ";

  const accounts = listAccounts();
  const existing = accounts.find((account) => account.email === providerEmail);

  const account =
    existing ??
    ({
      id: `provider-${provider}`,
      fullName: providerName,
      email: providerEmail,
      password: "",
      role: "teacher",
      provider,
      department: providerDepartment,
      title: "Giảng viên tích hợp",
      features: [
        tr("auth.defaultCapabilityDashboard"),
        tr("auth.defaultCapabilityMaterials"),
        tr("auth.defaultCapabilityClasses"),
        tr("auth.defaultCapabilityAccount"),
      ],
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    } satisfies TeacherAccount);

  if (!existing) {
    writeAccounts([...accounts, account]);
  }

  const nextAccount = saveAccount({
    ...account,
    lastLoginAt: new Date().toISOString(),
  });

  writeSession({
    accountId: nextAccount.id,
    rememberMe,
    loggedInAt: new Date().toISOString(),
    portal: "lms",
  });
  notifyAuthAccountChanged();

  return nextAccount;
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

export function updateAccountPassword(accountId: string, currentPassword: string, nextPassword: string) {
  const account = listAccounts().find((entry) => entry.id === accountId);
  if (!account) {
    throw new Error(tr("auth.errorAccountNotFound"));
  }

  if (account.provider !== "password") {
    throw new Error(tr("auth.errorLinkedPasswordChange"));
  }

  if (account.password !== currentPassword) {
    throw new Error(tr("auth.errorCurrentPasswordWrong"));
  }

  return saveAccount({
    ...account,
    password: nextPassword,
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
