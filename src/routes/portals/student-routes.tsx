import { createRoute, Navigate } from "@tanstack/react-router";

import { ELEARNING_PORTAL_HOSTS, isPortalHost } from "@/config/portal-urls";
import { enforcePermissionRoute, enforceWorkspaceRoute } from "@/app/router/route-guards";
import { studentPath } from "@/platform/workspaces/workspace-paths";
import { canonicalLmsWorkspaceHostForRuntime, isCanonicalLmsWorkspaceHost } from "@/platform/workspaces/workspace-route";
import {
  DesktopReleasePage,
  LearningOutcomesPage,
  PortableExamPage,
  PortalHostRedirect,
  ProfileRouteContent,
  rootRoute,
  StudentPage,
  withPortalAuth,
} from "@/routes/portals/route-shared";

const studentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: studentPath("/profile"),
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "STUDENT");
    enforcePermissionRoute(context.auth, location, "account.self.read");
  },
  component: () => <ProfileRouteContent portal="elearning" />,
});

const studentRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "STUDENT"),
  component: () => {
    if (isCanonicalLmsWorkspaceHost(window.location)) return withPortalAuth("elearning", <StudentPage />, "elearning.assignment.read_self");
    const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);
    if (isElearning) return <Navigate to="/" replace />;
    return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/student" />;
  },
});

const studentPortableExamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/exams/portable",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "STUDENT"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/student/exams/portable" />;
    }
    return withPortalAuth("elearning", <PortableExamPage workspace="STUDENT" />, "elearning.assignment.read_self");
  },
});

const studentDesktopReleaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/downloads/desktop",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "STUDENT"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/student/downloads/desktop" />;
    }
    return withPortalAuth("elearning", <DesktopReleasePage workspace="STUDENT" />, "elearning.assignment.read_self");
  },
});

const learningOutcomesStudentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/learning-outcomes",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "STUDENT"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/student/learning-outcomes" />;
    }
    return withPortalAuth("elearning", <LearningOutcomesPage workspace="STUDENT" />, "learning.outcomes.read");
  },
});

export const studentRoutes = [
  studentProfileRoute,
  studentRedirectRoute,
  studentPortableExamRoute,
  studentDesktopReleaseRoute,
  learningOutcomesStudentRoute,
];
