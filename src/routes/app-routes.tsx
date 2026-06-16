/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  createBrowserHistory,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import {
  CRM_PORTAL_HOST,
  CRM_PORTAL_HOSTS,
  ELEARNING_PORTAL_HOST,
  ELEARNING_PORTAL_HOSTS,
  isPortalHost,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOST,
  LMS_PORTAL_HOSTS,
  shouldRedirectLocalPortal,
} from "@/config/portal-urls";
import { shouldUseHashRouter } from "@/lib/platform";
import { AuthenticatedAccountGate, PortalAuthGate, PortalLoginPage } from "@/platform/auth/components/portal-auth-gates";
import { RootLayout } from "@/layouts/root-layout";
import { Navigate } from "@/routes/router-compat";

const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);
const CrmPage = lazy(() =>
  import("@/pages/crm-page").then((module) => ({
    default: module.CrmPage,
  })),
);
const LcmsPage = lazy(() =>
  import("@/features/lcms").then((module) => ({
    default: module.LcmsCenterupShell ?? module.LcmsPortalShell,
  })),
);
const ProfilePage = lazy(() =>
  import("@/pages/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
const StudentPage = lazy(() =>
  import("@/pages/student-page").then((module) => ({
    default: module.StudentPage,
  })),
);
const QuestionTypeDemoPage = lazy(() =>
  import("@/pages/question-type-demo-page").then((module) => ({
    default: module.QuestionTypeDemoPage,
  })),
);

const NotFoundPage = lazy(() =>
  import("@/pages/not-found-page").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const AccessDeniedPage = lazy(() =>
  import("@/platform/auth").then((module) => ({
    default: module.AccessDeniedPage,
  })),
);

function isLcmsPortalHost() {
  return isPortalHost(LCMS_PORTAL_HOSTS);
}

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--erg-bg)] px-6">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--primary)]" />
      </div>
    </div>
  );
}

function PortalHostRedirect({
  preservePathAndSearch = false,
  targetHost,
  targetPath = "/",
}: {
  preservePathAndSearch?: boolean;
  targetHost: string;
  targetPath?: string;
}) {
  const shouldRedirect = shouldRedirectLocalPortal(targetHost);

  useEffect(() => {
    if (!shouldRedirect || typeof window === "undefined") return;

    const targetUrl = new URL(window.location.href);
    targetUrl.host = targetHost;
    if (!preservePathAndSearch) {
      targetUrl.pathname = targetPath;
      targetUrl.search = "";
    }
    targetUrl.hash = "";
    window.location.replace(targetUrl.toString());
  }, [preservePathAndSearch, shouldRedirect, targetHost, targetPath]);

  return <RouteFallback />;
}

function withPortalAuth(portal: "lcms" | "crm" | "lms" | "elearning", children: ReactNode) {
  return <PortalAuthGate portal={portal}>{children}</PortalAuthGate>;
}

function stripPath(pathname: string) {
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

function pathStarts(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

const lcmsWorkspacePaths = [
  "schools",
  "users",
  "questions",
  "quiz-bank",
  "quiz-editor",
  "assignments",
  "rubrics",
  "session-templates",
  "report-templates",
  "legal",
  "settings",
  // CenterUp-style LCMS pages — đảm bảo không trùng với LMS redirect routes
  "courses",
  "sessions",
  "customers",
  "center-tasks",
  "students/list-center-student",
  "students/list-student-course",
  "students/list-class-enroll",
  "students/list-student-session",
  "students/list-student-assignment",
  "students/student-absence",
  "employees",
  "employees/face-detection",
  "employees/timesheet",
  "employees/teacher-absence",
  "finance/orders",
  "finance/product-import-summaries",
  "finance/incomes",
  "finance/expenses",
  "finance/refunds",
  "finance/center-transactions",
  "finance/center-transactions/coins",
  "other/products",
  "other/partners",
  "report/dashboard-report",
  "report/crm-report",
  "report/student-report",
  "report/task-report",
  "report/cash-flow-report",
  "report/pnl-report",
  "report/sale-report",
  "setting/setting-center-feature",
  "setting/setting-center-role",
  "setting/promotions/price-discount-programs",
  "setting/promotions/vouchers",
  "setting/promotions/discounts",
  "setting/setting-center-task/task-status",
  "setting/setting-center-customer/customer-status",
  "setting/setting-class-room",
  "setting/setting-calendar-event",
  "setting/setting-criteria-score",
  "setting/setting-income-expense",
  "integration/setting-call-center",
  "integration/setting-zalo-account",
  "integration/setting-center-api-key",
];
// Các path này đã có route riêng (không thể thêm vào lcmsRoutes vì trùng lặp)
// LCMS portal sẽ xử lý chúng trong catch-all route
const crmPaths = [
  "seo",
  "seo/schools",
  "seo/opportunities",
  "seo/pnl",
  "seo/follow-ups",
  "seo/handover",
];

const lmsPaths = [
  "home",
  "dashboard",
  "homework",
  "homework/assign",
  "homework/exercise-bank",
  "homework/progress",
  "homework/student-groups",
  "notifications",
  "account",
  "account/login-logs",
  "score",
  "attendance",
  "calendar",
  "class-log",
  "reports",
];

// Declarative host checking component
function PortalRoute({
  allowedPortals,
  element,
  targetHostIfRedirect,
  targetPathIfRedirect,
  preservePath = true,
}: {
  allowedPortals: Array<"lms" | "lcms" | "crm" | "elearning">;
  element: ReactNode;
  targetHostIfRedirect?: string;
  targetPathIfRedirect?: string;
  preservePath?: boolean;
}) {
  const isLcms = isLcmsPortalHost();
  const isCrm = isPortalHost(CRM_PORTAL_HOSTS);
  const isLms = isPortalHost(LMS_PORTAL_HOSTS);
  const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);

  let activePortal: "lms" | "lcms" | "crm" | "elearning" | null = null;
  if (isLms) activePortal = "lms";
  else if (isLcms) activePortal = "lcms";
  else if (isCrm) activePortal = "crm";
  else if (isElearning) activePortal = "elearning";

  if (activePortal && allowedPortals.includes(activePortal)) {
    return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
  }

  if (targetHostIfRedirect) {
    return (
      <PortalHostRedirect
        targetHost={targetHostIfRedirect}
        targetPath={targetPathIfRedirect}
        preservePathAndSearch={preservePath}
      />
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <NotFoundPage />
    </Suspense>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const isLcms = isLcmsPortalHost();
    const isCrm = isPortalHost(CRM_PORTAL_HOSTS);
    const isLms = isPortalHost(LMS_PORTAL_HOSTS);
    const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);

    if (isLcms) return withPortalAuth("lcms", <LcmsPage />);
    if (isCrm) return withPortalAuth("crm", <CrmPage />);
    if (isLms) return <Navigate to="/home" replace />;
    if (isElearning) return withPortalAuth("elearning", <StudentPage />);
    return (
      <Suspense fallback={<RouteFallback />}>
        <NotFoundPage />
      </Suspense>
    );
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => {
    const isLcms = isLcmsPortalHost();
    const isCrm = isPortalHost(CRM_PORTAL_HOSTS);
    const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);
    const portal = isLcms ? "lcms" : isCrm ? "crm" : isElearning ? "elearning" : "lms";
    return <PortalLoginPage portal={portal} />;
  },
});

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/access-denied",
  component: () => (
    <Suspense fallback={<RouteFallback />}>
      <AccessDeniedPage />
    </Suspense>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <AuthenticatedAccountGate>
      <Suspense fallback={<RouteFallback />}>
        <ProfilePage />
      </Suspense>
    </AuthenticatedAccountGate>
  ),
});

const questionTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/question-types",
  component: () => (
    <Suspense fallback={<RouteFallback />}>
      <QuestionTypeDemoPage />
    </Suspense>
  ),
});

const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resources",
  component: () => (
    <PortalRoute
      allowedPortals={["lcms", "lms"]}
      element={(() => {
        const isLcms = isLcmsPortalHost();
        return isLcms
          ? withPortalAuth("lcms", <LcmsPage />)
          : withPortalAuth("lms", <DashboardPage />);
      })()}
      targetHostIfRedirect={LMS_PORTAL_HOST}
    />
  ),
});

const lcmsRoutes = lcmsWorkspacePaths.map((wPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/${wPath}`,
    component: () => (
      <PortalRoute
        allowedPortals={["lcms"]}
        element={withPortalAuth("lcms", <LcmsPage />)}
        // KHÔNG redirect — nếu vào từ LMS/CRM thì show 404
      />
    ),
  })
);

const crmRoutes = crmPaths.map((cPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/${cPath}`,
    component: () => (
      <PortalRoute
        allowedPortals={["crm"]}
        element={withPortalAuth("crm", <CrmPage />)}
      />
    ),
  })
);

const lmsRoutes = lmsPaths.map((lPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/${lPath}`,
    component: () => {
      if (lPath === "calendar" && isLcmsPortalHost()) {
        return withPortalAuth("lcms", <LcmsPage />);
      }

      return (
        <PortalRoute
          allowedPortals={["lms"]}
          element={withPortalAuth("lms", <DashboardPage />)}
          targetHostIfRedirect={LMS_PORTAL_HOST}
        />
      );
    },
  })
);

const classesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/classes",
  component: () => {
    const isLcms = isPortalHost(LCMS_PORTAL_HOSTS);
    const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);
    if (isLcms) return withPortalAuth("lcms", <LcmsPage />);
    if (isElearning) return <Navigate to="/" replace />;
    return <Navigate to="/homework" replace />;
  },
});

const homeworkClassesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/homework/classes",
  component: () => <Navigate to="/homework" replace />,
});

const homeworkClassRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/homework/class",
  component: () => (
    <PortalRoute
      allowedPortals={["lms"]}
      element={withPortalAuth("lms", <DashboardPage />)}
      targetHostIfRedirect={LMS_PORTAL_HOST}
    />
  ),
});

const teachingScheduleRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teaching-schedule",
  component: () => <Navigate to="/calendar" replace />,
});

const studentRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  component: () => {
    const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);
    if (isElearning) return <Navigate to="/" replace />;
    return <PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />;
  },
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: () => {
    const path = stripPath(window.location.pathname);
    const isLms = isPortalHost(LMS_PORTAL_HOSTS);
    if (isLms) {
      if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "hoclieu")) {
        return <Navigate to="/resources" replace />;
      }
    }
    const isLcms = isLcmsPortalHost();
    if (isLcms) {
      if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "hoclieu")) {
        return <Navigate to="/resources" replace />;
      }
    }
    if (!isLms && !isLcms && !isPortalHost(CRM_PORTAL_HOSTS) && !isPortalHost(ELEARNING_PORTAL_HOSTS)) {
      if (path === "admin" || path === "crm") {
        return <PortalHostRedirect targetHost={CRM_PORTAL_HOST} />;
      }
      if (path === "dashboard") {
        return <PortalHostRedirect targetHost={LMS_PORTAL_HOST} />;
      }
      if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "chuong-trinh") || pathStarts(path, "hoclieu")) {
        return <PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />;
      }
      if (["cong-dong", "portfolio", "quizzes"].includes(path)) {
        return <PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />;
      }
    }
    return (
      <Suspense fallback={<RouteFallback />}>
        <NotFoundPage />
      </Suspense>
    );
  },
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  accessDeniedRoute,
  profileRoute,
  questionTypesRoute,
  resourcesRoute,
  classesRedirectRoute,
  homeworkClassesRedirectRoute,
  homeworkClassRedirectRoute,
  teachingScheduleRedirectRoute,
  studentRedirectRoute,
  ...lcmsRoutes,
  ...crmRoutes,
  ...lmsRoutes,
  catchAllRoute,
]);

export function createAppRouter() {
  return createRouter({
    defaultPreload: "intent",
    defaultPreloadDelay: 75,
    defaultPreloadStaleTime: 0,
    history: shouldUseHashRouter() ? createHashHistory() : createBrowserHistory(),
    routeTree,
  });
}

export function AppRoutes() {
  return null;
}
