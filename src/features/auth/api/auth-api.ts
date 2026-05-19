import { ApiClientError, apiRequest } from "@/lib/api-client";
import type { AccountRole, AuthProvider, TeacherAccount } from "@/features/auth/types/auth-types";

export type LoginRequestDTO = {
  email: string;
  password: string;
  rememberMe: boolean;
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
  portals?: Array<"hoclieu" | "lms" | "elearning" | "*">;
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
  portals?: Array<"hoclieu" | "lms" | "elearning" | "*">;
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
    const result = await loginWithFallback(input);
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
    return apiRequest<void>("/api/lms/auth/logout", {
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

  async loginWithProvider(provider: Extract<AuthProvider, "google">, rememberMe: boolean, idToken: string) {
    const result = await apiRequest<BackendAuthSessionResponseDTO>(`/api/lms/auth/providers/${provider}`, {
      method: "POST",
      body: JSON.stringify({ rememberMe, idToken }),
    });
    return normalizeAuthSession(result);
  },
};

async function loginWithFallback(input: LoginRequestDTO) {
  try {
    return await loginAtPath("/api/lms/auth/login", input);
  } catch (error) {
    if (!shouldRetrySharedAuthLogin(error)) {
      throw error;
    }

    return loginAtPath("/api/auth/login", input);
  }
}

function loginAtPath(path: string, input: LoginRequestDTO) {
  return apiRequest<BackendAuthSessionResponseDTO>(path, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function shouldRetrySharedAuthLogin(error: unknown) {
  return (
    error instanceof ApiClientError &&
    error.status === 401 &&
    error.message.toLowerCase().includes("missing authorization header")
  );
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
  return {
    id: profile?.id ?? "teacher-api",
    fullName: profile?.fullName ?? profile?.full_name ?? "ERG Teacher",
    email: profile?.email ?? "teacher@erg.vn",
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



