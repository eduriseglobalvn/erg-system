import {
  CRM_PORTAL_HOSTS,
  ELEARNING_PORTAL_HOSTS,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOSTS,
  isPortalHost,
} from "@/config/portal-urls";
import { workspaceFromLegacyPortal, type LegacyPortal } from "@/platform/workspaces/legacy-portal-compat";
import { resolveWorkspaceLocation, type Workspace } from "@/platform/workspaces/workspace-domain";
import { desktopWorkspaceFromLocation, getDesktopRuntime } from "@/platform/desktop";

export type ActivePortal = LegacyPortal | null;

export function resolveActivePortal(): ActivePortal {
  if (getDesktopRuntime() === "tauri" && typeof window !== "undefined") {
    const workspace = desktopWorkspaceFromLocation(window.location);
    if (workspace === "TEACHER") return "lms";
    if (workspace === "STUDENT") return "elearning";
    return null;
  }
  if (isPortalHost(LMS_PORTAL_HOSTS)) return "lms";
  if (isPortalHost(LCMS_PORTAL_HOSTS)) return "lcms";
  if (isPortalHost(CRM_PORTAL_HOSTS)) return "crm";
  if (isPortalHost(ELEARNING_PORTAL_HOSTS)) return "elearning";
  return null;
}

export function resolveActiveWorkspace(): Workspace | undefined {
  if (typeof window !== "undefined") {
    const resolved = resolveWorkspaceLocation({
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      port: window.location.port,
      protocol: window.location.protocol,
    });
    if (resolved.kind === "workspace") return resolved.workspace;
  }

  const portal = resolveActivePortal();
  return portal ? workspaceFromLegacyPortal(portal) : undefined;
}

export function isCanonicalLmsWorkspaceHost() {
  return isPortalHost(["lms.erg.edu.vn"]);
}
