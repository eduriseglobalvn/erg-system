import { createRoute, lazyRouteComponent } from "@tanstack/react-router";

import { crmPaths } from "@/app/portal-route-registry";
import { authedRoute, permissionStaticData } from "@/routes/portals/route-shared";

// Pathless layout: the CRM shell renders the page of each /seo* route in its <Outlet />.
const crmShellRoute = createRoute({
  getParentRoute: () => authedRoute,
  id: "_crmShell",
  component: lazyRouteComponent(() => import("@/app/pages/crm/crm-page"), "CrmLayoutPage"),
});

const crmPageRoutes = crmPaths.map((cPath) =>
  createRoute({
    getParentRoute: () => crmShellRoute,
    path: `/${cPath}`,
    staticData: permissionStaticData(`/${cPath}`, "CRM"),
    component: lazyRouteComponent(() => import("@/features/crm/components/crm-portal-content"), "CrmPortalContent"),
  }),
);

/** Children of `_authed`. */
export const crmRoutes = [crmShellRoute.addChildren(crmPageRoutes)];
