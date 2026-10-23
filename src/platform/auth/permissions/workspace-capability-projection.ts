import { workspaceFromLegacyPortal } from "@/platform/workspaces/legacy-portal-compat";
import { WORKSPACES, type Workspace } from "@/platform/workspaces/workspace-domain";

/**
 * Claims that may be returned by either the canonical BFF session or the
 * legacy password-login response.
 *
 * This function only projects a server-issued session into UI workspace
 * targets. It is not an authorization check; every protected route and API
 * request still has to be authorized by the backend.
 */
export type WorkspaceCapabilityClaims = {
  accountEmail?: string | null;
  workspaces?: readonly Workspace[] | null;
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
  deniedPermissions?: readonly string[] | null;
  portals?: readonly string[] | null;
};

export const PLATFORM_ROOT_ADMIN_EMAIL = "admin@erg.edu.vn";

const SYSTEM_SUPER_ADMIN_ROLES = new Set([
  "super_admin",
  "super-admin",
  "system.super_admin",
  "erg_super_admin",
  "global_admin",
]);

export function projectVerifiedWorkspaces(claims: WorkspaceCapabilityClaims): Workspace[] {
  const deniedPermissions = normalize(claims.deniedPermissions);
  if (claims.accountEmail?.trim().toLowerCase() === PLATFORM_ROOT_ADMIN_EMAIL && !deniedPermissions.includes("*")) {
    return [...WORKSPACES];
  }

  const explicit = uniqueWorkspaces(claims.workspaces);
  if (explicit.length > 0) return explicit;

  const roles = normalize(claims.roles);
  const permissions = normalize(claims.permissions);
  const hasVerifiedSystemRole = roles.some((role) => SYSTEM_SUPER_ADMIN_ROLES.has(role));
  const hasWildcardGrant = permissions.includes("*");
  const hasWildcardDeny = deniedPermissions.includes("*");

  // The legacy login contract has no `workspaces` field. Only the verified
  // system role + wildcard grant combination may project that response to all
  // workspaces; a wildcard by itself is deliberately not enough.
  if (hasVerifiedSystemRole && hasWildcardGrant && !hasWildcardDeny) {
    return [...WORKSPACES];
  }

  return uniqueWorkspaces(
    (claims.portals ?? [])
      .filter((portal) => portal.trim() !== "*")
      .map((portal) => workspaceFromSessionPortal(portal))
      .filter((workspace): workspace is Workspace => Boolean(workspace)),
  );
}

function uniqueWorkspaces(values: readonly Workspace[] | null | undefined): Workspace[] {
  return Array.from(new Set((values ?? []).filter((workspace): workspace is Workspace => WORKSPACES.includes(workspace))));
}

function normalize(values: readonly string[] | null | undefined) {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function workspaceFromSessionPortal(value: string): Workspace | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "admin") return "ADMIN";
  if (normalized === "teacher") return "TEACHER";
  if (normalized === "student") return "STUDENT";
  return workspaceFromLegacyPortal(value);
}
