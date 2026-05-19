import { apiRequest } from "@/lib/api-client";

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

export function getAdminUser(userId: string) {
  return apiRequest<AdminUserDetail>(`/api/users/${encodeURIComponent(userId)}`);
}

export async function updateAdminUserProfile(userId: string, input: AdminProfileUpdate) {
  await apiRequest<AdminUserDetail>(`/api/lms/auth/accounts/${encodeURIComponent(userId)}/profile`, {
    method: "PUT",
    body: JSON.stringify({
      fullName: input.fullName,
      phone: input.phone,
      jobTitle: input.jobTitle,
      avatarUrl: input.avatarUrl,
      bio: input.bio,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      address: input.address,
      city: input.city,
      district: input.district,
      region: input.region,
    }),
  });

  return getAdminUser(userId);
}

export async function updateAdminUserStatus(userId: string, status: "ACTIVE" | "BLOCKED") {
  await apiRequest<{ message: string }>(`/api/users/${encodeURIComponent(userId)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

  return getAdminUser(userId);
}

export async function assignAdminUserRoles(userId: string, roles: string[]) {
  await apiRequest<{ message: string }>(`/api/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST",
    body: JSON.stringify({ roles }),
  });

  return getAdminUser(userId);
}

