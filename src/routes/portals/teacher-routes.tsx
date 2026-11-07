import { createRoute, lazyRouteComponent } from "@tanstack/react-router";

import { lmsPaths } from "@/app/portal-route-registry";
import { enforcePermissionRoute } from "@/app/router/route-guards";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import {
  authedRoute,
  DesktopReleasePage,
  LearningOutcomesPage,
  permissionStaticData,
  PortableExamPage,
  ProfileBody,
} from "@/routes/portals/route-shared";

type LmsPath = (typeof lmsPaths)[number];

const routePages = () => import("@/features/lms/components/lms-teacher-route-pages");
const page = (name: keyof Awaited<ReturnType<typeof routePages>>) => lazyRouteComponent(routePages, name);
const timekeepingPages = () => import("@/features/timekeeping/components/timekeeping-route-pages");
const timekeepingPage = (name: keyof Awaited<ReturnType<typeof timekeepingPages>>) => lazyRouteComponent(timekeepingPages, name);

/** One child route per Teacher page; adding a path to `lmsPaths` fails type-checking until it has a page. */
const TEACHER_PAGES: Record<LmsPath, ReturnType<typeof page>> = {
  home: page("TeacherHomeRoute"),
  dashboard: page("TeacherHomeRoute"),
  homework: page("TeacherHomeworkRoute"),
  "homework/assign": page("TeacherAssignHomeworkRoute"),
  "homework/exercise-bank": page("TeacherExerciseBankRoute"),
  "homework/progress": page("TeacherHomeworkProgressRoute"),
  "homework/class": page("TeacherClassManagementRoute"),
  "homework/student-groups": page("TeacherStudentGroupsRoute"),
  learning: page("TeacherLearningHubRoute"),
  notifications: page("TeacherNotificationsRoute"),
  account: page("TeacherAccountRoute"),
  "account/login-logs": page("TeacherLoginLogsRoute"),
  score: page("TeacherScoreRoute"),
  attendance: page("TeacherAttendanceRoute"),
  calendar: page("TeacherCalendarRoute"),
  "class-log": page("TeacherClassLogRoute"),
  resources: page("TeacherResourcesRoute"),
  reports: page("TeacherReportsRoute"),
  timekeeping: timekeepingPage("TeacherTimekeepingHomeRoute"),
  "timekeeping/punch": timekeepingPage("TeacherTimekeepingPunchRoute"),
  "timekeeping/timesheet": timekeepingPage("TeacherTimekeepingTimesheetRoute"),
  "timekeeping/requests": timekeepingPage("TeacherTimekeepingRequestsRoute"),
  "timekeeping/approvals": timekeepingPage("TeacherTimekeepingApprovalsRoute"),
};

// Pathless layout: the shell (school/class state, chrome) renders the pages below in its <Outlet />.
const teacherShellRoute = createRoute({
  getParentRoute: () => authedRoute,
  id: "_teacherShell",
  component: lazyRouteComponent(() => import("@/app/pages/teacher/teacher-page")),
});

const teacherIndexRoute = createRoute({
  getParentRoute: () => teacherShellRoute,
  path: "/teacher",
  staticData: permissionStaticData("/teacher", "TEACHER"),
  component: TEACHER_PAGES.home,
});

const teacherPageRoutes = lmsPaths.map((lPath) =>
  createRoute({
    getParentRoute: () => teacherShellRoute,
    path: teacherPath(`/${lPath}`),
    staticData: permissionStaticData(teacherPath(`/${lPath}`), "TEACHER"),
    component: TEACHER_PAGES[lPath],
  }),
);

const teacherNotificationDetailRoute = createRoute({
  getParentRoute: () => teacherShellRoute,
  path: "/teacher/notifications/$notificationId",
  staticData: permissionStaticData(teacherPath("/notifications"), "TEACHER"),
  component: page("TeacherNotificationDetailRoute"),
});

// Standalone pages: same session/host guard, but not inside the Teacher shell.
const teacherProfileRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: teacherPath("/profile"),
  beforeLoad: ({ context, location }) => enforcePermissionRoute(context.auth, location, "account.self.read"),
  component: ProfileBody,
});

const teacherPortableExamRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/teacher/exams/portable",
  staticData: permissionStaticData("/teacher/exams/portable", "TEACHER"),
  component: () => <PortableExamPage workspace="TEACHER" />,
});

const teacherDesktopReleaseRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/teacher/downloads/desktop",
  staticData: permissionStaticData("/teacher/downloads/desktop", "TEACHER"),
  component: () => <DesktopReleasePage workspace="TEACHER" />,
});

const learningOutcomesTeacherRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/teacher/learning-outcomes",
  staticData: permissionStaticData("/teacher/learning-outcomes", "TEACHER"),
  component: () => <LearningOutcomesPage workspace="TEACHER" />,
});

export const teacherRoutes = [
  teacherShellRoute.addChildren([teacherIndexRoute, ...teacherPageRoutes, teacherNotificationDetailRoute]),
  teacherProfileRoute,
  teacherPortableExamRoute,
  teacherDesktopReleaseRoute,
  learningOutcomesTeacherRoute,
];
