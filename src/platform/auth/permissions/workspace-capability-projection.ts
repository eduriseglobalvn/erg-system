import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { WORKSPACES, type Workspace } from "@/platform/workspaces/workspace-domain";

/**
 * Claims returned by the canonical BFF session or the legacy password-login response.
 *
 * Workspaces come from the server-issued `workspaces` claim only (the backend derives them from
 * `*.workspace.access` permissions). This is a UI projection, not an authorization check; every
 * protected route and API request is still authorized by the backend.
 */
export type WorkspaceCapabilityClaims = {
  workspaces?: readonly Workspace[] | null;
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
  deniedPermissions?: readonly string[] | null;
  portals?: readonly string[] | null;
};

export const STUDENT_PREVIEW_PERMISSION = "elearning.student.preview";

/** Staff (an ADMIN/TEACHER workspace holder) whom the backend explicitly allowed to open the student portal in preview mode. */
export function isStaffPreviewEligible(claims: Pick<WorkspaceCapabilityClaims, "workspaces" | "permissions" | "deniedPermissions">): boolean {
  const workspaces = uniqueWorkspaces(claims.workspaces);
  const isStaff = workspaces.includes("ADMIN") || workspaces.includes("TEACHER");
  return isStaff && evaluatePermission({
    permission: STUDENT_PREVIEW_PERMISSION,
    grantedPermissions: claims.permissions ?? [],
    deniedPermissions: claims.deniedPermissions ?? [],
  });
}

/** True when the student workspace is only available through staff preview (no real student identity). */
export function isStudentPreviewSession(claims: WorkspaceCapabilityClaims): boolean {
  return isStaffPreviewEligible(claims) && !hasGenuineStudentClaims(claims);
}

function hasGenuineStudentClaims(claims: WorkspaceCapabilityClaims) {
  const permissions = normalize(claims.permissions);
  const portals = normalize(claims.portals);
  return permissions.includes("elearning.student")
    || permissions.includes("student.*")
    || portals.includes("elearning")
    || portals.includes("student");
}

export function projectVerifiedWorkspaces(claims: WorkspaceCapabilityClaims): Workspace[] {
  if (normalize(claims.deniedPermissions).includes("*")) return [];
  return uniqueWorkspaces(claims.workspaces);
}

function uniqueWorkspaces(values: readonly Workspace[] | null | undefined): Workspace[] {
  return Array.from(new Set((values ?? []).filter((workspace): workspace is Workspace => WORKSPACES.includes(workspace))));
}

function normalize(values: readonly string[] | null | undefined) {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}
