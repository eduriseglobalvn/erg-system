import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import type { StudentSession } from "@/platform/auth/api/student-auth-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { PLATFORM_ROOT_ADMIN_EMAIL } from "@/platform/auth/permissions/workspace-capability-projection";
import { workspaceFromLegacyPortal } from "@/platform/workspaces/legacy-portal-compat";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";

type PortalAccessInput = {
  portal: NonNullable<StoredAuthSession["portal"]>;
  studentSession?: StudentSession | null;
  teacherAccount?: TeacherAccount | null;
  teacherSession?: StoredAuthSession | null;
  requiredPermission?: string;
  requiredWorkspace?: Workspace;
};

export function canAccessPortal({ portal, studentSession, teacherAccount, teacherSession, requiredPermission, requiredWorkspace }: PortalAccessInput) {
  if (AUTH_BYPASS_ENABLED) return true;

  const workspace = requiredWorkspace ?? workspaceFromLegacyPortal(portal);
  if (portal === "elearning") {
    if (studentSession?.portal === "elearning" && studentSession.accessToken && (!requiredPermission || hasStudentPermission(studentSession, requiredPermission))) {
      return true;
    }

    return Boolean(teacherSession && hasExplicitPortalAccess(teacherSession, portal, workspace, requiredPermission, isRootAdmin(teacherAccount)));
  }

  if (!teacherSession) return false;
  return hasExplicitPortalAccess(teacherSession, portal, workspace, requiredPermission, isRootAdmin(teacherAccount));
}

function hasExplicitPortalAccess(
  session: StoredAuthSession,
  portal: NonNullable<StoredAuthSession["portal"]>,
  workspace: Workspace | undefined,
  requiredPermission?: string,
  rootAdmin = false,
) {
  const workspaces = session.workspaces?.length
    ? session.workspaces
    : (session.portals ?? []).filter((value) => value !== "*").map(workspaceFromLegacyPortal).filter((value): value is Workspace => Boolean(value));
  if (workspace && !rootAdmin && !workspaces.includes(workspace)) return false;

  if (requiredPermission && !rootAdmin && !evaluatePermission({
    permission: requiredPermission,
    grantedPermissions: session.permissions,
    deniedPermissions: session.deniedPermissions,
  })) return false;

  return rootAdmin || session.portals?.includes(portal) === true || Boolean(workspace && workspaces.includes(workspace));
}

function isRootAdmin(account?: TeacherAccount | null) {
  return account?.email.trim().toLowerCase() === PLATFORM_ROOT_ADMIN_EMAIL;
}

function hasStudentPermission(session: StudentSession, permission: string) {
  return evaluatePermission({
    permission,
    grantedPermissions: session.permissions,
    deniedPermissions: session.deniedPermissions,
  });
}
