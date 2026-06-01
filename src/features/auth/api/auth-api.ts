import { ApiClientError, apiRequest } from "@/lib/api-client";
import type { AccountRole, AuthProvider, TeacherAccount } from "@/features/auth/types/auth-types";

const AUTH_V1_BASE = "/api/v1/auth";

export type LoginRequestDTO = {
  email: string;
  password: string;
  rememberMe: boolean;
  portal?: "admin" | "crm" | "lcms" | "lms" | "elearning";
  deviceId?: string;
  deviceName?: string;
  deviceFingerprint?: string;
};

export type RegisterRequestDTO = {
  fullName: string;
  email: string;
  password: string;
  department: string;
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

export type AuthAccountResponseDTO = Omit<TeacherAccount, "password"> & {
  password?: never;
};

export type AuthSessionResponseDTO = {
  account: AuthAccountResponseDTO;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  permissions?: string[];
  portals?: Array<"admin" | "crm" | "lcms" | "lms" | "elearning" | "*">;
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
  portals?: Array<"admin" | "crm" | "lcms" | "lms" | "elearning" | "*">;
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

  async register(input: RegisterRequestDTO) {
    const result = await apiRequest<BackendAuthSessionResponseDTO>("/api/lms/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return normalizeAuthSession(result);
  },

  logout() {
    return apiRequest<void>(`${AUTH_V1_BASE}/logout`, {
      method: "POST",
    });
  },

  async profile() {
    const result = await apiRequest<BackendProfileResponseDTO | AuthAccountResponseDTO>("/api/lms/auth/profile");
    return "role" in result ? result : mapProfileToAccount(result);
  },

  sessions() {
    return apiRequest<{ items: AuthSessionResponseDTO[] }>("/api/lms/auth/sessions");
  },

  async updateProfile(accountId: string, input: UpdateProfileRequestDTO) {
    const result = await apiRequest<BackendProfileResponseDTO>(`/api/lms/auth/accounts/${accountId}/profile`, {
      method: "PUT",
      body: JSON.stringify({
        fullName: input.fullName,
        phone: input.phone,
        department: input.department,
        title: input.title,
        jobTitle: input.title,
        avatarUrl: input.avatarUrl,
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

  updatePassword(accountId: string, input: UpdatePasswordRequestDTO) {
    return apiRequest<AuthAccountResponseDTO>(`/api/lms/auth/accounts/${accountId}/password`, {
      method: "PUT",
      body: JSON.stringify({ currentPassword: input.currentPassword, newPassword: input.nextPassword }),
    });
  },

  async loginWithProvider(provider: Extract<AuthProvider, "google">, rememberMe: boolean, idToken: string, portal: "admin" | "crm" | "lcms" | "lms" = "lms") {
    const result = await apiRequest<BackendAuthSessionResponseDTO>(`/api/lms/auth/providers/${provider}`, {
      portal,
      method: "POST",
      body: JSON.stringify({ rememberMe, idToken, portal }),
    });
    return normalizeAuthSession(result);
  },
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
    portals: result.portals,
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
    title: mapRole(profile?.roles) === "admin" ? "Quản trị viên" : "Giáo viên",
    features: ["LMS", "Kho học liệu", "Quiz bank", "Báo cáo"],
    isProfileCompleted: profile?.isProfileCompleted ?? profile?.is_profile_completed ?? true,
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



