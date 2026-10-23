import type { Workspace } from "@/platform/workspaces/workspace-domain";

export const LEGACY_PORTALS = ["lcms", "lms", "elearning", "crm"] as const;
export type LegacyPortal = (typeof LEGACY_PORTALS)[number];

export type WorkspacePortalMapping = {
  workspace: Workspace;
  legacy: LegacyPortal;
  publicPath: string;
};

export const WORKSPACE_PORTAL_MAPPINGS: readonly WorkspacePortalMapping[] = [
  { workspace: "ADMIN", legacy: "lcms", publicPath: "/admin" },
  { workspace: "TEACHER", legacy: "lms", publicPath: "/teacher" },
  { workspace: "STUDENT", legacy: "elearning", publicPath: "/student" },
  { workspace: "CRM", legacy: "crm", publicPath: "/" },
] as const;

export function workspaceFromLegacyPortal(portal: string | undefined): Workspace | undefined {
  return WORKSPACE_PORTAL_MAPPINGS.find((mapping) => mapping.legacy === portal?.trim().toLowerCase())?.workspace;
}

export function legacyPortalFromWorkspace(workspace: Workspace): LegacyPortal {
  return WORKSPACE_PORTAL_MAPPINGS.find((mapping) => mapping.workspace === workspace)?.legacy ?? "lms";
}

export function isLegacyPortal(value: string): value is LegacyPortal {
  return LEGACY_PORTALS.includes(value.trim().toLowerCase() as LegacyPortal);
}
