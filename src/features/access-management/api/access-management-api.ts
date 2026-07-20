import { getBackOfficePortal } from "@/lib/api-client";
import { createApiClient } from "@/lib/api/create-api-client";
import { accessManagementRoutes as routes } from "@/features/access-management/api/access-management-routes";
import type {
  AccessRole,
  AssignRolesRequest,
  AssignScopedRoleRequest,
  CreateRoleRequest,
  EffectivePermissions,
  PermissionCatalogFilters,
  PermissionGroup,
  PermissionPage,
  PermissionPreview,
  SystemPermission,
  ScopedRoleAssignment,
  UpdateRoleRequest,
} from "@/features/access-management/types/access-management";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });

export const accessManagementQueryKeys = {
  root: (tenantId: string) => ["access-management", tenantId] as const,
  permissions: (tenantId: string, filters: PermissionCatalogFilters) =>
    [...accessManagementQueryKeys.root(tenantId), "permissions", filters] as const,
  permission: (tenantId: string, permissionId: string) =>
    [...accessManagementQueryKeys.root(tenantId), "permission", permissionId] as const,
  permissionGroups: (tenantId: string) =>
    [...accessManagementQueryKeys.root(tenantId), "permission-groups"] as const,
  roles: (tenantId: string) => [...accessManagementQueryKeys.root(tenantId), "roles"] as const,
  role: (tenantId: string, roleId: string) =>
    [...accessManagementQueryKeys.root(tenantId), "role", roleId] as const,
  effectivePermissions: (tenantId: string, userId: string) =>
    [...accessManagementQueryKeys.root(tenantId), "effective-permissions", userId] as const,
};

export function listPermissions(filters: PermissionCatalogFilters) {
  const search = new URLSearchParams();
  search.set("page", String(Math.max(0, filters.page)));
  search.set("limit", String(Math.max(1, filters.limit)));
  setOptionalSearchParam(search, "search", filters.search);
  setOptionalSearchParam(search, "group", filters.group);
  setOptionalSearchParam(search, "portal", filters.portal);
  setOptionalSearchParam(search, "status", filters.status);
  if (filters.used !== undefined) search.set("used", String(filters.used));
  return client().request<PermissionPage>(`${routes.permissionsCatalog}?${search.toString()}` as `${typeof routes.permissionsCatalog}?${string}`);
}

export function getPermission(permissionId: string) {
  return client().request<SystemPermission>(routes.permission(permissionId));
}

export function listPermissionGroups() {
  return client().request<PermissionGroup[]>(routes.permissionGroups);
}

export function listRoles() {
  return client().request<AccessRole[]>(routes.roles);
}

export function getRole(roleId: string) {
  return client().request<AccessRole>(routes.role(roleId));
}

export function createRole(payload: CreateRoleRequest) {
  return client().request<AccessRole>(routes.roles, { method: "POST", body: JSON.stringify(payload) });
}

export function updateRole(roleId: string, payload: UpdateRoleRequest) {
  return client().request<AccessRole>(routes.role(roleId), { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteRole(roleId: string) {
  return client().request<void>(routes.role(roleId), { method: "DELETE" });
}

export function assignUserRoles(userId: string, payload: AssignRolesRequest) {
  return client().request<unknown>(routes.userRoles(userId), { method: "POST", body: JSON.stringify(payload) });
}

export function assignScopedUserRole(userId: string, payload: AssignScopedRoleRequest) {
  return client().request<ScopedRoleAssignment>(routes.userRoleAssignments(userId), { method: "POST", body: JSON.stringify(payload) });
}

export function revokeScopedUserRole(userId: string, assignmentId: string, reason: string) {
  return client().request<ScopedRoleAssignment>(routes.userRoleAssignment(userId, assignmentId), {
    method: "DELETE", body: JSON.stringify({ reason: reason.trim() || undefined }),
  });
}

export function getEffectivePermissions(userId: string) {
  return client().request<EffectivePermissions>(routes.effectivePermissions(userId));
}

export function previewUserPermissions(userId: string, changes: Record<string, unknown>) {
  return client().request<PermissionPreview>(routes.preview(userId), { method: "POST", body: JSON.stringify({ changes }) });
}

function setOptionalSearchParam(search: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim();
  if (normalized) search.set(key, normalized);
}
