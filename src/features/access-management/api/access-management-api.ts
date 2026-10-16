import { getBackOfficePortal } from "@/lib/api-client";
import { createApiClient } from "@/lib/api/create-api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { mapPermissionPageDto, type PermissionPageDto } from "@/lib/api/mappers/admin-contract-mappers";
import { isObject, validateResponse } from "@/lib/validate-response";
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
  permissionsRoot: (tenantId: string) => [...accessManagementQueryKeys.root(tenantId), "permissions"] as const,
  permissions: (tenantId: string, filters: PermissionCatalogFilters) =>
    [...accessManagementQueryKeys.permissionsRoot(tenantId), filters] as const,
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

export async function listPermissions(filters: PermissionCatalogFilters, signal?: AbortSignal): Promise<PermissionPage> {
  const response = await client().operation(API_ENDPOINTS.access.permissionsCatalog, "get", {
    query: {
      page: Math.max(0, filters.page),
      limit: Math.max(1, filters.limit),
      search: filters.search?.trim() || undefined,
      group: filters.group?.trim() || undefined,
      portal: filters.portal?.trim() || undefined,
      status: filters.status?.trim() || undefined,
      used: filters.used,
    },
    ...(signal ? { signal } : {}),
  });
  const dto = validateResponse(response, isPermissionPageDto, "access.permissions");
  return mapPermissionPageDto(dto);
}

function isPermissionPageDto(value: unknown): value is PermissionPageDto {
  return isObject(value) && Array.isArray(value.items);
}

export function getPermission(permissionId: string, signal?: AbortSignal) {
  return client().request<SystemPermission>(API_ENDPOINTS.access.permission(permissionId), signal ? { signal } : undefined);
}

export function listPermissionGroups(signal?: AbortSignal) {
  return client().request<PermissionGroup[]>(API_ENDPOINTS.access.permissionGroups, signal ? { signal } : undefined);
}

export function listRoles(signal?: AbortSignal) {
  return client().request<AccessRole[]>(API_ENDPOINTS.access.roles, signal ? { signal } : undefined);
}

export function getRole(roleId: string, signal?: AbortSignal) {
  return client().request<AccessRole>(API_ENDPOINTS.access.role(roleId), signal ? { signal } : undefined);
}

export function createRole(payload: CreateRoleRequest) {
  return client().request<AccessRole>(API_ENDPOINTS.access.roles, { method: "POST", body: JSON.stringify(payload) });
}

export function updateRole(roleId: string, payload: UpdateRoleRequest) {
  return client().request<AccessRole>(API_ENDPOINTS.access.role(roleId), { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteRole(roleId: string) {
  return client().request<void>(API_ENDPOINTS.access.role(roleId), { method: "DELETE" });
}

export function assignUserRoles(userId: string, payload: AssignRolesRequest) {
  return client().request<unknown>(API_ENDPOINTS.access.userRoles(userId), { method: "POST", body: JSON.stringify(payload) });
}

export function assignScopedUserRole(userId: string, payload: AssignScopedRoleRequest) {
  return client().request<ScopedRoleAssignment>(API_ENDPOINTS.access.userRoleAssignments(userId), { method: "POST", body: JSON.stringify(payload) });
}

export function revokeScopedUserRole(userId: string, assignmentId: string, reason: string) {
  return client().request<ScopedRoleAssignment>(API_ENDPOINTS.access.userRoleAssignment(userId, assignmentId), {
    method: "DELETE", body: JSON.stringify({ reason: reason.trim() || undefined }),
  });
}

export function getEffectivePermissions(userId: string, signal?: AbortSignal) {
  return client().request<EffectivePermissions>(API_ENDPOINTS.access.effectivePermissions(userId), signal ? { signal } : undefined);
}

export function previewUserPermissions(userId: string, changes: Record<string, unknown>) {
  return client().request<PermissionPreview>(API_ENDPOINTS.access.preview(userId), { method: "POST", body: JSON.stringify({ changes }) });
}
