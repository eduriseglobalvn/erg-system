import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { ApiClientError, apiRequest, getBackOfficePortal } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import { LMS_ROLE_GROUP_TEMPLATES } from "@/platform/auth/permissions/lms-permission-catalog";
import { isObject, validateResponse } from "@/lib/validate-response";

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

export async function loadAccessManagementWorkspace(input: AccessManagementWorkspaceInput = {}, signal?: AbortSignal) {
  const tenantId = input.tenantId ?? getDefaultTenantId();
  const response = await graphQlRequest<AccessManagementWorkspaceResponse, { input: AccessManagementWorkspaceInput }>({
    operationName: "LcmsAccessManagementWorkspace",
    portal: "lcms",
    query: AccessManagementWorkspaceDocument,
    signal,
    tenantId,
    variables: {
      input: {
        ...input,
        tenantId,
      },
    },
  });

  return validateResponse(response, isAccessManagementWorkspaceResponse, "lcms.access-management-workspace")
    .lcms.accessManagementWorkspace;
}

function isAccessManagementWorkspaceResponse(value: unknown): value is AccessManagementWorkspaceResponse {
  if (!isObject(value) || !isObject(value.lcms) || !isObject(value.lcms.accessManagementWorkspace)) return false;
  const workspace = value.lcms.accessManagementWorkspace;
  return isObject(workspace.users) && Array.isArray(workspace.users.items);
}

export async function listAccessManagedUsers(params: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}, signal?: AbortSignal) {
  try {
    const page = Math.max((params.page ?? 1) - 1, 0);
    const size = params.limit ?? 20;
    const workspace = await loadAccessManagementWorkspace({
      page,
      size,
      search: params.search || undefined,
      roleId: params.role && params.role !== "all" ? params.role : undefined,
      status: params.status && params.status !== "all" ? params.status : undefined,
    }, signal);
    const userPage = workspace.users;

    return {
      items: (userPage?.items ?? []).map((user) => mapAccessWorkspaceUser(user, workspace.effectivePermissionsIncluded ?? false)),
      limit: userPage?.size ?? size,
      page: (userPage?.page ?? page) + 1,
      total: userPage?.totalItems ?? 0,
    } satisfies AccessManagementUserList;
  } catch (error) {
    if (!isUnavailableAccessWorkspaceCapability(error)) throw error;
    return listAccessManagedUsersRest(params, signal);
  }
}

function listAccessManagedUsersRest(params: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.role && params.role !== "all") search.set("role", params.role);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));

  return apiRequest<AccessManagementUserList>(`${API_ENDPOINTS.access.legacyUsers}?${search.toString()}`, {
    portal: getBackOfficePortal(),
    signal,
  });
}

function isUnavailableAccessWorkspaceCapability(error: unknown) {
  return error instanceof ApiClientError &&
    error.code === "GRAPHQL_ERROR" &&
    (error.status === 404 || error.status === 501);
}

export async function getAccessManagementOptions(signal?: AbortSignal) {
  const options = await apiRequest<AccessManagementOptions>(API_ENDPOINTS.legacy.lmsAccessOptions, {
    portal: getBackOfficePortal(),
    signal,
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
}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.scopeType) search.set("scopeType", params.scopeType);
  if (params.search) search.set("search", params.search);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));

  return apiRequest<AccessScopeList>(`${API_ENDPOINTS.access.legacyScopes}?${search.toString()}`, {
    portal: getBackOfficePortal(),
    signal,
  });
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

export function getUserAccess(userId: string, signal?: AbortSignal) {
  return apiRequest<UserAccessDetail>(API_ENDPOINTS.access.legacyUserAccess(userId), {
    portal: getBackOfficePortal(),
    signal,
  });
}

export function saveUserAccess(userId: string, payload: SaveUserAccessRequest) {
  return apiRequest<UserAccessDetail>(API_ENDPOINTS.access.legacyUserAccess(userId), {
    portal: getBackOfficePortal(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function previewUserAccess(payload: SaveUserAccessRequest, signal?: AbortSignal) {
  return apiRequest<EffectiveAccess>(API_ENDPOINTS.legacy.lmsAccessPreview, {
    portal: getBackOfficePortal(),
    signal,
    method: "POST",
    body: JSON.stringify(payload),
  });
}
