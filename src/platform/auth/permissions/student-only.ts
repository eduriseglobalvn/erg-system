import { ELEARNING_PORTAL_HOSTS, isPortalHost } from "@/config/portal-urls";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { studentPath } from "@/platform/workspaces/workspace-paths";
import { canonicalWorkspaceForPath } from "@/platform/workspaces/workspace-route";

/** A learner account: its verified workspaces (`projectVerifiedWorkspaces`) are exactly [STUDENT]. Staff with student preview are not. */
export function isStudentOnlySession(workspaces: readonly Workspace[]): boolean {
  return workspaces.length === 1 && workspaces[0] === "STUDENT";
}

/**
 * Where a learner-only session goes instead of an access-denied/onboarding page for `pathname`:
 * "/" on the student host, /student elsewhere. Null when the rule does not apply (staff, blocked account,
 * or the student portal refusing its own page, which must stay a denial so it cannot loop).
 */
export function misroutedStudentHome(
  session: { workspaces: readonly Workspace[]; lifecycle?: TeacherAccountLifecycle | null },
  pathname: string,
): string | null {
  if (!isStudentOnlySession(session.workspaces)) return null;
  if (session.lifecycle?.status === "INACTIVE" || session.lifecycle?.status === "BLOCKED") return null;
  const home = isPortalHost(ELEARNING_PORTAL_HOSTS) ? "/" : studentPath();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === home || canonicalWorkspaceForPath(path) === "STUDENT") return null;
  return home;
}
