/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  createBrowserHistory,
  createHashHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
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
import { crmPaths, lcmsWorkspacePaths, lmsPaths } from "@/app/portal-route-registry";
import { shouldUseHashRouter } from "@/lib/platform";
import { AuthenticatedAccountGate, PortalAuthGate, PortalLoginPage } from "@/platform/auth/components/portal-auth-gates";
import { RootLayout } from "@/layouts/root-layout";
import { Navigate } from "@/routes/router-compat";
import { LMS_ROUTE_PERMISSIONS, type LmsPermission } from "@/platform/auth/permissions/lms-permission-catalog";
import { resolveAuthRouteAccess, type AuthRouteState } from "@/platform/auth/router/auth-route-context";

export type AppRouterContext = {
  auth: AuthRouteState;
};

const DashboardPage = lazy(() => import("@/app/pages/lms/lms-page"));
const CrmPage = lazy(() =>
  import("@/app/pages/crm/crm-page").then((module) => ({
    default: module.CrmPage,
  })),
);
const LcmsPage = lazy(() => import("@/app/pages/lcms/lcms-page"));
const ProfilePage = lazy(() =>
  import("@/app/pages/shared/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
const StudentPage = lazy(() => import("@/app/pages/elearning/elearning-page"));
const QuestionTypeDemoPage = lazy(() =>
  import("@/app/pages/shared/question-type-demo-page").then((module) => ({
    default: module.QuestionTypeDemoPage,
  })),
);

const NotFoundPage = lazy(() =>
  import("@/app/pages/shared/not-found-page").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const AccessDeniedPage = lazy(() =>
  import("@/platform/auth").then((module) => ({
    default: module.AccessDeniedPage,
  })),
);
const TeacherOnboardingPage = lazy(() => import("@/app/pages/auth/teacher-onboarding-page"));

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

const rootRoute = createRootRouteWithContext<AppRouterContext>()({ component: RootLayout });

function enforceProtectedRoute(
  context: AppRouterContext,
  location: { href: string },
  portal: string,
  permission: LmsPermission,
) {
  const decision = resolveAuthRouteAccess(context.auth, { portal, permission });
  if (decision === "allow") return;
  if (decision === "login") {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }
  if (decision === "onboarding") {
    throw redirect({ to: "/onboarding", search: { redirect: location.href } });
  }
  throw redirect({ to: "/access-denied", search: { portal, redirect: location.href } });
}

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

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === "string" && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
        ? search.redirect
        : "/home",
  }),
  beforeLoad: ({ context, location, search }) => {
    if (!context.auth.authenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (context.auth.lifecycle?.status === "ACTIVE" && context.auth.lifecycle.nextSteps.length === 0) {
      throw redirect({ href: search.redirect });
    }
    if (context.auth.lifecycle?.status === "INACTIVE" || context.auth.lifecycle?.status === "BLOCKED") {
      throw redirect({ to: "/access-denied" });
    }
  },
  component: () => (
    <Suspense fallback={<RouteFallback />}>
      <TeacherOnboardingPage />
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
  beforeLoad: ({ context, location }) => {
    if (isPortalHost(LMS_PORTAL_HOSTS)) enforceProtectedRoute(context, location, "lms", LMS_ROUTE_PERMISSIONS.resources);
  },
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
        // Do not redirect here; requests from LMS/CRM should render 404.
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
    beforeLoad: ({ context, location }) => {
      if (lPath === "calendar" && isLcmsPortalHost()) return;
      enforceProtectedRoute(context, location, "lms", LMS_ROUTE_PERMISSIONS[lPath]);
    },
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
    if (isLcms) {
      return (
        <Suspense fallback={<RouteFallback />}>
          <NotFoundPage />
        </Suspense>
      );
    }
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
  beforeLoad: ({ context, location }) =>
    enforceProtectedRoute(context, location, "lms", LMS_ROUTE_PERMISSIONS["homework/class"]),
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
      if (pathStarts(path, "kho-hoc-lieu")) {
        return <Navigate to="/resources" replace />;
      }
    }
    const isLcms = isLcmsPortalHost();
    if (isLcms) {
      if (pathStarts(path, "kho-hoc-lieu")) {
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
      if (pathStarts(path, "kho-hoc-lieu") || pathStarts(path, "chuong-trinh")) {
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
  onboardingRoute,
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
    context: {
      auth: {
        authenticated: false,
        lifecycle: null,
        permissions: [],
        deniedPermissions: [],
        portals: [],
        hasPermission: () => false,
      },
    },
  });
}

export function AppRoutes() {
  return null;
}
