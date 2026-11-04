import { lazy, Suspense } from "react";
import { createRoute, Navigate } from "@tanstack/react-router";

import {
  ADMIN_LEARNING_STANDARDS_PATH,
  ADMIN_ENTERPRISE_CONNECTORS_PATH,
  LEGACY_ENTERPRISE_CONNECTORS_PATH,
  LEGACY_LEARNING_STANDARDS_PATH,
  lcmsWorkspacePaths,
} from "@/app/portal-route-registry";
import { enforcePermissionRoute, enforceWorkspaceRoute } from "@/app/router/route-guards";
import { ADMIN_CONTENT_ROUTE_PATHS, canonicalAdminWorkspacePath } from "@/features/lcms/admin-content/admin-content-route";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { canonicalLmsWorkspaceHostForRuntime, isCanonicalLmsWorkspaceHost } from "@/platform/workspaces/workspace-route";
import { RoutePendingSkeleton } from "@/routes/route-feedback";
import {
  PortalHostRedirect,
  PortalRoute,
  ProfileRouteContent,
  rootRoute,
  withPortalAuth,
} from "@/routes/portals/route-shared";

const AdminPage = lazy(() => import("@/app/pages/admin/admin-page"));
const QuestionTypeDemoPage = lazy(() =>
  import("@/app/pages/shared/question-type-demo-page").then((module) => ({
    default: module.QuestionTypeDemoPage,
  })),
);

const adminProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: adminPath("/profile"),
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "ADMIN");
    enforcePermissionRoute(context.auth, location, "account.self.read");
  },
  component: () => <ProfileRouteContent portal="lcms" />,
});

const questionTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: adminPath("/question-types"),
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
  component: () => (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <QuestionTypeDemoPage />
    </Suspense>
  ),
});

// Old bookmarks and menu links used /admin/<segment>; content now lives under /admin/content/<segment>.
const legacyAdminContentRoutes = ["resources", "questions", "quiz-bank", "quiz-editor"].map((segment) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: adminPath(`/${segment}`),
    component: () => <Navigate to={adminPath(`/content/${segment}`)} replace />,
  }),
);

const adminWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/admin" />;
    }
    return withPortalAuth("lcms", <AdminPage />);
  },
});

const learningStandardsAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ADMIN_LEARNING_STANDARDS_PATH,
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "ADMIN");
    if (!context.auth.hasPermission("learning.standards.read") && !context.auth.hasPermission("learning.standards.manage")) {
      enforcePermissionRoute(context.auth, location, "learning.standards.read");
    }
  },
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath={ADMIN_LEARNING_STANDARDS_PATH} />;
    }
    return withPortalAuth("lcms", <AdminPage />);
  },
});

const legacyLearningStandardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: LEGACY_LEARNING_STANDARDS_PATH,
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
  component: () => <Navigate to={ADMIN_LEARNING_STANDARDS_PATH} replace />,
});

const enterpriseConnectorsAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ADMIN_ENTERPRISE_CONNECTORS_PATH,
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "ADMIN");
    if (!context.auth.hasPermission("enterprise.connectors.read") && !context.auth.hasPermission("enterprise.connectors.manage")) {
      enforcePermissionRoute(context.auth, location, "enterprise.connectors.read");
    }
  },
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath={ADMIN_ENTERPRISE_CONNECTORS_PATH} />;
    }
    return withPortalAuth("lcms", <AdminPage />);
  },
});

const legacyEnterpriseConnectorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: LEGACY_ENTERPRISE_CONNECTORS_PATH,
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
  component: () => <Navigate to={ADMIN_ENTERPRISE_CONNECTORS_PATH} replace />,
});

const learningOutcomesAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/learning-outcomes",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/admin/learning-outcomes" />;
    }
    return withPortalAuth("lcms", <AdminPage />, "learning.outcomes.manage");
  },
});

const adminContentRoutes = ADMIN_CONTENT_ROUTE_PATHS.map((contentPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: contentPath,
    beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
    component: () => {
      if (!isCanonicalLmsWorkspaceHost(window.location)) {
        return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath={contentPath} />;
      }
      return withPortalAuth("lcms", <AdminPage />);
    },
  }),
);

const lcmsRoutes = lcmsWorkspacePaths
  .filter((wPath) => !["questions", "quiz-bank", "quiz-editor"].includes(wPath))
  .map((wPath) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: canonicalAdminWorkspacePath(`/${wPath}`),
      beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
      component: () => (
        <PortalRoute
          allowedPortals={["lcms", "lms"]}
          element={withPortalAuth("lcms", <AdminPage />)}
          // Do not redirect here; requests from LMS/CRM should render 404.
        />
      ),
    }),
  );

export const adminRoutes = [
  adminProfileRoute,
  questionTypesRoute,
  ...legacyAdminContentRoutes,
  adminWorkspaceRoute,
  learningStandardsAdminRoute,
  legacyLearningStandardsRoute,
  enterpriseConnectorsAdminRoute,
  legacyEnterpriseConnectorsRoute,
  learningOutcomesAdminRoute,
  ...adminContentRoutes,
  ...lcmsRoutes,
];
