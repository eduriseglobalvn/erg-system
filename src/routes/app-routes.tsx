import { createBrowserHistory, createHashHistory, createRouter } from "@tanstack/react-router";

import { shouldUseHashRouter } from "@/lib/platform";
import { getAdaptiveLoadingPolicy } from "@/lib/network-quality";
import { RouteErrorBoundary, RoutePendingSkeleton } from "@/routes/route-feedback";
import { adminAuthedRoutes, adminRoutes } from "@/routes/portals/admin-routes";
import { authRoutes } from "@/routes/portals/auth-routes";
import { crmRoutes } from "@/routes/portals/crm-routes";
import { catchAllRoute, legacyRoutes } from "@/routes/portals/legacy-routes";
import { publicRoutes } from "@/routes/portals/public-routes";
import { authedRoute, rootRoute } from "@/routes/portals/route-shared";
import { studentRoutes } from "@/routes/portals/student-routes";
import { teacherRoutes } from "@/routes/portals/teacher-routes";

export const routeTree = rootRoute.addChildren([
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  authedRoute.addChildren([...adminAuthedRoutes, ...teacherRoutes, ...studentRoutes, ...crmRoutes]),
  ...legacyRoutes,
  catchAllRoute,
]);

export function createAppRouter() {
  const loadingPolicy = getAdaptiveLoadingPolicy();
  return createRouter({
    defaultErrorComponent: RouteErrorBoundary,
    defaultPendingComponent: RoutePendingSkeleton,
    defaultPreload: loadingPolicy.preloadRoutes ? "intent" : false,
    defaultPreloadDelay: 75,
    defaultPreloadStaleTime: 0,
    history: shouldUseHashRouter() ? createHashHistory() : createBrowserHistory(),
    routeTree,
    context: {
      auth: {
        authenticated: false,
        lifecycle: null,
        permissions: [],
        deniedPermissions: [],
        portals: [],
        workspaces: [],
        hasWorkspace: () => false,
        hasPermission: () => false,
      },
    },
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}

export function AppRoutes() {
  return null;
}
