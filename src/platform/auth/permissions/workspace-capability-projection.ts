import { hasAdminLikeClaims } from "@/platform/auth/permissions/admin-like";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
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

export const SYSTEM_SUPER_ADMIN_ROLES = new Set([
  "super_admin",
  "super-admin",
  "system.super_admin",
  "erg_super_admin",
  "global_admin",
]);

export const ADMIN_WORKSPACE_ROLES = new Set([
  "admin",
  "administrator",
  "lms_admin",
  "center_admin",
]);

export const TEACHER_WORKSPACE_ROLES = new Set([
  "teacher",
  "lms_teacher_standard",
  "head_teacher",
  "lead_teacher",
  "instructor",
  "giaovien",
  "giao_vien",
]);

export const STUDENT_WORKSPACE_ROLES = new Set([
  "student",
  "learner",
  "pupil",
  "hocsinh",
  "hoc_sinh",
]);

export const CRM_WORKSPACE_ROLES = new Set([
  "crm",
  "crm_admin",
  "crm_staff",
  "sale",
  "sales",
  "counselor",
  "consultant",
  "admissions",
]);

export const STUDENT_PREVIEW_PERMISSION = "elearning.student.preview";

/** Staff (teacher/admin) whom the backend explicitly allowed to open the student portal in preview mode. */
export function isStaffPreviewEligible(claims: Pick<WorkspaceCapabilityClaims, "roles" | "permissions" | "deniedPermissions">): boolean {
  const roles = normalize(claims.roles);
  const isStaff = hasAdminLikeClaims(roles)
    || roles.some((role) => TEACHER_WORKSPACE_ROLES.has(role) || ADMIN_WORKSPACE_ROLES.has(role));
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
  return normalize(claims.roles).some((r) => STUDENT_WORKSPACE_ROLES.has(r))
    || permissions.includes("elearning.student")
    || permissions.includes("student.*")
    || portals.includes("elearning")
    || portals.includes("student");
}

export function projectVerifiedWorkspaces(claims: WorkspaceCapabilityClaims): Workspace[] {
  const deniedPermissions = normalize(claims.deniedPermissions);
  if (claims.accountEmail?.trim().toLowerCase() === PLATFORM_ROOT_ADMIN_EMAIL && !deniedPermissions.includes("*")) {
    return [...WORKSPACES];
  }

  const roles = normalize(claims.roles);
  const permissions = normalize(claims.permissions);
  const hasVerifiedSystemRole = roles.some((role) => SYSTEM_SUPER_ADMIN_ROLES.has(role));
  const hasWildcardDeny = deniedPermissions.includes("*");

  if (hasWildcardDeny) {
    return [];
  }

  // Super-admin users possess universal access across all workspaces
  if (hasVerifiedSystemRole) {
    const explicit = uniqueWorkspaces(claims.workspaces);
    if (explicit.length > 0) return explicit;
    return [...WORKSPACES];
  }

  const portals = (claims.portals ?? []).map((p) => p.trim().toLowerCase());

  // Determine allowed workspaces strictly matching user's roles, permissions, and portals
  const allowedWorkspaces = new Set<Workspace>();

  // 1. ADMIN workspace
  const hasAdminRole = roles.some((r) => ADMIN_WORKSPACE_ROLES.has(r))
    || permissions.includes("lms.admin")
    || permissions.includes("admin.*");
  const hasAdminPortal = portals.includes("admin") || portals.includes("lcms");
  if (hasAdminRole || hasAdminPortal) {
    allowedWorkspaces.add("ADMIN");
  }

  // 2. TEACHER workspace
  const hasTeacherRole = roles.some((r) => TEACHER_WORKSPACE_ROLES.has(r))
    || permissions.includes("lms.teacher")
    || permissions.includes("teacher.*");
  const hasTeacherPortal = portals.includes("lms") || portals.includes("teacher");
  if (hasTeacherRole || hasTeacherPortal) {
    allowedWorkspaces.add("TEACHER");
  }

  // 3. STUDENT workspace
  const previewEligible = isStaffPreviewEligible(claims);
  if (hasGenuineStudentClaims(claims) || previewEligible) {
    allowedWorkspaces.add("STUDENT");
  }

  // 4. CRM workspace
  const hasCrmRole = roles.some((r) => CRM_WORKSPACE_ROLES.has(r))
    || permissions.includes("crm.*");
  const hasCrmPortal = portals.includes("crm");
  if (hasCrmRole || hasCrmPortal) {
    allowedWorkspaces.add("CRM");
  }

  // If explicit workspaces are claimed, enforce role restriction when roles are present
  if (claims.workspaces && claims.workspaces.length > 0) {
    const explicit = uniqueWorkspaces(claims.workspaces);
    if (roles.length > 0) {
      if (allowedWorkspaces.size > 0) {
        const filtered = explicit.filter((ws) => allowedWorkspaces.has(ws));
        // Backend may still list only TEACHER; preview eligibility alone grants the student portal.
        if (filtered.length > 0) return previewEligible && !filtered.includes("STUDENT") ? [...filtered, "STUDENT"] : filtered;
      }
    } else {
      return explicit;
    }
  }

  return uniqueWorkspaces(Array.from(allowedWorkspaces));
}

function uniqueWorkspaces(values: readonly Workspace[] | null | undefined): Workspace[] {
  return Array.from(new Set((values ?? []).filter((workspace): workspace is Workspace => WORKSPACES.includes(workspace))));
}

function normalize(values: readonly string[] | null | undefined) {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}
