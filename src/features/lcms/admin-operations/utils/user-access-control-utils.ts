import type {
  AccessManagedUser,
  AccessModule,
  AccessScopeOption,
  EffectiveAccess,
  UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import type { AdminUserDetail } from "@/features/lcms/admin-operations/api/user-admin-api";
import type { DraftPolicy } from "@/features/lcms/admin-operations/types/user-access-control";

export const ROOT_ADMIN_EMAIL = "admin@erg.edu.vn";

export function blankDraft(): DraftPolicy {
  return {
    scopeType: "",
    scopeId: "",
    roleGroup: "",
    modules: [],
  };
}

export function policyFromDraft(draft: DraftPolicy, scopes: AccessScopeOption[]): UserAccessPolicy | null {
  if (!draft.scopeType || !draft.scopeId || !draft.roleGroup || draft.modules.length === 0) return null;
  const scope = scopes.find((item) => item.scopeType === draft.scopeType && item.scopeId === draft.scopeId);
  return {
    scopeType: draft.scopeType,
    scopeId: draft.scopeId,
    scopeName: scope?.name,
    roleGroup: draft.roleGroup,
    modules: draft.modules,
  };
}

export function mergeDraftPolicy(policies: UserAccessPolicy[], draftPolicy: UserAccessPolicy | null) {
  if (!draftPolicy) return policies;
  return [
    ...policies.filter((policy) => !(policy.scopeType === draftPolicy.scopeType && policy.scopeId === draftPolicy.scopeId)),
    draftPolicy,
  ];
}

export function superAdminEffectiveAccess(modules?: AccessModule[]): EffectiveAccess {
  return {
    highestScope: "system",
    modules: modules?.map((module) => module.id) ?? ["lms", "resources", "media"],
    permissions: ["*"],
  };
}

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
