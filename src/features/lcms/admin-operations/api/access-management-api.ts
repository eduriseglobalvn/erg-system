import { apiRequest, getBackOfficePortal } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import { LMS_ROLE_GROUP_TEMPLATES } from "@/platform/auth/permissions/lms-permission-catalog";

export type AccessScopeType = "system" | "center" | "school";

export type AccessPolicySummary = {
  scopeCount: number;
  modules: string[];
  roleGroups: string[];
  highestScope: AccessScopeType | "none";
  warnings?: string[];
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

type AccessManagementWorkspaceInput = {
  tenantId?: string;
  search?: string;
  roleId?: string;
  status?: string;
  page?: number;
  size?: number;
};

type AccessManagementWorkspaceResponse = {
  lcms: {
    accessManagementWorkspace: AccessManagementWorkspaceDTO;
  };
};

type AccessManagementWorkspaceDTO = {
  tenantId?: string | null;
  effectivePermissionsIncluded?: boolean | null;
  users?: GraphQlPage<AccessWorkspaceUserDTO>;
  roleOptions?: Array<{
    id: string;
    name?: string | null;
  }>;
  scopeOptions?: AccessWorkspaceScopeOptionDTO[];
};

type AccessWorkspaceUserDTO = {
  userId: string;
  fullName?: string | null;
  email?: string | null;
  status?: string | null;
  roleCount?: number | null;
  scopeCount?: number | null;
  effectivePermissions?: AccessWorkspacePermissionDTO[] | null;
};

type AccessWorkspacePermissionDTO = {
  permission?: string | null;
  source?: string | null;
};

type AccessWorkspaceScopeOptionDTO = {
  id: string;
  label?: string | null;
  kind?: string | null;
};

const AccessManagementWorkspaceDocument = `
query LcmsAccessManagementWorkspace($input: AccessManagementWorkspaceInput) {
  lcms {
    accessManagementWorkspace(input: $input) {
      tenantId
      effectivePermissionsIncluded
      users {
        items {
          userId
          fullName
          email
          status
          roleCount
          scopeCount
          effectivePermissions {
            permission
            source
          }
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      roleOptions {
        id
        name
      }
      scopeOptions {
        id
        label
        kind
      }
    }
  }
}
`;

export async function loadAccessManagementWorkspace(input: AccessManagementWorkspaceInput = {}) {
  const tenantId = input.tenantId ?? getDefaultTenantId();
  const response = await graphQlRequest<AccessManagementWorkspaceResponse, { input: AccessManagementWorkspaceInput }>({
    operationName: "LcmsAccessManagementWorkspace",
    portal: "lcms",
    query: AccessManagementWorkspaceDocument,
    tenantId,
    variables: {
      input: {
        ...input,
        tenantId,
      },
    },
  });

  return response.lcms.accessManagementWorkspace;
}

export async function listAccessManagedUsers(params: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = Math.max((params.page ?? 1) - 1, 0);
    const size = params.limit ?? 20;
    const workspace = await loadAccessManagementWorkspace({
      page,
      size,
      search: params.search || undefined,
      roleId: params.role && params.role !== "all" ? params.role : undefined,
      status: params.status && params.status !== "all" ? params.status : undefined,
    });
    const userPage = workspace.users;

    return {
      items: (userPage?.items ?? []).map((user) => mapAccessWorkspaceUser(user, workspace.effectivePermissionsIncluded ?? false)),
      limit: userPage?.size ?? size,
      page: (userPage?.page ?? page) + 1,
      total: userPage?.totalItems ?? 0,
    } satisfies AccessManagementUserList;
  } catch {
    return listAccessManagedUsersRest(params);
  }
}

function listAccessManagedUsersRest(params: {
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

  return apiRequest<AccessManagementUserList>(`/api/lms/access-management/users?${search.toString()}`, { portal: getBackOfficePortal() });
}

export async function getAccessManagementOptions() {
  const options = await apiRequest<AccessManagementOptions>("/api/lms/access-management/options", {
    portal: getBackOfficePortal(),
  });
  return validateAccessManagementOptions(options);
}

export function validateAccessManagementOptions(options: AccessManagementOptions) {
  if (!options.modules.some((module) => module.id.trim().toLowerCase() === "lms")) {
    throw new Error("Access management catalog is missing module: lms");
  }

  const roleGroups = new Map(options.roleGroups.map((roleGroup) => [roleGroup.id, roleGroup]));
  for (const [roleGroupId, template] of Object.entries(LMS_ROLE_GROUP_TEMPLATES)) {
    const roleGroup = roleGroups.get(roleGroupId);
    if (!roleGroup) {
      throw new Error(`Access management catalog is missing role group: ${roleGroupId}`);
    }

    const permissions = new Set(roleGroup.permissions.map((permission) => permission.trim().toLowerCase()));
    for (const permission of template.permissions) {
      if (!permissions.has(permission)) {
        throw new Error(`Access management role group ${roleGroupId} is missing permission: ${permission}`);
      }
    }
  }

  return options;
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

  return apiRequest<AccessScopeList>(`/api/lms/access-management/scopes?${search.toString()}`, { portal: getBackOfficePortal() });
}

function mapAccessWorkspaceUser(user: AccessWorkspaceUserDTO, effectivePermissionsIncluded: boolean): AccessManagedUser {
  const effectivePermissions = effectivePermissionsIncluded ? user.effectivePermissions ?? [] : [];
  const metadataIncomplete = (user.roleCount ?? 0) > 0 || (user.scopeCount ?? 0) > 0;
  const roles: string[] = [];

  return {
    id: user.userId,
    email: user.email ?? "",
    fullName: user.fullName ?? user.email ?? user.userId,
    status: user.status ?? "PENDING",
    roles,
    isProfileCompleted: Boolean(user.fullName?.trim() && user.email?.trim() && ((user.roleCount ?? 0) > 0 || (user.scopeCount ?? 0) > 0)),
    accessSummary: {
      highestScope: "none",
      modules: deriveModules(effectivePermissions),
      roleGroups: roles,
      scopeCount: user.scopeCount ?? 0,
      warnings: metadataIncomplete ? ["ACCESS_METADATA_INCOMPLETE"] : undefined,
    },
    createdAt: "",
  };
}

function deriveModules(permissions: AccessWorkspacePermissionDTO[]) {
  const modules = new Set<string>();
  permissions.forEach((permission) => {
    const [moduleName] = (permission.permission ?? "").split(".");
    if (moduleName && moduleName !== "*") modules.add(moduleName);
  });
  return Array.from(modules);
}

export function getUserAccess(userId: string) {
  return apiRequest<UserAccessDetail>(`/api/lms/access-management/users/${encodeURIComponent(userId)}/access`, { portal: getBackOfficePortal() });
}

export function saveUserAccess(userId: string, payload: SaveUserAccessRequest) {
  return apiRequest<UserAccessDetail>(`/api/lms/access-management/users/${encodeURIComponent(userId)}/access`, {
    portal: getBackOfficePortal(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function previewUserAccess(payload: SaveUserAccessRequest) {
  return apiRequest<EffectiveAccess>("/api/lms/access-management/preview", {
    portal: getBackOfficePortal(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}
