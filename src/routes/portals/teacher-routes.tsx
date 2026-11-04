import { lazy } from "react";
import { createRoute } from "@tanstack/react-router";

import { lmsPaths } from "@/app/portal-route-registry";
import { enforcePermissionRoute, enforceWorkspaceRoute } from "@/app/router/route-guards";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { canonicalLmsWorkspaceHostForRuntime, isCanonicalLmsWorkspaceHost } from "@/platform/workspaces/workspace-route";
import {
  DesktopReleasePage,
  LearningOutcomesPage,
  PortableExamPage,
  PortalHostRedirect,
  PortalRoute,
  ProfileRouteContent,
  rootRoute,
  withPortalAuth,
} from "@/routes/portals/route-shared";

const DashboardPage = lazy(() => import("@/app/pages/teacher/teacher-page"));

const teacherProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: teacherPath("/profile"),
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "TEACHER");
    enforcePermissionRoute(context.auth, location, "account.self.read");
  },
  component: () => <ProfileRouteContent portal="lms" />,
});

const teacherWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "TEACHER"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/teacher" />;
    }
    return withPortalAuth("lms", <DashboardPage />);
  },
});

const teacherPortableExamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher/exams/portable",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "TEACHER"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/teacher/exams/portable" />;
    }
    return withPortalAuth("lms", <PortableExamPage workspace="TEACHER" />);
  },
});

const teacherDesktopReleaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher/downloads/desktop",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "TEACHER"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/teacher/downloads/desktop" />;
    }
    return withPortalAuth("lms", <DesktopReleasePage workspace="TEACHER" />);
  },
});

const learningOutcomesTeacherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teacher/learning-outcomes",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "TEACHER"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/teacher/learning-outcomes" />;
    }
    return withPortalAuth("lms", <LearningOutcomesPage workspace="TEACHER" />, "learning.outcomes.read");
  },
});

const lmsRoutes = lmsPaths.map((lPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: teacherPath(`/${lPath}`),
    beforeLoad: ({ context, location }) => {
      enforceWorkspaceRoute(context.auth, location, "TEACHER");
    },
    component: () => (
      <PortalRoute
        allowedPortals={["lms"]}
        element={withPortalAuth("lms", <DashboardPage />)}
        targetHostIfRedirect={canonicalLmsWorkspaceHostForRuntime()}
      />
    ),
  }),
);

export const teacherRoutes = [
  teacherProfileRoute,
  teacherWorkspaceRoute,
  teacherPortableExamRoute,
  teacherDesktopReleaseRoute,
  learningOutcomesTeacherRoute,
  ...lmsRoutes,
];
