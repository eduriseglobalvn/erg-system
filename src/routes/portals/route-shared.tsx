import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { createRoute, createRootRouteWithContext, Outlet, redirect, useLocation } from "@tanstack/react-router";

import { shouldRedirectLocalPortal } from "@/config/portal-urls";
import { RootLayout } from "@/layouts/root-layout";
import { AuthenticatedAccountGate, PortalAuthGate } from "@/platform/auth/components/portal-route-gates";
import type { AuthRouteState } from "@/platform/auth/router/auth-route-context";
import { buildPortalHostUrl } from "@/app/router/portal-host-url";
import { authedBeforeLoad, authedWorkspaceForPath, withFreshAuth } from "@/app/router/route-guards";
import { routePermissionForPath, type RoutePermission } from "@/platform/auth/permissions/route-permission-matrix";
import { legacyPortalFromWorkspace } from "@/platform/workspaces/legacy-portal-compat";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { notificationRedirectHref } from "@/routes/notification-redirect";
import { RoutePendingSkeleton } from "@/routes/route-feedback";

type AppRouterContext = {
  auth: AuthRouteState;
};

export const CrmPage = lazy(() =>
  import("@/app/pages/crm/crm-page").then((module) => ({
    default: module.CrmPage,
  })),
);
export const StudentPage = lazy(() => import("@/app/pages/student/student-page"));
export const LearningOutcomesPage = lazy(() => import("@/app/pages/shared/learning-outcomes-page"));
export const PortableExamPage = lazy(() =>
  import("@/app/pages/shared/portable-exam-page").then((module) => ({
    default: module.PortableExamPage,
  })),
);
export const DesktopReleasePage = lazy(() =>
  import("@/app/pages/shared/desktop-release-page").then((module) => ({
    default: module.DesktopReleasePage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/app/pages/shared/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
export const NotFoundPage = lazy(() =>
  import("@/app/pages/shared/not-found-page").then((module) => ({
    default: module.NotFoundPage,
  })),
);

export const rootRoute = createRootRouteWithContext<AppRouterContext>()({ component: RootLayout });

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Matrix permission of this route (verified against ROUTE_PERMISSION_MATRIX by tests). */
    permission?: RoutePermission;
  }
}

/** `staticData` for a leaf route; fails at module load when the matrix has no row for the path. */
export function permissionStaticData(path: string, workspace: Workspace) {
  const entry = routePermissionForPath(path, workspace);
  if (!entry) throw new Error(`ROUTE_PERMISSION_MATRIX has no row for ${workspace} ${path}`);
  return { permission: entry.permission };
}

function AuthedLayout() {
  const { pathname } = useLocation();
  const workspace = authedWorkspaceForPath(pathname);
  // Fallback UI only (login/onboarding/denied redirects, reauth dialog): access itself is decided in authedBeforeLoad.
  return (
    <PortalAuthGate portal={legacyPortalFromWorkspace(workspace ?? "TEACHER")}>
      <Outlet />
    </PortalAuthGate>
  );
}

/**
 * Push deep link `/notifications/{id}` (pwa-push.js, BE payload): a pure redirect into the signed-in
 * workspace's detail page, or login and back. The target route's matrix row does the permission check.
 */
export const notificationLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications/$notificationId",
  beforeLoad: ({ context, location }) =>
    withFreshAuth(context.auth, (auth) => {
      // location.pathname may already be decoded; the id allowlist in notificationRedirectHref is what keeps "/", ".." and "%" out of the target.
      throw redirect({ href: notificationRedirectHref(location.pathname.split("/")[2] ?? "", auth), replace: true });
    }),
});

/** Session + permission + canonical host for every converted workspace, checked once. */
export const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authed",
  beforeLoad: authedBeforeLoad,
  component: AuthedLayout,
});

export function PortalHostRedirect({
  preservePathAndSearch = false,
  preserveSearch = false,
  targetHost,
  targetPath = "/",
}: {
  preservePathAndSearch?: boolean;
  preserveSearch?: boolean;
  targetHost: string;
  targetPath?: string;
}) {
  const shouldRedirect = shouldRedirectLocalPortal(targetHost);

  useEffect(() => {
    if (!shouldRedirect || typeof window === "undefined") return;

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const requestedPath = preservePathAndSearch
      ? currentPath
      : `${targetPath}${preserveSearch ? `${window.location.search}${window.location.hash}` : ""}`;
    window.location.replace(buildPortalHostUrl(targetHost, requestedPath, targetPath));
  }, [preservePathAndSearch, preserveSearch, shouldRedirect, targetHost, targetPath]);

  return <RoutePendingSkeleton />;
}

export function withPortalAuth(portal: "lcms" | "crm" | "lms" | "elearning", children: ReactNode, requiredPermission?: string) {
  return <PortalAuthGate portal={portal} requiredPermission={requiredPermission}>{children}</PortalAuthGate>;
}

export function stripPath(pathname: string) {
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function ProfileBody() {
  return (
    <AuthenticatedAccountGate>
      <Suspense fallback={<RoutePendingSkeleton />}>
        <ProfilePage />
      </Suspense>
    </AuthenticatedAccountGate>
  );
}

export function ProfileRouteContent({ portal }: { portal: "lcms" | "crm" | "lms" | "elearning" }) {
  return withPortalAuth(portal, <ProfileBody />);
}
