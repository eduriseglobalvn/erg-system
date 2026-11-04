import { createRoute } from "@tanstack/react-router";

import { enforcePermissionRoute } from "@/app/router/route-guards";
import { studentPath } from "@/platform/workspaces/workspace-paths";
import {
  authedRoute,
  DesktopReleasePage,
  LearningOutcomesPage,
  permissionStaticData,
  PortableExamPage,
  ProfileBody,
  StudentPage,
} from "@/routes/portals/route-shared";

// The Student dashboard switches tabs with component state (not pathnames), so it has no Outlet:
// /student renders it directly and the other pages are standalone siblings under `_authed`.
// Matrix permissions (incl. the staff-preview alternates) and the canonical-host / elearning-host
// handling are all in authedBeforeLoad.
const studentRedirectRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student",
  staticData: permissionStaticData("/student", "STUDENT"),
  component: StudentPage,
});

const studentProfileRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: studentPath("/profile"),
  beforeLoad: ({ context, location }) => enforcePermissionRoute(context.auth, location, "account.self.read"),
  component: ProfileBody,
});

const studentPortableExamRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/exams/portable",
  staticData: permissionStaticData("/student/exams/portable", "STUDENT"),
  component: () => <PortableExamPage workspace="STUDENT" />,
});

const studentDesktopReleaseRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/downloads/desktop",
  staticData: permissionStaticData("/student/downloads/desktop", "STUDENT"),
  component: () => <DesktopReleasePage workspace="STUDENT" />,
});

const learningOutcomesStudentRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/learning-outcomes",
  staticData: permissionStaticData("/student/learning-outcomes", "STUDENT"),
  component: () => <LearningOutcomesPage workspace="STUDENT" />,
});

/** Children of `_authed`. */
export const studentRoutes = [
  studentProfileRoute,
  studentRedirectRoute,
  studentPortableExamRoute,
  studentDesktopReleaseRoute,
  learningOutcomesStudentRoute,
];
