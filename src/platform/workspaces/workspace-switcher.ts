import { workspaceUrl, type Workspace } from "@/platform/workspaces/workspace-domain";

export type WorkspaceCapability = {
  workspace: Workspace;
  label: string;
  href: string;
};

export type WorkspaceCapabilityOptions = {
  originForWorkspace?: (workspace: Workspace) => string | undefined;
};

const labels: Record<Workspace, string> = {
  ADMIN: "Admin LMS",
  TEACHER: "Teacher",
  STUDENT: "Student",
  CRM: "CRM",
};

export function workspaceCapabilities(
  workspaces: readonly Workspace[],
  current: Workspace,
  path = "",
  options?: WorkspaceCapabilityOptions,
) {
  const safeCurrentPath = sanitizeWorkspacePath(path);
  return workspaces
    .filter((workspace, index, values) => values.indexOf(workspace) === index)
    .map((workspace) => ({
      workspace,
      label: labels[workspace],
      href: workspace === current
        ? safeCurrentPath || workspaceUrl(workspace, "", { origin: options?.originForWorkspace?.(workspace) })
        : workspaceUrl(workspace, "", { origin: options?.originForWorkspace?.(workspace) }),
    }));
}

function sanitizeWorkspacePath(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "";
  return path.split(/[?#]/, 1)[0] || "/";
}

/**
 * Convert legacy portal aliases only when an old session has no canonical
 * workspace capability list. This is a compatibility boundary, not a grant.
 */
export function workspacesFromLegacyPortals(portals: readonly string[], current: Workspace): Workspace[] {
  const mapped = portals.flatMap((portal): Workspace[] => {
    if (portal === "crm") return ["CRM"];
    if (portal === "elearning") return ["STUDENT"];
    if (portal === "admin" || portal === "lcms") return ["ADMIN"];
    if (portal === "lms") return ["TEACHER"];
    return [];
  });
  return mapped.length ? mapped : [current];
}
