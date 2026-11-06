export type PermissionSurfaceType = "REST" | "GRAPHQL" | "ROUTE" | "SERVICE" | string;
export type PermissionStatus = "ACTIVE" | "INACTIVE" | "DEPRECATED" | "UNKNOWN";
export type PermissionStatusInput = Exclude<PermissionStatus, "UNKNOWN">;

export type PermissionBinding = {
  id: string;
  surfaceType: PermissionSurfaceType;
  surfaceIdentifier: string;
  description?: string | null;
  enforced: boolean;
};

export type SystemPermission = {
  id: string;
  name: string;
  group: string;
  label: string;
  description?: string | null;
  resource?: string | null;
  action?: string | null;
  portal?: string | null;
  supportedScope?: string | null;
  status: PermissionStatus;
  isSystem: boolean;
  deprecatedAt?: string | null;
  used: boolean;
  roleCount: number;
  userCount: number;
  roleNames?: string[];
  bindings: PermissionBinding[];
};

export type PermissionCatalogFilters = {
  page: number;
  limit: number;
  search?: string;
  group?: string;
  portal?: string;
  status?: PermissionStatusInput;
  used?: boolean;
};

export type PermissionPage = {
  items: SystemPermission[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PermissionGroup = {
  id: string;
  name: string;
  label: string;
  order: number;
  permissions: SystemPermission[];
};

export type AccessRole = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  is_default: boolean;
  createdAt: string;
  updated_at: string;
  userCount?: number;
  scopeTypes?: string[];
  isSystem?: boolean;
  status?: PermissionStatus;
  updatedBy?: string | null;
};

export type CreateRoleRequest = {
  name: string;
  description?: string;
  permissions: string[];
};

export type UpdateRoleRequest = {
  name?: string;
  description?: string;
  permissions?: string[];
};

export type AssignRolesRequest = {
  roleIds: string[];
};

export type AssignScopedRoleRequest = {
  roleId: string;
  scopeType: "SYSTEM" | "TENANT" | "CENTER" | "SCHOOL" | "CLASS";
  scopeId?: string;
  expiresAt?: string;
};

export type ScopedRoleAssignment = {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  tenantId: string;
  scopeType: AssignScopedRoleRequest["scopeType"];
  scopeId?: string | null;
  expiresAt?: string | null;
  assignedBy: string;
  createdAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revokeReason?: string | null;
};

export type EffectivePermissions = {
  user_id: string;
  role_permissions: string[];
  granted_permissions: string[];
  denied_permissions: string[];
  effective_permissions: string[];
};

export type PermissionPreview = {
  current_permissions: string[];
  proposed_changes: Record<string, unknown>;
  simulated_permissions: string[];
};
