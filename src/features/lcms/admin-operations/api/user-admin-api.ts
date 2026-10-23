import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest, getBackOfficePortal } from "@/lib/api-client";

export type AdminUserDetail = {
  id: string;
  email: string;
  fullName: string;
  avatar_url?: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  district?: string;
  job_title?: string;
  region?: string;
  social_links?: Record<string, unknown> | null;
  status: string;
  provider: string;
  accountType?: string;
  roles: string[];
  isProfileCompleted: boolean;
  last_login_at?: string;
  login_count?: number;
  tenant_id?: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdminProfileUpdate = {
  fullName: string;
  phone: string;
  jobTitle?: string;
  avatarUrl?: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  district?: string;
  region?: string;
  department?: string;
};

export function getAdminUser(userId: string, signal?: AbortSignal) {
  return apiRequest<{ account: { user: AdminUserDetail } }>(API_ENDPOINTS.adminUsers.detail(userId), {
    portal: getBackOfficePortal(),
    signal,
  }).then((response) => response.account.user);
}

export async function updateAdminUserProfile(userId: string, input: AdminProfileUpdate) {
  await apiRequest<unknown>(API_ENDPOINTS.adminUsers.detail(userId), {
    portal: getBackOfficePortal(),
    method: "PATCH",
    body: JSON.stringify({
      fullName: input.fullName,
      phone: input.phone,
      profile: input.jobTitle || input.department ? {
        departmentId: input.department,
        jobTitle: input.jobTitle,
      } : undefined,
    }),
  });

  return getAdminUser(userId);
}

export type AdminUserStatus = "ACTIVE" | "BLOCKED" | "BANNED" | "INACTIVE";

export async function updateAdminUserStatus(userId: string, status: AdminUserStatus) {
  await apiRequest<unknown>(API_ENDPOINTS.adminUsers.status(userId), {
    portal: getBackOfficePortal(),
    method: "PUT",
    body: JSON.stringify({ status }),
  });

  return getAdminUser(userId);
}

export async function assignAdminUserRoles(userId: string, roles: string[]) {
  await apiRequest<unknown>(API_ENDPOINTS.adminUsers.roles(userId), {
    portal: getBackOfficePortal(),
    method: "POST",
    body: JSON.stringify({ roles }),
  });

  return getAdminUser(userId);
}

