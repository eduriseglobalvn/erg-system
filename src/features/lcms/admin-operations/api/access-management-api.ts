import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
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

export type AccessManagementUserList = {
  items: AccessManagedUser[];
  total: number;
  page: number;
  limit: number;
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
