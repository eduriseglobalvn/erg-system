import { createRoute } from "@tanstack/react-router";

import { crmPaths } from "@/app/portal-route-registry";
import { enforceWorkspaceRoute } from "@/app/router/route-guards";
import { CrmPage, PortalRoute, rootRoute, withPortalAuth } from "@/routes/portals/route-shared";

export const crmRoutes = crmPaths.map((cPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/${cPath}`,
    beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "CRM"),
    component: () => (
      <PortalRoute
        allowedPortals={["crm"]}
        element={withPortalAuth("crm", <CrmPage />)}
      />
    ),
  }),
);
