import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  accessManagementQueryKeys,
  assignUserRoles,
  createRole,
  deleteRole,
  getEffectivePermissions,
  getPermission,
  getRole,
  listPermissionGroups,
  listPermissions,
  listRoles,
  updateRole,
} from "@/features/access-management/api/access-management-api";
import type {
  AssignRolesRequest,
  CreateRoleRequest,
  PermissionCatalogFilters,
  UpdateRoleRequest,
} from "@/features/access-management/types/access-management";
import { QUERY_POLICIES } from "@/lib/query-policy";

const CATALOG_STALE_TIME = QUERY_POLICIES.reference.staleTime;

export function usePermissionCatalog(tenantId: string, filters: PermissionCatalogFilters) {
  return useQuery({
    queryKey: accessManagementQueryKeys.permissions(tenantId, filters),
    queryFn: ({ signal }) => listPermissions(filters, signal),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePermissionDetail(tenantId: string, permissionId?: string) {
  return useQuery({
    queryKey: accessManagementQueryKeys.permission(tenantId, permissionId ?? ""),
    queryFn: ({ signal }) => getPermission(permissionId ?? "", signal),
    enabled: Boolean(permissionId),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function usePermissionGroups(tenantId: string) {
  return useQuery({
    queryKey: accessManagementQueryKeys.permissionGroups(tenantId),
    queryFn: ({ signal }) => listPermissionGroups(signal),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useRoles(tenantId: string) {
  return useQuery({
    queryKey: accessManagementQueryKeys.roles(tenantId),
    queryFn: ({ signal }) => listRoles(signal),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useRoleDetail(tenantId: string, roleId?: string) {
  return useQuery({
    queryKey: accessManagementQueryKeys.role(tenantId, roleId ?? ""),
    queryFn: ({ signal }) => getRole(roleId ?? "", signal),
    enabled: Boolean(roleId),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useEffectivePermissions(tenantId: string, userId?: string) {
  return useQuery({
    queryKey: accessManagementQueryKeys.effectivePermissions(tenantId, userId ?? ""),
    queryFn: ({ signal }) => getEffectivePermissions(userId ?? "", signal),
    enabled: Boolean(userId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
  });
}

export function useRoleCommands(tenantId: string) {
  const queryClient = useQueryClient();

  return {
    create: useMutation({
      mutationFn: (payload: CreateRoleRequest) => createRole(payload),
      onSuccess: () => invalidateAccessQueries(queryClient, roleMutationInvalidationKeys.create(tenantId)),
    }),
    update: useMutation({
      mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRoleRequest }) => updateRole(roleId, payload),
      onSuccess: (_result, { roleId }) => invalidateAccessQueries(queryClient, roleMutationInvalidationKeys.update(tenantId, roleId)),
    }),
    remove: useMutation({
      mutationFn: deleteRole,
      onSuccess: (_result, roleId) => invalidateAccessQueries(queryClient, roleMutationInvalidationKeys.update(tenantId, roleId)),
    }),
  };
}

export const roleMutationInvalidationKeys = {
  create: (tenantId: string) => [
    accessManagementQueryKeys.roles(tenantId),
    accessManagementQueryKeys.permissionsRoot(tenantId),
  ] as const,
  update: (tenantId: string, roleId: string) => [
    accessManagementQueryKeys.roles(tenantId),
    accessManagementQueryKeys.role(tenantId, roleId),
    accessManagementQueryKeys.permissionsRoot(tenantId),
  ] as const,
};

function invalidateAccessQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  keys: readonly (readonly unknown[])[],
) {
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useAssignUserRoles(tenantId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRolesRequest) => assignUserRoles(userId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accessManagementQueryKeys.roles(tenantId) }),
        queryClient.invalidateQueries({
          queryKey: accessManagementQueryKeys.effectivePermissions(tenantId, userId),
        }),
      ]);
    },
  });
}
