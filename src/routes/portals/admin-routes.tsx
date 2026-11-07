import { lazy, Suspense } from "react";
import { createRoute, lazyRouteComponent, redirect } from "@tanstack/react-router";

import {
  ADMIN_LEARNING_STANDARDS_PATH,
  ADMIN_ENTERPRISE_CONNECTORS_PATH,
  LEGACY_ENTERPRISE_CONNECTORS_PATH,
  LEGACY_LEARNING_STANDARDS_PATH,
  lcmsWorkspacePaths,
} from "@/app/portal-route-registry";
import { enforcePermissionRoute, enforceWorkspaceRoute } from "@/app/router/route-guards";
import { ADMIN_CONTENT_HOME_PATH, ADMIN_CONTENT_ROUTE_PATHS, canonicalAdminWorkspacePath } from "@/features/lcms/admin-content/admin-content-route";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { RoutePendingSkeleton } from "@/routes/route-feedback";
import { authedRoute, permissionStaticData, ProfileBody, rootRoute } from "@/routes/portals/route-shared";

const QuestionTypeDemoPage = lazy(() =>
  import("@/app/pages/shared/question-type-demo-page").then((module) => ({
    default: module.QuestionTypeDemoPage,
  })),
);

const routePages = () => import("@/features/lcms/admin-route-pages");
const page = (name: keyof Awaited<ReturnType<typeof routePages>>) => lazyRouteComponent(routePages, name);

const composePage = (name: "AdminNotificationComposePage" | "TeacherNotificationComposePage") =>
  lazyRouteComponent(() => import("@/app/pages/shared/notification-compose-page"), name);
const inboxPage = (name: "AdminNotificationsPage" | "AdminNotificationDetailPage" | "AdminCampaignDetailPage") =>
  lazyRouteComponent(() => import("@/app/pages/shared/notification-inbox-page"), name);

const CONTENT_REDIRECTED_SEGMENTS = ["questions", "quiz-bank", "quiz-editor"];

/** Component of the Admin menu entries that have their own screen; every other entry uses the generic host. */
function adminPageFor(wPath: string) {
  if (wPath === "settings/permissions") return page("AdminPermissionsRoute");
  if (wPath === "settings/roles") return page("AdminRolesRoute");
  if (wPath === "employees") return page("AdminEmployeesRoute");
  if (wPath === "employees/access-logs") return page("AdminEmployeeAccessLogsRoute");
  if (wPath === "ui-kit") return page("AdminUiKitRoute");
  if (wPath === "notifications") return inboxPage("AdminNotificationsPage");
  if (wPath === "notifications/compose") return composePage("AdminNotificationComposePage");
  if (wPath === "schools" || wPath.startsWith("schools/")) return page("AdminSchoolsRoute");
  return page("AdminGenericRoute");
}

// Pathless layout: the shell (menu, breadcrumb, quiz-import state) renders the pages below in its <Outlet />.
const adminShellRoute = createRoute({
  getParentRoute: () => authedRoute,
  id: "_adminShell",
  component: lazyRouteComponent(() => import("@/app/pages/admin/admin-page")),
});

const adminContentRoutes = ADMIN_CONTENT_ROUTE_PATHS.map((contentPath) =>
  createRoute({
    getParentRoute: () => adminShellRoute,
    path: contentPath,
    staticData: permissionStaticData(contentPath, "ADMIN"),
    component: contentPath === ADMIN_CONTENT_HOME_PATH ? page("AdminContentOverviewRoute") : page("AdminContentWorkspaceRoute"),
  }),
);

const adminMenuRoutes = lcmsWorkspacePaths
  .filter((wPath) => !CONTENT_REDIRECTED_SEGMENTS.includes(wPath) && wPath !== "setting/setting-center-role")
  .map((wPath) => {
    const path = canonicalAdminWorkspacePath(`/${wPath}`);
    return createRoute({
      getParentRoute: () => adminShellRoute,
      path,
      staticData: permissionStaticData(path, "ADMIN"),
      component: adminPageFor(wPath),
    });
  });

// Edit a saved draft / scheduled campaign; the matrix row of notifications/compose covers its children.
const adminNotificationComposeEditRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/admin/notifications/compose/$campaignId",
  staticData: permissionStaticData(adminPath("/notifications/compose"), "ADMIN"),
  component: composePage("AdminNotificationComposePage"),
});

// One inbox message; the matrix row of notifications covers its children (every admin reads their own inbox).
const adminNotificationDetailRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/admin/notifications/$notificationId",
  staticData: permissionStaticData(adminPath("/notifications"), "ADMIN"),
  component: inboxPage("AdminNotificationDetailPage"),
});

// One campaign (KPIs, recipients); "sent/" keeps it apart from compose and $notificationId. Own matrix row: the send permission.
const adminCampaignDetailRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/admin/notifications/sent/$campaignId",
  staticData: permissionStaticData(adminPath("/notifications/sent"), "ADMIN"),
  component: inboxPage("AdminCampaignDetailPage"),
});

// Legacy alias of settings/roles.
const settingCenterRoleRedirectRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: canonicalAdminWorkspacePath("/setting/setting-center-role"),
  staticData: permissionStaticData(canonicalAdminWorkspacePath("/setting/setting-center-role"), "ADMIN"),
  beforeLoad: () => {
    throw redirect({ href: adminPath("/settings/roles"), replace: true });
  },
});

const adminIntegrationRoutes = [
  [ADMIN_LEARNING_STANDARDS_PATH, "AdminLearningStandardsRoute"],
  [ADMIN_ENTERPRISE_CONNECTORS_PATH, "AdminEnterpriseConnectorsRoute"],
  ["/admin/learning-outcomes", "AdminLearningOutcomesRoute"],
] as const;

// /admin is the "Trang chủ" menu entry: schools, learners and staff from the live APIs (no sample data).
const adminIndexRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/admin",
  staticData: permissionStaticData("/admin", "ADMIN"),
  component: page("AdminHomeRoute"),
});

// Standalone pages: same session/host guard, but not inside the Admin shell.
const adminProfileRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: adminPath("/profile"),
  beforeLoad: ({ context, location }) => enforcePermissionRoute(context.auth, location, "account.self.read"),
  component: ProfileBody,
});

const questionTypesRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: adminPath("/question-types"),
  staticData: permissionStaticData(adminPath("/question-types"), "ADMIN"),
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
    beforeLoad: () => {
      throw redirect({ href: adminPath(`/content/${segment}`), replace: true });
    },
  }),
);

// Legacy /integration/* aliases keep the workspace guard (the matrix has no row for them, so they stay denied).
const legacyIntegrationRoutes = [
  [LEGACY_LEARNING_STANDARDS_PATH, ADMIN_LEARNING_STANDARDS_PATH],
  [LEGACY_ENTERPRISE_CONNECTORS_PATH, ADMIN_ENTERPRISE_CONNECTORS_PATH],
].map(([legacyPath, target]) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: legacyPath,
    beforeLoad: ({ context, location }) => {
      enforceWorkspaceRoute(context.auth, location, "ADMIN");
      throw redirect({ href: target, replace: true });
    },
  }),
);

/** Root-level legacy aliases (no workspace guard of their own, except /integration/*). */
export const adminRoutes = [...legacyAdminContentRoutes, ...legacyIntegrationRoutes];

/** Children of `_authed`: guarded once by authedBeforeLoad. */
export const adminAuthedRoutes = [
  adminProfileRoute,
  questionTypesRoute,
  settingCenterRoleRedirectRoute,
  adminShellRoute.addChildren([
    adminIndexRoute,
    ...adminContentRoutes,
    ...adminMenuRoutes,
    adminNotificationComposeEditRoute,
    adminNotificationDetailRoute,
    adminCampaignDetailRoute,
    ...adminIntegrationRoutes.map(([path, pageName]) =>
      createRoute({ getParentRoute: () => adminShellRoute, path, staticData: permissionStaticData(path, "ADMIN"), component: page(pageName) }),
    ),
  ]),
];
