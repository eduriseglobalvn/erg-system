import { ApiClientError, apiRequest } from "@/lib/api-client";
import { getApiBase } from "@/lib/platform";
import type { AccountRole, AuthProvider, TeacherAccount } from "@/platform/auth/types/auth-types";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";

const AUTH_V1_BASE = "/api/v1/auth";

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
    const result = await loginAtPath(`${AUTH_V1_BASE}/login`, input);
    return normalizeAuthSession(result);
  },

  logout() {
    return apiRequest<void>(`${AUTH_V1_BASE}/logout`, {
      method: "POST",
    });
  },

  logoutAll() {
    return apiRequest<{ revokedSessions: number }>(`${AUTH_V1_BASE}/logout-all`, { method: "POST" });
  },

  async bffSession(): Promise<AuthSessionResponseDTO> {
    const session = await apiRequest<BackendBffSessionDTO>(`${AUTH_V1_BASE}/session`);
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
    };
  },

  startOidcLogin(portal: LoginRequestDTO["portal"], returnTo?: string) {
    const apiBase = getApiBase();
    if (!apiBase) throw new Error("API base URL is not configured.");
    const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
    const query = new URLSearchParams({ portal: portal ?? "lms", returnTo: safeReturnTo });
    window.location.assign(`${apiBase}${AUTH_V1_BASE}/login?${query.toString()}`);
  },

  async profile() {
    const result = await apiRequest<BackendProfileResponseDTO | AuthAccountResponseDTO>("/api/v1/users/me");
    return "role" in result ? result : mapProfileToAccount(result);
  },

  sessions() {
    return apiRequest<{ items: AuthSessionResponseDTO[] }>("/api/v1/users/me/sessions");
  },

  async updateProfile(accountId: string, input: UpdateProfileRequestDTO) {
    void accountId;
    const result = await apiRequest<BackendProfileResponseDTO>("/api/v1/users/me", {
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
    const result = await apiRequest<BackendProfileResponseDTO>(`/api/lms/auth/accounts/${accountId}/avatar`, {
      method: "POST",
      body,
    });
    return mapProfileToAccount(result);
  },

  async updatePassword(accountId: string, input: UpdatePasswordRequestDTO) {
    void accountId;
    await apiRequest<{ message: string }>("/api/v1/users/me/password", {
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

function loginAtPath(path: string, input: LoginRequestDTO) {
  return apiRequest<BackendAuthSessionResponseDTO>(path, {
    portal: input.portal,
    method: "POST",
    body: JSON.stringify({ ...getLoginDeviceMetadata(), ...input }),
  });
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
    roles: result.roles,
    portals: result.portals,
    tenantId: result.tenantId ?? result.tenant_id,
  };
}

function readAccessToken(result: BackendAuthSessionResponseDTO) {
  return readTokenValue(result, "accessToken", "access_token", "token", "jwt");
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

const DEVICE_ID_STORAGE_KEY = "erg-device-id";

function getLoginDeviceMetadata() {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();

  return {
    deviceId,
    deviceName,
    deviceFingerprint: createDeviceFingerprint(deviceId, deviceName),
  };
}

function getOrCreateDeviceId() {
  const existing = readLocalStorage(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const next = createRandomId("device");
  writeLocalStorage(DEVICE_ID_STORAGE_KEY, next);
  return next;
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

function createRandomId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Login still works if browser storage is blocked.
  }
}



