import { ApiClientError, apiRequest } from "@/lib/api-client";
import { getApiBase } from "@/lib/platform";
import type { AccountRole, AuthProvider, TeacherAccount } from "@/platform/auth/types/auth-types";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import { getOrCreateBrowserDeviceId } from "@/platform/auth/api/browser-device-id";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";
import { AUTH_PORTAL_HOST, getSharedAuthUrl } from "@/config/portal-urls";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { WORKSPACES, type Workspace } from "@/platform/workspaces/workspace-domain";

export type LoginRequestDTO = {
  identifier: string;
  password: string;
  rememberMe: boolean;
  portal?: "admin" | "crm" | "lcms" | "lms" | "elearning";
  deviceId?: string;
  deviceName?: string;
  deviceFingerprint?: string;
};

export type UpdateProfileRequestDTO = {
  fullName: string;
  phone: string;
  department: string;
  title: string;
  avatarUrl?: string;
  bio?: string;
};

export type UpdatePasswordRequestDTO = {
  currentPassword: string;
  nextPassword: string;
};

export type AuthAccountResponseDTO = TeacherAccount;

export type AuthSessionResponseDTO = {
  account: AuthAccountResponseDTO;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  permissions?: string[];
  deniedPermissions?: string[];
  roles?: string[];
  portals?: Array<"admin" | "crm" | "lcms" | "lms" | "elearning" | "*">;
  workspaces?: Workspace[];
  tenantId?: string;
};

type BackendProfileResponseDTO = {
  id: string;
  email: string;
  fullName: string;
  full_name?: string;
  phone?: string;
  avatarUrl?: string;
  avatar_url?: string;
  bio?: string;
  isProfileCompleted?: boolean;
  is_profile_completed?: boolean;
  lifecycle?: TeacherAccountLifecycle;
  jobTitle?: string;
  job_title?: string;
  provider?: string;
  accountType?: string;
  account_type?: string;
  roles?: string[];
  createdAt?: string;
  created_at?: string;
  status?: string;
};

type BackendAuthSessionResponseDTO = {
  user?: BackendProfileResponseDTO;
  account?: AuthAccountResponseDTO;
  accessToken?: string;
  access_token?: string;
  token?: string;
  jwt?: string;
  session?: BackendTokenContainerDTO;
  tokens?: BackendTokenContainerDTO;
  auth?: BackendTokenContainerDTO;
  refreshToken?: string;
  refresh_token?: string;
  expiresAt?: string;
  expires_at?: string;
  expiresIn?: number;
  expires_in?: number;
  permissions?: string[];
  deniedPermissions?: string[];
  roles?: string[];
  portals?: Array<"admin" | "crm" | "lcms" | "lms" | "elearning" | "*">;
  workspaces?: Workspace[];
  tenantId?: string;
  tenant_id?: string;
};

type BackendTokenContainerDTO = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  jwt?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresAt?: string;
  expires_at?: string;
  expiresIn?: number;
  expires_in?: number;
};

export const authApi = {
  async login(input: LoginRequestDTO) {
    const result = await loginAtPath(API_ENDPOINTS.auth.login, input);
    return normalizeAuthSession(result);
  },

  logout() {
    return apiRequest<void>(API_ENDPOINTS.auth.logout, {
      method: "POST",
    });
  },

  logoutAll() {
    return apiRequest<{ revokedSessions: number }>(API_ENDPOINTS.auth.logoutAll, { method: "POST" });
  },

  async bffSession(): Promise<AuthSessionResponseDTO> {
    const session = await apiRequest<BackendBffSessionDTO>(API_ENDPOINTS.auth.session);
    const email = session.profile?.email ?? session.userId;
    return {
      account: {
        id: session.userId,
        fullName: session.profile?.fullName ?? email,
        email,
        phone: "",
        avatarUrl: "",
        bio: "",
        role: mapRole(session.roles),
        provider: "password",
        department: session.accountType ?? "ERG",
        title: session.accessLevel === "admin" ? "Quản trị viên" : "Người dùng ERG",
        features: [],
        lifecycle: session.lifecycle,
        isProfileCompleted: session.lifecycle?.isProfileCompleted,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      permissions: session.permissions ?? [],
      deniedPermissions: session.deniedPermissions ?? [],
      roles: session.roles ?? [],
      portals: session.portals ?? [],
      workspaces: normalizeWorkspaces(session.workspaces),
    };
  },

  startOidcLogin(portal: LoginRequestDTO["portal"], returnTo?: string) {
    const apiBase = getApiBase();
    if (!apiBase) throw new Error("API base URL is not configured.");
    const safeReturnTo = sanitizeLocalRedirect(returnTo) ?? "/";
    if (typeof window !== "undefined" && window.location.hostname.endsWith(".erg.edu.vn") && window.location.hostname !== AUTH_PORTAL_HOST) {
      const authUrl = new URL(getSharedAuthUrl());
      authUrl.searchParams.set("portal", portal ?? "lms");
      authUrl.searchParams.set("returnTo", safeReturnTo);
      authUrl.searchParams.set("redirect", safeReturnTo);
      window.location.assign(authUrl.toString());
      return;
    }
    const query = new URLSearchParams({ portal: portal ?? "lms", returnTo: safeReturnTo });
    window.location.assign(`${apiBase}${API_ENDPOINTS.auth.login}?${query.toString()}`);
  },

  async profile() {
    const result = await apiRequest<BackendProfileResponseDTO | AuthAccountResponseDTO>(API_ENDPOINTS.account.me);
    return "role" in result ? result : mapProfileToAccount(result);
  },

  sessions() {
    return apiRequest<{ items: AuthSessionResponseDTO[] }>(API_ENDPOINTS.account.sessions);
  },

  async updateProfile(accountId: string, input: UpdateProfileRequestDTO) {
    void accountId;
    const result = await apiRequest<BackendProfileResponseDTO>(API_ENDPOINTS.account.me, {
      method: "PATCH",
      body: JSON.stringify({
        full_name: input.fullName,
        phone: input.phone,
        job_title: input.title,
        avatar_url: input.avatarUrl,
        bio: input.bio,
      }),
    });
    return mapProfileToAccount(result);
  },

  async uploadAvatar(accountId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    const result = await apiRequest<BackendProfileResponseDTO>(API_ENDPOINTS.account.avatar(accountId), {
      method: "POST",
      body,
    });
    return mapProfileToAccount(result);
  },

  async updatePassword(accountId: string, input: UpdatePasswordRequestDTO) {
    void accountId;
    await apiRequest<{ message: string }>(API_ENDPOINTS.account.password, {
      method: "PUT",
      body: JSON.stringify({ old_password: input.currentPassword, new_password: input.nextPassword }),
    });
    return authApi.profile();
  },

};

type BackendBffSessionDTO = {
  userId: string;
  tenantId: string;
  roles?: string[];
  permissions?: string[];
  deniedPermissions?: string[];
  portals?: AuthSessionResponseDTO["portals"];
  workspaces?: Workspace[];
  accountType?: string;
  accessLevel?: string;
  profile?: { email?: string; fullName?: string };
  lifecycle?: TeacherAccountLifecycle;
};

export function shouldRetrySharedAuthLogin(error: unknown) {
  if (!(error instanceof Error)) return false;
  const status = error instanceof ApiClientError ? error.status : undefined;
  if (status && status !== 401) return false;
  const message = error.message.toLowerCase();
  return message.includes("missing authorization") || message.includes("authorization header");
}

async function loginAtPath(path: string, input: LoginRequestDTO) {
  const result = await apiRequest<BackendAuthSessionResponseDTO>(path, {
    portal: input.portal,
    method: "POST",
    body: JSON.stringify({ ...getLoginDeviceMetadata(), ...input }),
  });
  return validateResponse(result, isBackendAuthSessionResponse, "auth.login");
}

/**
 * A login response is only usable if it carries an account identity (an
 * `account`, or a `user` with id + email) and some access token. Anything else
 * would blow up in `normalizeAuthSession`/`mapProfileToAccount` with a vague
 * error, so we reject it here at the boundary with a clear typed error.
 */
export function isBackendAuthSessionResponse(value: unknown): value is BackendAuthSessionResponseDTO {
  if (!isObject(value)) return false;
  const hasAccount = isObject(value.account) && isNonEmptyString((value.account as { id?: unknown }).id);
  const user = value.user;
  const hasUser = isObject(user) && isNonEmptyString(user.id) && isNonEmptyString(user.email);
  if (!hasAccount && !hasUser) return false;

  const tokenContainers = [value, value.session, value.tokens, value.auth];
  const hasToken = tokenContainers.some(
    (container) =>
      isObject(container) &&
      (isNonEmptyString(container.accessToken) ||
        isNonEmptyString(container.access_token) ||
        isNonEmptyString(container.token) ||
        isNonEmptyString(container.jwt)),
  );
  return hasToken;
}

export function normalizeAuthSession(result: BackendAuthSessionResponseDTO): AuthSessionResponseDTO {
  const account = result.account ?? mapProfileToAccount(result.user);
  const expiresIn = result.expiresIn ?? result.expires_in ?? result.session?.expiresIn ?? result.session?.expires_in ?? result.tokens?.expiresIn ?? result.tokens?.expires_in ?? result.auth?.expiresIn ?? result.auth?.expires_in;
  return {
    account,
    accessToken: readAccessToken(result),
    refreshToken: readRefreshToken(result),
    expiresAt: readExpiresAt(result) ?? expiresInToDate(expiresIn),
    permissions: result.permissions,
    deniedPermissions: result.deniedPermissions,
    // The legacy login response keeps roles under `user`. Preserve them at
    // the session boundary so workspace projection can recognize a verified
    // system-super-admin + wildcard grant without trusting an email/hostname.
    roles: result.roles ?? result.user?.roles,
    portals: result.portals,
    workspaces: normalizeWorkspaces(result.workspaces),
    tenantId: result.tenantId ?? result.tenant_id,
  };
}

function readAccessToken(result: BackendAuthSessionResponseDTO) {
  return readTokenValue(result, "accessToken", "access_token", "token", "jwt");
}

function normalizeWorkspaces(value: readonly Workspace[] | undefined): Workspace[] | undefined {
  if (value === undefined) return undefined;
  return Array.from(new Set(value.filter((workspace): workspace is Workspace => WORKSPACES.includes(workspace))));
}

function readRefreshToken(result: BackendAuthSessionResponseDTO) {
  return readTokenValue(result, "refreshToken", "refresh_token");
}

function readExpiresAt(result: BackendAuthSessionResponseDTO) {
  return readTokenValue(result, "expiresAt", "expires_at");
}

function readTokenValue(result: BackendAuthSessionResponseDTO, ...keys: Array<keyof BackendTokenContainerDTO>) {
  for (const source of [result, result.session, result.tokens, result.auth]) {
    if (!source) continue;

    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return undefined;
}

function mapProfileToAccount(profile?: BackendProfileResponseDTO): AuthAccountResponseDTO {
  if (!profile?.id || !profile.email) {
    throw new Error("Backend auth response is missing account profile data.");
  }

  return {
    id: profile.id,
    fullName: profile.fullName ?? profile.full_name ?? profile.email,
    email: profile.email,
    phone: profile?.phone ?? "",
    avatarUrl: profile?.avatarUrl ?? profile?.avatar_url ?? "",
    bio: profile?.bio ?? "",
    role: mapRole(profile?.roles),
    provider: mapProvider(profile?.provider),
    roles: profile.roles,
    department: profile?.accountType ?? profile?.account_type ?? "ERG",
    title: profile?.jobTitle ?? profile?.job_title ?? (mapRole(profile?.roles) === "admin" ? "Quản trị viên" : "Giáo viên"),
    features: ["LMS", "Kho học liệu", "Quiz bank", "Báo cáo"],
    lifecycle: profile.lifecycle,
    isProfileCompleted: profile.lifecycle?.isProfileCompleted ?? profile.isProfileCompleted ?? profile.is_profile_completed,
    status: profile?.status ?? "ACTIVE",
    createdAt: profile?.createdAt ?? profile?.created_at ?? new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

function mapRole(roles?: string[]): AccountRole {
  const normalized = (roles ?? []).map((role) => role.toLowerCase());
  if (
    normalized.some((role) =>
      [
        "admin",
        "super_admin",
        "super-admin",
        "system.super_admin",
        "erg_admin",
        "erg_super_admin",
        "global_admin",
        "lms_admin",
      ].includes(role),
    )
  ) {
    return "admin";
  }
  if (normalized.some((role) => ["coordinator", "manager", "center_manager"].includes(role))) return "coordinator";
  return "teacher";
}

function mapProvider(provider?: string): AuthProvider {
  if (provider === "google") return provider;
  return "password";
}

function expiresInToDate(expiresIn?: number) {
  if (!expiresIn) return undefined;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

function getLoginDeviceMetadata() {
  const deviceId = getOrCreateBrowserDeviceId();
  const deviceName = getDeviceName();

  return {
    deviceId,
    deviceName,
    deviceFingerprint: createDeviceFingerprint(deviceId, deviceName),
  };
}

function getDeviceName() {
  if (typeof navigator === "undefined") return "Unknown browser";

  const platform = navigator.platform || "Unknown platform";
  const userAgent = navigator.userAgent || "Unknown browser";
  return `${platform} - ${userAgent}`;
}

function createDeviceFingerprint(deviceId: string, deviceName: string) {
  const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "" : "";
  const language = typeof navigator !== "undefined" ? navigator.language ?? "" : "";
  return hashString(`${deviceId}|${deviceName}|${timezone}|${language}`);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `fp-${Math.abs(hash).toString(36)}`;
}

