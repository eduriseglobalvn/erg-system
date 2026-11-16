import { getBackOfficePortal } from "@/lib/api-client";
import { createApiClient } from "@/lib/api/create-api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });

export type RbacAccess = "SUA" | "XEM" | "NONE";

/** `GET /api/v1/rbac/catalog`: one source for role labels, descriptions and the function x role matrix. */
export type RbacCatalog = {
  functions: Array<{ code: string; label: string }>;
  roles: Array<{
    id: string;
    code: string;
    label: string;
    description: string;
    canDo: string[];
    cannotDo: string[];
    exclusive: boolean;
  }>;
  matrix: Record<string, Record<string, RbacAccess>>;
};

/** `GET /api/v1/rbac/assignable-roles`: roles the caller may grant. `code` is the role name the user API takes. */
export type AssignableRole = { id: string; label: string; code?: string; exclusive?: boolean };

export const rbacQueryKeys = {
  catalog: ["rbac", "catalog"] as const,
  assignableRoles: ["rbac", "assignable-roles"] as const,
};

export function getRbacCatalog(signal?: AbortSignal) {
  return client().request<RbacCatalog>(API_ENDPOINTS.rbac.catalog, signal ? { signal } : undefined);
}

export function listAssignableRoles(signal?: AbortSignal) {
  return client().request<AssignableRole[]>(API_ENDPOINTS.rbac.assignableRoles, signal ? { signal } : undefined);
}
