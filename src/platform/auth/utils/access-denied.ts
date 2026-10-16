import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { projectVerifiedWorkspaces } from "@/platform/auth/permissions/workspace-capability-projection";
import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { workspaceFromLegacyPortal } from "@/platform/workspaces/legacy-portal-compat";
import { WORKSPACES, type Workspace } from "@/platform/workspaces/workspace-domain";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { legacyPortalFromWorkspace } from "@/platform/workspaces/legacy-portal-compat";

export type AccessDeniedWorkspaceTarget = {
  workspace: Workspace;
  path: "/admin" | "/teacher" | "/student" | "/";
  label: string;
  description: string;
  permission: string;
};

type AccessDeniedClaims = {
  requestedPortal?: string | null;
  workspaces?: readonly Workspace[] | null;
  portals?: readonly string[] | null;
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
  deniedPermissions?: readonly string[] | null;
};

const WORKSPACE_TARGETS: readonly AccessDeniedWorkspaceTarget[] = [
  {
    workspace: "ADMIN",
    path: "/admin",
    label: "Admin Workspace",
    description: "Quản trị LMS, nội dung và phân quyền",
    permission: "lms.admin",
  },
  {
    workspace: "TEACHER",
    path: "/teacher",
    label: "Teacher Workspace",
    description: "Lớp học, bài tập, điểm và lịch dạy",
    permission: "lms.dashboard.read",
  },
  {
    workspace: "STUDENT",
    path: "/student",
    label: "Student Workspace",
    description: "Khóa học, bài tập và kết quả cá nhân",
    permission: "elearning.assignment.read_self",
  },
  {
    workspace: "CRM",
    path: "/",
    label: "CRM Workspace",
    description: "Điều hành cơ hội và hoạt động trung tâm",
    permission: "seo.manage",
  },
] as const;

const WORKSPACE_LABELS: Record<Workspace, string> = {
  ADMIN: "Admin Workspace",
  TEACHER: "Teacher Workspace",
  STUDENT: "Student Workspace",
  CRM: "CRM Workspace",
};

export function workspaceFromAccessDeniedPortal(value: string | null | undefined): Workspace | undefined {
  const normalized = value?.trim().toUpperCase();
  if (normalized && WORKSPACES.includes(normalized as Workspace)) return normalized as Workspace;
  return workspaceFromLegacyPortal(value ?? undefined);
}

export function accessDeniedWorkspaceLabel(value: string | null | undefined) {
  const workspace = workspaceFromAccessDeniedPortal(value);
  return workspace ? WORKSPACE_LABELS[workspace] : "workspace này";
}

export function resolveAccessDeniedTargets(claims: AccessDeniedClaims): AccessDeniedWorkspaceTarget[] {
  const requestedWorkspace = workspaceFromAccessDeniedPortal(claims.requestedPortal);
  const workspaces = resolveClaimedWorkspaces(claims);
  const permissions = claims.permissions ?? [];
  const deniedPermissions = claims.deniedPermissions ?? [];

  return WORKSPACE_TARGETS.filter((target) =>
    target.workspace !== requestedWorkspace &&
    workspaces.includes(target.workspace) &&
    evaluatePermission({
      permission: target.permission,
      grantedPermissions: permissions,
      deniedPermissions,
    }),
  );
}

export function resolveWorkspaceLandingTarget(claims: AccessDeniedClaims & { preferredWorkspace?: Workspace }) {
  const workspaces = resolveClaimedWorkspaces(claims);
  const permissions = claims.permissions ?? [];
  const deniedPermissions = claims.deniedPermissions ?? [];
  const eligible = WORKSPACE_TARGETS.filter((target) =>
    workspaces.includes(target.workspace) &&
    evaluatePermission({
      permission: target.permission,
      grantedPermissions: permissions,
      deniedPermissions,
    }),
  );

  if (claims.preferredWorkspace) {
    const preferred = eligible.find((target) => target.workspace === claims.preferredWorkspace);
    if (preferred) return preferred;
  }

  return eligible[0];
}

export function sanitizeAccessDeniedRedirect(value: string | null | undefined) {
  return sanitizeLocalRedirect(value) ?? "/";
}

export function portalKeyFromAccessDeniedValue(value: string): NonNullable<StoredAuthSession["portal"]> | undefined {
  if (value === "admin" || value === "crm" || value === "lcms" || value === "lms" || value === "elearning") return value;
  const workspace = workspaceFromAccessDeniedPortal(value);
  return workspace ? legacyPortalFromWorkspace(workspace) : undefined;
}

export function accessDeniedPathLabel(value: string) {
  try {
    return new URL(value, "https://erg.local").pathname;
  } catch {
    return "/";
  }
}

export function goBackFromAccessDenied(goHome: () => void) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    window.history.back();
    return;
  }
  goHome();
}

function resolveClaimedWorkspaces({ workspaces, portals, roles, permissions, deniedPermissions }: AccessDeniedClaims): Workspace[] {
  return projectVerifiedWorkspaces({
    workspaces,
    roles,
    permissions,
    deniedPermissions,
    portals,
  });
}
