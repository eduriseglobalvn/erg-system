import { ERG_WORKSPACE_DOMAINS, type Workspace } from "@/platform/workspaces/workspace-domain";
import { legacyPortalFromWorkspace } from "@/platform/workspaces/legacy-portal-compat";
import type { LegacyPortal } from "@/platform/workspaces/legacy-portal-compat";
import { getDesktopRuntime } from "@/platform/desktop";

export type CanonicalLmsWorkspace = Exclude<Workspace, "CRM">;

export type CanonicalLmsWorkspaceRoute = {
  path: "/admin" | "/teacher" | "/student";
  legacyPortal: Extract<LegacyPortal, "lcms" | "lms" | "elearning">;
};

export const CANONICAL_LMS_WORKSPACE_ROUTES: Record<CanonicalLmsWorkspace, CanonicalLmsWorkspaceRoute> = {
  ADMIN: { path: "/admin", legacyPortal: "lcms" },
  TEACHER: { path: "/teacher", legacyPortal: "lms" },
  STUDENT: { path: "/student", legacyPortal: "elearning" },
};

type HostLike = { hostname: string };

export function canonicalWorkspaceForPath(pathname: string): CanonicalLmsWorkspace | undefined {
  const normalizedPath = pathname.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  const segment = normalizedPath.split("/").filter(Boolean)[0] ?? "";

  for (const [workspace, route] of Object.entries(CANONICAL_LMS_WORKSPACE_ROUTES) as Array<[
    CanonicalLmsWorkspace,
    CanonicalLmsWorkspaceRoute,
  ]>) {
    if (route.path.slice(1) === segment) return workspace;
  }

  return undefined;
}

export function isCanonicalLmsWorkspaceHost(location: HostLike): boolean {
  const hostname = normalizeHostname(location.hostname);
  return (
    getDesktopRuntime() === "tauri" ||
    hostname === ERG_WORKSPACE_DOMAINS.lms ||
    hostname === "lms.erg.edu.local" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function canonicalLmsWorkspaceHostForRuntime(hostname = readRuntimeHostname()): string {
  const normalized = normalizeHostname(hostname);
  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".erg.edu.local")
  ) {
    return "lms.erg.edu.local";
  }
  return ERG_WORKSPACE_DOMAINS.lms;
}

export function canonicalCrmWorkspaceHostForRuntime(hostname = readRuntimeHostname()): string {
  const normalized = normalizeHostname(hostname);
  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".erg.edu.local")
  ) {
    return "crm.erg.edu.local";
  }
  return ERG_WORKSPACE_DOMAINS.crm;
}

export function legacyPortalForCanonicalWorkspace(workspace: CanonicalLmsWorkspace): CanonicalLmsWorkspaceRoute["legacyPortal"] {
  const portal = legacyPortalFromWorkspace(workspace);
  if (portal === "lcms" || portal === "lms" || portal === "elearning") return portal;
  throw new Error(`Workspace ${workspace} is not a canonical LMS workspace`);
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

function readRuntimeHostname() {
  return typeof window === "undefined" ? ERG_WORKSPACE_DOMAINS.lms : window.location.hostname;
}
