import { apiRequest } from "@/lib/api-client";

export type AccessScopeType = "system" | "center" | "school";

export type AccessPolicySummary = {
  scopeCount: number;
  modules: string[];
  roleGroups: string[];
  highestScope: AccessScopeType | "none";
};

export type AccessManagedUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  status: string;
  accountType?: string;
  roles: string[];
  isProfileCompleted: boolean;
  accessSummary: AccessPolicySummary;
  createdAt: string;
};

export type AccessScopeOption = {
  scopeType: AccessScopeType;
  scopeId: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
};

export type AccessRoleGroup = {
  id: string;
  name: string;
  description: string;
  scopeTypes: AccessScopeType[];
  permissions: string[];
};

export type AccessModule = {
  id: string;
  name: string;
  description: string;
};

export type UserAccessPolicy = {
  id?: string;
  scopeType: AccessScopeType;
  scopeId: string;
  scopeName?: string;
  roleGroup: string;
  modules: string[];
  permissions?: string[];
};

export type EffectiveAccess = {
  highestScope: AccessPolicySummary["highestScope"];
  modules: string[];
  permissions: string[];
  warnings?: string[];
};

export type AccessManagementOptions = {
  scopes: AccessScopeOption[];
  roleGroups: AccessRoleGroup[];
  modules: AccessModule[];
};

export type AccessScopeList = {
  items: AccessScopeOption[];
  total: number;
  page: number;
  limit: number;
};

export type AccessManagementUserList = {
  items: AccessManagedUser[];
  total: number;
  page: number;
  limit: number;
};

export type UserAccessDetail = {
  user: AccessManagedUser;
  policies: UserAccessPolicy[];
  effective: EffectiveAccess;
  assignable: AccessManagementOptions;
};

export type SaveUserAccessRequest = {
  policies: UserAccessPolicy[];
};

export async function listAccessManagedUsers(params: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.role && params.role !== "all") search.set("role", params.role);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));

  return apiRequest<AccessManagementUserList>(`/api/lms/access-management/users?${search.toString()}`);
}

export function getAccessManagementOptions() {
  return apiRequest<AccessManagementOptions>("/api/lms/access-management/options");
}

export function listAccessScopes(params: {
  scopeType?: AccessScopeType | "";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params.scopeType) search.set("scopeType", params.scopeType);
  if (params.search) search.set("search", params.search);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));

  return apiRequest<AccessScopeList>(`/api/lms/access-management/scopes?${search.toString()}`);
}

export function getUserAccess(userId: string) {
  return apiRequest<UserAccessDetail>(`/api/lms/access-management/users/${encodeURIComponent(userId)}/access`);
}

export function saveUserAccess(userId: string, payload: SaveUserAccessRequest) {
  return apiRequest<UserAccessDetail>(`/api/lms/access-management/users/${encodeURIComponent(userId)}/access`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function previewUserAccess(payload: SaveUserAccessRequest) {
  return apiRequest<EffectiveAccess>("/api/lms/access-management/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
