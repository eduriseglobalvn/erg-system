import { lazy, Suspense } from "react";
import { createRoute, Navigate } from "@tanstack/react-router";

import { hasAdminLikeClaims } from "@/platform/auth/permissions/admin-like";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { resolveWorkspaceLandingTarget } from "@/platform/auth/utils/access-denied";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { canonicalCrmWorkspaceHostForRuntime } from "@/platform/workspaces/workspace-route";
import { getDesktopRuntime, resolveDesktopWorkspaceLanding } from "@/platform/desktop";
import { RoutePendingSkeleton } from "@/routes/route-feedback";
import {
  CrmPage,
  NotFoundPage,
  PortalHostRedirect,
  rootRoute,
  StudentPage,
  withPortalAuth,
} from "@/routes/portals/route-shared";

const DesktopWorkspaceEntryPage = lazy(() =>
  import("@/app/pages/shared/desktop-workspace-entry-page").then((module) => ({
    default: module.DesktopWorkspaceEntryPage,
  })),
);

function PortalIndexPage() {
  const activePortal = resolveActivePortal();
  const auth = useAuthSession();
  const studentSession = getCurrentStudentSession();

  if (getDesktopRuntime() === "tauri") {
    if (studentSession) return <Navigate to="/student" replace />;
    if (auth.isHydratingProfile) return <RoutePendingSkeleton />;
    if (auth.account) {
      const landingTarget = resolveDesktopWorkspaceLanding({
        workspaces: auth.session?.workspaces,
        roles: auth.session?.roles,
        portals: auth.session?.portals,
        permissions: auth.session?.permissions,
        deniedPermissions: auth.session?.deniedPermissions,
      });
      return landingTarget
        ? <Navigate to={landingTarget.path} replace />
        : <Navigate to="/access-denied" replace />;
    }
    return (
      <Suspense fallback={<RoutePendingSkeleton />}>
        <DesktopWorkspaceEntryPage />
      </Suspense>
    );
  }
  // The student host serves the dashboard at "/" and its guard sends "/student" back here, so navigating would loop.
  if (studentSession && activePortal !== "elearning") return <Navigate to="/student" replace />;
  if (activePortal === "lcms") return <Navigate to="/admin" replace />;
  if (activePortal === "crm") return withPortalAuth("crm", <CrmPage />, "seo.manage");
  if (activePortal === "lms" || activePortal === null) {
    if (auth.isHydratingProfile) return <RoutePendingSkeleton />;
    const roles = [...(auth.session?.roles ?? []), ...(auth.account?.roles ?? [])].map((r) => r.trim().toLowerCase());
    const isPlatformAdmin = auth.account?.role === "admin"
      || hasAdminLikeClaims(roles, auth.session?.permissions);
    const storedWorkspace = typeof window !== "undefined" ? window.localStorage?.getItem("erg_last_workspace") : null;
    const preferredWorkspace = storedWorkspace === "ADMIN" && isPlatformAdmin
      ? "ADMIN"
      : storedWorkspace === "TEACHER"
        ? "TEACHER"
        : (isPlatformAdmin ? "ADMIN" : undefined);
    const landingTarget = auth.account
      ? resolveWorkspaceLandingTarget({
          preferredWorkspace,
          workspaces: auth.session?.workspaces,
          roles: auth.session?.roles,
          portals: auth.session?.portals,
          permissions: auth.session?.permissions,
          deniedPermissions: auth.session?.deniedPermissions,
        })
      : undefined;

    if (landingTarget?.workspace === "CRM") {
      return <PortalHostRedirect targetHost={canonicalCrmWorkspaceHostForRuntime()} targetPath="/" />;
    }
    const fallbackPath = preferredWorkspace === "ADMIN" || isPlatformAdmin ? "/admin" : "/teacher/home";
    return <Navigate to={landingTarget?.path ?? fallbackPath} replace />;
  }
  if (activePortal === "elearning") return withPortalAuth("elearning", <StudentPage />, "elearning.assignment.read_self");
  return (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <NotFoundPage />
    </Suspense>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PortalIndexPage,
});

export const publicRoutes = [indexRoute];
