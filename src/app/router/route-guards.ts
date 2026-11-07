import { redirect } from "@tanstack/react-router";
import { createAuthRouteState, resolveAuthRouteAccess, type AuthRouteState } from "@/platform/auth/router/auth-route-context";
import { readStoredRefreshSession, resolveCurrentPortal } from "@/platform/auth/api/auth-token-storage";
import { getAuthScope, getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { refreshStoredAuthSession } from "@/lib/api-client/refresh";
import { hasApiBase } from "@/lib/api-client";
import { buildRedirectPath } from "@/platform/auth/utils/auth-redirects";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { routeAcceptedPermissions, routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";
import { getDesktopRuntime, isDesktopWorkspace } from "@/platform/desktop";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { ELEARNING_PORTAL_HOSTS, isPortalHost, shouldRedirectLocalPortal } from "@/config/portal-urls";
import { buildPortalHostUrl } from "@/app/router/portal-host-url";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { crmPaths } from "@/platform/auth/permissions/portal-route-registry";
import {
  canonicalLmsWorkspaceHostForRuntime,
  canonicalWorkspaceForPath,
  isCanonicalLmsWorkspaceHost,
} from "@/platform/workspaces/workspace-route";

export function enforceProtectedRoute(
  auth: AuthRouteState,
  location: { href: string },
  portal: string,
  permission: string,
): void {
  if (AUTH_BYPASS_ENABLED) return;
  const decision = resolveAuthRouteAccess(auth, { portal, permission });
  if (decision === "allow") return;
  const safeRedirect = safeLocationRedirect(location.href);
  throwAuthRedirect(decision, portal, safeRedirect);
}

export function enforcePermissionRoute(
  auth: AuthRouteState,
  location: { href: string },
  permission: string,
): void {
  if (AUTH_BYPASS_ENABLED) return;
  const decision = resolveAuthRouteAccess(auth, { permission });
  if (decision === "allow") return;
  throwAuthRedirect(decision, "shared", safeLocationRedirect(location.href));
}

/** Enforce the canonical route/resource/action matrix for a workspace. */
export function enforceWorkspaceRoute(
  auth: AuthRouteState,
  location: { href: string; pathname?: string },
  workspace: Workspace,
): void {
  if (AUTH_BYPASS_ENABLED) return;
  if (getDesktopRuntime() === "tauri" && !isDesktopWorkspace(workspace)) {
    throwAuthRedirect("access-denied", workspace, safeLocationRedirect(location.href));
  }
  const entry = routePermissionForPath(location.pathname ?? new URL(location.href, "https://erg.local").pathname, workspace);
  const safeRedirect = safeLocationRedirect(location.href);
  if (!entry) {
    // A missing matrix row is a configuration/security failure, not a reason
    // to let a wildcard or platform role through an arbitrary route.
    throwAuthRedirect("access-denied", workspace, safeRedirect);
  }
  const decisions = routeAcceptedPermissions(entry).map((permission) => resolveAuthRouteAccess(auth, { workspace, permission }));
  if (decisions.includes("allow")) return;
  throwAuthRedirect(decisions[0], workspace, safeRedirect);
}

const CRM_ROUTE_PATHS: ReadonlySet<string> = new Set(crmPaths.map((path) => `/${path}`));

/** Workspace of a path served under `_authed`: /admin, /teacher, /student prefixes, or a CRM path (/seo...). */
export function authedWorkspaceForPath(pathname: string): Workspace | undefined {
  const crmPath = `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return canonicalWorkspaceForPath(pathname) ?? (CRM_ROUTE_PATHS.has(crmPath) ? "CRM" : undefined);
}

/**
 * Admin/Teacher/Student only live on the canonical LMS host. Other ERG hosts are sent there
 * (full-page redirect, path/search/hash kept); any other host fails closed. CRM requires the CRM host.
 */
export function enforceCanonicalWorkspaceHost(location: { href: string; pathname?: string }, workspace: Workspace): void {
  if (typeof window === "undefined") return;
  if (workspace === "CRM") {
    // CRM is served from its own host and is never redirected to; any other host fails closed.
    if (resolveActivePortal() !== "crm") throwAuthRedirect("access-denied", workspace, safeLocationRedirect(location.href));
    return;
  }
  if (isCanonicalLmsWorkspaceHost(window.location)) return;
  // On the student host the dashboard is served at "/".
  if (workspace === "STUDENT" && isPortalHost(ELEARNING_PORTAL_HOSTS) && location.pathname?.replace(/\/+$/, "") === "/student") {
    throw redirect({ to: "/", replace: true });
  }
  const targetHost = canonicalLmsWorkspaceHostForRuntime();
  if (!shouldRedirectLocalPortal(targetHost)) {
    throwAuthRedirect("access-denied", workspace, safeLocationRedirect(location.href));
  }
  throw redirect({ href: buildPortalHostUrl(targetHost, safeLocationRedirect(location.href)), reloadDocument: true });
}

/**
 * The one guard for every converted workspace subtree (`_authed`): session + matrix permission,
 * then canonical host. Leaf routes declare `staticData.permission` for documentation/tests only;
 * the matrix lookup here stays the single source of truth.
 */
export function authedBeforeLoad({ context, location }: { context: { auth: AuthRouteState }; location: { href: string; pathname: string } }): void | Promise<void> {
  const workspace = authedWorkspaceForPath(location.pathname);
  if (!workspace) throwAuthRedirect("access-denied", "shared", safeLocationRedirect(location.href));
  const guard = (auth: AuthRouteState) => {
    enforceWorkspaceRoute(auth, location, workspace);
    enforceCanonicalWorkspaceHost(location, workspace);
  };
  return withFreshAuth(context.auth, guard);
}

/** An expired access token with a stored refresh token is not a sign-out: refresh once before deciding with `run`. */
export function withFreshAuth<T>(auth: AuthRouteState, run: (auth: AuthRouteState) => T): T | Promise<T> {
  if (!auth.authenticated && !AUTH_BYPASS_ENABLED && readStoredRefreshSession()?.refreshToken) {
    return refreshStoredAuthSession()
      .catch(() => null)
      .then((token) => run(token ? storedAuthRouteState() : auth));
  }
  return run(auth);
}

function storedAuthRouteState() {
  const portal = resolveCurrentPortal();
  return createAuthRouteState({ account: getCurrentAccount(portal), session: getAuthScope(portal).session, apiBacked: hasApiBase() });
}

function throwAuthRedirect(decision: ReturnType<typeof resolveAuthRouteAccess>, portal: string, safeRedirect: string): never {
  if (decision === "login") {
    throw redirect({ to: "/login", search: { redirect: safeRedirect } });
  }
  if (decision === "onboarding") {
    throw redirect({ to: "/onboarding", search: { redirect: safeRedirect } });
  }
  throw redirect({ to: "/access-denied", search: { portal, redirect: safeRedirect } });
}

function safeLocationRedirect(href: string) {
  try {
    const url = new URL(href, "https://erg.local");
    return buildRedirectPath(url.pathname, url.search, url.hash);
  } catch {
    return "/";
  }
}
