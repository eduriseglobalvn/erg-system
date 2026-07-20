import { encodeApiPathSegment, type ContractPath } from "@/lib/api/contract-types";

const permissions = "/api/v1/permissions" satisfies ContractPath;
const roles = "/api/v1/roles" satisfies ContractPath;
const users = "/api/v1/users";

export const accessManagementRoutes = {
  permissionsCatalog: `${permissions}/catalog` satisfies ContractPath,
  permission: (permissionId: string) => `${permissions}/${encodeApiPathSegment(permissionId)}` as ContractPath,
  permissionGroups: "/api/v1/permission-groups" satisfies ContractPath,
  roles,
  role: (roleId: string) => `${roles}/${encodeApiPathSegment(roleId)}` as ContractPath,
  userRoles: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/roles` as ContractPath,
  userRoleAssignments: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/role-assignments` as ContractPath,
  userRoleAssignment: (userId: string, assignmentId: string) => `${users}/${encodeApiPathSegment(userId)}/role-assignments/${encodeApiPathSegment(assignmentId)}` as ContractPath,
  effectivePermissions: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/effective-permissions` as ContractPath,
  preview: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/preview` as ContractPath,
};
