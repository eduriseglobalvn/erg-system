import { redirect } from "@tanstack/react-router";
import { resolveAuthRouteAccess, type AuthRouteState } from "@/platform/auth/router/auth-route-context";
import { buildRedirectPath } from "@/platform/auth/utils/auth-redirects";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { routePermissionForPath } from "@/platform/auth/permissions/route-permission-matrix";
import { getDesktopRuntime, isDesktopWorkspace } from "@/platform/desktop";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";

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
  const decision = resolveAuthRouteAccess(auth, {
    workspace,
    permission: entry.permission,
  });
  if (decision === "allow") return;
  throwAuthRedirect(decision, workspace, safeRedirect);
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
