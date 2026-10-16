import { resolveAccessDeniedTargets, type AccessDeniedWorkspaceTarget } from "@/platform/auth/utils/access-denied";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { desktopWorkspaceFromPath, type DesktopWorkspace } from "@/platform/desktop/runtime";

export type DesktopWorkspaceClaims = {
  preferredWorkspace?: DesktopWorkspace;
  workspaces?: readonly Workspace[] | null;
  portals?: readonly string[] | null;
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
  deniedPermissions?: readonly string[] | null;
};

export type DesktopWorkspaceLanding = AccessDeniedWorkspaceTarget & {
  workspace: DesktopWorkspace;
  path: "/teacher" | "/student";
};

export function desktopWorkspaceFromLoginSearch(search: string): DesktopWorkspace | undefined {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const explicitWorkspace = params.get("workspace")?.trim().toUpperCase();

  if (explicitWorkspace) {
    return explicitWorkspace === "TEACHER" || explicitWorkspace === "STUDENT"
      ? explicitWorkspace
      : undefined;
  }

  const redirect = sanitizeLocalRedirect(params.get("redirect"));
  return redirect ? desktopWorkspaceFromPath(redirect) : undefined;
}

export function desktopLoginPortal(workspace: DesktopWorkspace | undefined): "lms" | "elearning" {
  return workspace === "STUDENT" ? "elearning" : "lms";
}

export function resolveDesktopWorkspaceLanding(
  claims: DesktopWorkspaceClaims,
): DesktopWorkspaceLanding | undefined {
  const targets = resolveAccessDeniedTargets(claims).filter(isDesktopTarget);
  if (claims.preferredWorkspace) {
    const preferred = targets.find((target) => target.workspace === claims.preferredWorkspace);
    if (preferred) return preferred;
  }
  return targets[0];
}

function isDesktopTarget(target: AccessDeniedWorkspaceTarget): target is DesktopWorkspaceLanding {
  return target.workspace === "TEACHER" || target.workspace === "STUDENT";
}
