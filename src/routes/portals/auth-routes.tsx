import { lazy, Suspense } from "react";
import { createRoute, Navigate, redirect, useLocation } from "@tanstack/react-router";

import { PortalLoginPage } from "@/platform/auth/components/portal-login-page";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { buildRedirectPath, sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import {
  desktopLoginPortal,
  desktopWorkspaceFromLoginSearch,
  getDesktopRuntime,
} from "@/platform/desktop";
import { RoutePendingSkeleton } from "@/routes/route-feedback";
import { rootRoute } from "@/routes/portals/route-shared";

const AccessDeniedPage = lazy(() =>
  import("@/platform/auth").then((module) => ({
    default: module.AccessDeniedPage,
  })),
);
const TeacherOnboardingPage = lazy(() => import("@/app/pages/auth/teacher-onboarding-page"));

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: DesktopLoginRoute,
});

function DesktopLoginRoute() {
  const location = useLocation();
  if (AUTH_BYPASS_ENABLED) {
    const search = new URLSearchParams(location.searchStr);
    const redirectTarget = search.get("redirect") || "/admin";
    return <Navigate to={redirectTarget} replace />;
  }
  const activePortal = resolveActivePortal();
  const workspace = getDesktopRuntime() === "tauri"
    ? desktopWorkspaceFromLoginSearch(location.searchStr)
    : undefined;
  const portal = getDesktopRuntime() === "tauri"
    ? desktopLoginPortal(workspace)
    : activePortal ?? "lms";
  return <PortalLoginPage portal={portal} />;
}

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/access-denied",
  component: () => (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <AccessDeniedPage />
    </Suspense>
  ),
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === "string" ? sanitizeLocalRedirect(search.redirect) ?? teacherPath("/home") : teacherPath("/home"),
  }),
  beforeLoad: ({ context, location, search }) => {
    if (!context.auth.authenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: buildRedirectPath(location.pathname, location.searchStr, location.hash) },
      });
    }
    if (context.auth.lifecycle?.status === "ACTIVE" && context.auth.lifecycle.nextSteps.length === 0) {
      throw redirect({ href: search.redirect });
    }
    if (context.auth.lifecycle?.status === "INACTIVE" || context.auth.lifecycle?.status === "BLOCKED") {
      throw redirect({ to: "/access-denied" });
    }
  },
  component: () => (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <TeacherOnboardingPage />
    </Suspense>
  ),
});

export const authRoutes = [loginRoute, accessDeniedRoute, onboardingRoute];
