import type { AccessManagedUser } from "@/features/lcms/admin-operations/api/access-management-api";
import type { AdminUserDetail } from "@/features/lcms/admin-operations/api/user-admin-api";
import type { ProfileDraft } from "@/features/lcms/admin-operations/types/user-access-control";

export const ROOT_ADMIN_EMAIL = "admin@erg.edu.vn";

export function mergeUser(listUser?: AccessManagedUser, detail?: AdminUserDetail | null) {
  return {
    id: detail?.id ?? listUser?.id ?? "",
    email: detail?.email ?? listUser?.email ?? "",
    fullName: detail?.fullName ?? listUser?.fullName ?? "",
    avatarUrl: detail?.avatarUrl ?? detail?.avatar_url ?? listUser?.avatarUrl,
    phone: detail?.phone ?? listUser?.phone ?? "",
    status: detail?.status ?? listUser?.status ?? "",
    provider: detail?.provider ?? "local",
    accountType: detail?.accountType ?? listUser?.accountType ?? "erg",
    roles: detail?.roles ?? listUser?.roles ?? [],
    isProfileCompleted: detail?.isProfileCompleted ?? listUser?.isProfileCompleted ?? false,
    jobTitle: detail?.job_title ?? "",
    bio: detail?.bio ?? "",
    gender: detail?.gender ?? "",
    dateOfBirth: detail?.date_of_birth ?? "",
    address: detail?.address ?? "",
    city: detail?.city ?? "",
    district: detail?.district ?? "",
    region: detail?.region ?? "",
    lastLoginAt: detail?.last_login_at,
    loginCount: detail?.login_count,
    tenantId: detail?.tenant_id,
    createdAt: detail?.createdAt ?? listUser?.createdAt ?? "",
    updatedAt: detail?.updatedAt,
  };
}

export type MergedAccessUser = ReturnType<typeof mergeUser>;

export function sortUsers(items: AccessManagedUser[]) {
  return [...items].sort((a, b) => {
    const superDiff = Number(isSuperAdmin(b)) - Number(isSuperAdmin(a));
    if (superDiff !== 0) return superDiff;
    const activeDiff = Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE");
    if (activeDiff !== 0) return activeDiff;
    return (a.fullName || a.email).localeCompare(b.fullName || b.email, "vi");
  });
}

export function isSuperAdmin(user?: Pick<AccessManagedUser, "email" | "roles"> | MergedAccessUser | null) {
  const roles = user?.roles?.map((role) => role.toLowerCase()) ?? [];
  return isRootAdmin(user) || roles.some((role) => role === "super_admin" || role === "super-admin" || role === "system.super_admin" || role === "erg_super_admin");
}

export function isRootAdmin(user?: Pick<AccessManagedUser, "email"> | MergedAccessUser | null) {
  return user?.email?.trim().toLowerCase() === ROOT_ADMIN_EMAIL;
}

export function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Deactive/nghỉ việc";
    case "BANNED":
      return "Banned";
    case "BLOCKED":
    case "DISABLED":
      return "Đã khóa";
    case "PENDING":
      return "Chờ kích hoạt";
    default:
      return status || "Không rõ";
  }
}

export function formatDateTime(value?: string) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export function initials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export const EMPTY_PROFILE_DRAFT: ProfileDraft = {
  fullName: "", phone: "", jobTitle: "", avatarUrl: "", bio: "", gender: "",
  dateOfBirth: "", address: "", city: "", district: "", region: "",
};

export function profileDraftFromDetail(detail: AdminUserDetail): ProfileDraft {
  return {
    fullName: detail.fullName ?? "",
    phone: detail.phone ?? "",
    jobTitle: detail.job_title ?? "",
    avatarUrl: detail.avatar_url ?? detail.avatarUrl ?? "",
    bio: detail.bio ?? "",
    gender: detail.gender ?? "",
    dateOfBirth: detail.date_of_birth ? detail.date_of_birth.slice(0, 10) : "",
    address: detail.address ?? "",
    city: detail.city ?? "",
    district: detail.district ?? "",
    region: detail.region ?? "",
  };
}

/** Writes the list-visible fields of a freshly saved detail back into the member list. */
export function mergeDetailIntoUsers(users: AccessManagedUser[], detail: AdminUserDetail): AccessManagedUser[] {
  return sortUsers(
    users.map((user) =>
      user.id === detail.id
        ? { ...user, fullName: detail.fullName, phone: detail.phone, status: detail.status, roles: detail.roles, isProfileCompleted: detail.isProfileCompleted }
        : user,
    ),
  );
}
