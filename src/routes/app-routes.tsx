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
  LCMS_PORTAL_HOST,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOST,
  shouldRedirectLocalPortal,
} from "@/config/portal-urls";
import { shouldUseHashRouter } from "@/lib/platform";
import { AuthenticatedAccountGate, PortalAuthGate, PortalLoginPage } from "@/platform/auth/components/portal-auth-gates";
import { RootLayout } from "@/layouts/root-layout";
import { Navigate, useLocation } from "@/routes/router-compat";

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
    default: module.LcmsPortalShell,
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
const PublicDisclosurePage = lazy(() =>
  import("@/pages/public-disclosure-page").then((module) => ({
    default: module.PublicDisclosurePage,
  })),
);
const PublicDisclosureAdminPage = lazy(() =>
  import("@/pages/public-disclosure-admin-page").then((module) => ({
    default: module.PublicDisclosureAdminPage,
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
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--erg-blue)]" />
      </div>
    </div>
  );
}

function PortalHostRedirect({
  children,
  preservePathAndSearch = false,
  targetHost,
  targetPath = "/",
}: {
  children?: ReactNode;
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

  if (shouldRedirect) return <RouteFallback />;

  return children ?? <RouteFallback />;
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

function AppRoutesContent() {
  const location = useLocation();
  const path = stripPath(location.pathname);
  const isRoot = path === "";
  const isLcmsPortal = isLcmsPortalHost();
  const isCrmPortal = isPortalHost(CRM_PORTAL_HOSTS);
  const isLmsPortal = isPortalHost(LMS_PORTAL_HOST);
  const isElearningPortal = isPortalHost(ELEARNING_PORTAL_HOSTS);

  let element: ReactNode;

  if (isLcmsPortal) {
    if (path === "access-denied") element = <AccessDeniedPage />;
    else if (path === "login") element = <PortalLoginPage portal="lcms" />;
    else if (isRoot || ["schools", "import", "users", "questions", "quiz-bank", "quiz-editor", "resources", "legal", "settings"].includes(path)) element = withPortalAuth("lcms", <LcmsPage />);
    else if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "hoclieu")) element = <Navigate to="/resources" replace />;
    else element = <NotFoundPage />;
  } else if (isCrmPortal) {
    if (path === "access-denied") element = <AccessDeniedPage />;
    else if (path === "login") element = <PortalLoginPage portal="crm" />;
    else if (isRoot || ["seo", "seo/schools", "seo/opportunities", "seo/pnl", "seo/follow-ups", "seo/handover"].includes(path)) element = withPortalAuth("crm", <CrmPage />);
    else if (["schools", "import", "users", "questions", "quiz-bank", "quiz-editor", "resources", "legal", "settings"].includes(path)) element = <PortalHostRedirect targetHost={LCMS_PORTAL_HOST} preservePathAndSearch />;
    else element = <NotFoundPage />;
  } else if (isLmsPortal) {
    if (path === "access-denied") element = <AccessDeniedPage />;
    else if (path === "login") element = <PortalLoginPage portal="lms" />;
    else if (path === "classes" || path === "homework/classes") element = <Navigate to="/homework/class" replace />;
    else if (isRoot || pathStarts(path, "homework") || pathStarts(path, "notifications") || path === "account" || path === "account/login-logs" || ["score", "attendance", "calendar", "class-log", "resources", "reports"].includes(path)) element = withPortalAuth("lms", <DashboardPage />);
    else if (path === "teaching-schedule") element = <Navigate to="/calendar" replace />;
    else if (path === "profile") element = <AuthenticatedAccountGate><ProfilePage /></AuthenticatedAccountGate>;
    else if (path === "student") element = <PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />;
    else if (path === "dashboard") element = <Navigate to="/homework" replace />;
    else if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "hoclieu")) element = <Navigate to="/resources" replace />;
    else element = <NotFoundPage />;
  } else if (isElearningPortal) {
    if (path === "access-denied") element = <AccessDeniedPage />;
    else if (path === "login") element = <PortalLoginPage portal="elearning" />;
    else if (isRoot) element = withPortalAuth("elearning", <StudentPage />);
    else if (path === "student") element = <Navigate to="/" replace />;
    else element = <NotFoundPage />;
  } else {
    if (path === "access-denied") element = <AccessDeniedPage />;
    else if (path === "student") element = <PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />;
    else if (path === "admin" || path === "crm") element = <PortalHostRedirect targetHost={CRM_PORTAL_HOST} />;
    else if (path === "dashboard") element = <PortalHostRedirect targetHost={LMS_PORTAL_HOST} />;
    else if (path === "cong-khai" || pathStarts(path, "cong-khai/viewer")) element = <PublicDisclosurePage />;
    else if (path === "public-disclosure") element = <PublicDisclosureAdminPage />;
    else if (path === "question-types") element = <QuestionTypeDemoPage />;
    else if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "chuong-trinh") || pathStarts(path, "hoclieu")) element = <PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />;
    else if (["cong-dong", "portfolio", "quizzes"].includes(path)) element = <PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />;
    else element = <NotFoundPage />;
  }

  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: AppRoutesContent });
const publicDisclosureViewerRoute = createRoute({ getParentRoute: () => rootRoute, path: "cong-khai/viewer/$documentId", component: AppRoutesContent });
const catchAllRoute = createRoute({ getParentRoute: () => rootRoute, path: "$", component: AppRoutesContent });

export const routeTree = rootRoute.addChildren([indexRoute, publicDisclosureViewerRoute, catchAllRoute]);

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
  return <AppRoutesContent />;
}
