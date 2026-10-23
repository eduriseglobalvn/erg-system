import { lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  createBrowserHistory,
  createHashHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Navigate,
  redirect,
  useLocation,
} from "@tanstack/react-router";

import {
  ELEARNING_PORTAL_HOSTS,
  isPortalHost,
  LCMS_PORTAL_HOSTS,
  shouldRedirectLocalPortal,
} from "@/config/portal-urls";
import {
  ADMIN_LEARNING_STANDARDS_PATH,
  ADMIN_ENTERPRISE_CONNECTORS_PATH,
  LEGACY_ENTERPRISE_CONNECTORS_PATH,
  LEGACY_LEARNING_STANDARDS_PATH,
  crmPaths,
  lcmsWorkspacePaths,
  lmsPaths,
} from "@/app/portal-route-registry";
import { shouldUseHashRouter } from "@/lib/platform";
import { getAdaptiveLoadingPolicy } from "@/lib/network-quality";
import { PortalLoginPage } from "@/platform/auth/components/portal-login-page";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { AuthenticatedAccountGate, PortalAuthGate } from "@/platform/auth/components/portal-route-gates";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { resolveWorkspaceLandingTarget } from "@/platform/auth/utils/access-denied";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import { RootLayout } from "@/layouts/root-layout";
import type { AuthRouteState } from "@/platform/auth/router/auth-route-context";
import { RouteErrorBoundary, RoutePendingSkeleton } from "@/routes/route-feedback";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { enforcePermissionRoute, enforceWorkspaceRoute } from "@/app/router/route-guards";
import { recordLegacyAliasHit, resolveLegacyRouteRedirect } from "@/app/router/legacy-route-redirects";
import { ADMIN_CONTENT_ROUTE_PATHS } from "@/features/lcms/admin-content/admin-content-route";
import { canonicalAdminWorkspacePath } from "@/features/lcms/admin-content/admin-content-route";
import { adminPath, studentPath, teacherPath } from "@/platform/workspaces/workspace-paths";
import {
  canonicalLmsWorkspaceHostForRuntime,
  canonicalCrmWorkspaceHostForRuntime,
  isCanonicalLmsWorkspaceHost,
} from "@/platform/workspaces/workspace-route";
import { buildRedirectPath, sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import {
  desktopLoginPortal,
  desktopWorkspaceFromLoginSearch,
  getDesktopRuntime,
  resolveDesktopWorkspaceLanding,
} from "@/platform/desktop";

export type AppRouterContext = {
  auth: AuthRouteState;
};

const DashboardPage = lazy(() => import("@/app/pages/teacher/teacher-page"));
const CrmPage = lazy(() =>
  import("@/app/pages/crm/crm-page").then((module) => ({
    default: module.CrmPage,
  })),
);
const LcmsPage = lazy(() => import("@/app/pages/admin/admin-page"));
const ProfilePage = lazy(() =>
  import("@/app/pages/shared/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
const StudentPage = lazy(() => import("@/app/pages/student/student-page"));
const LearningOutcomesPage = lazy(() => import("@/app/pages/lms/learning-outcomes-page"));
const LearningStandardsPage = lazy(() => import("@/app/pages/admin/learning-standards-page"));
const EnterpriseConnectorsPage = lazy(() => import("@/app/pages/admin/enterprise-connectors-page"));
const QuestionTypeDemoPage = lazy(() =>
  import("@/app/pages/shared/question-type-demo-page").then((module) => ({
    default: module.QuestionTypeDemoPage,
  })),
);
const PortableExamPage = lazy(() =>
  import("@/app/pages/shared/portable-exam-page").then((module) => ({
    default: module.PortableExamPage,
  })),
);
const DesktopReleasePage = lazy(() =>
  import("@/app/pages/shared/desktop-release-page").then((module) => ({
    default: module.DesktopReleasePage,
  })),
);
const DesktopWorkspaceEntryPage = lazy(() =>
  import("@/app/pages/shared/desktop-workspace-entry-page").then((module) => ({
    default: module.DesktopWorkspaceEntryPage,
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

function PortalHostRedirect({
  preservePathAndSearch = false,
  preserveSearch = false,
  targetHost,
  targetPath = "/",
}: {
  preservePathAndSearch?: boolean;
  preserveSearch?: boolean;
  targetHost: string;
  targetPath?: string;
}) {
  const shouldRedirect = shouldRedirectLocalPortal(targetHost);

  useEffect(() => {
    if (!shouldRedirect || typeof window === "undefined") return;

    const targetHostWithPort = runtimeHost(targetHost);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const requestedPath = preservePathAndSearch
      ? currentPath
      : `${targetPath}${preserveSearch ? `${window.location.search}${window.location.hash}` : ""}`;
    const safePath = sanitizeLocalRedirect(requestedPath) ?? sanitizeLocalRedirect(targetPath) ?? "/";
    const targetUrl = new URL(`https://${targetHostWithPort}${safePath}`);
    if (isLocalRuntimeHost(window.location.hostname) && window.location.protocol !== "https:") {
      targetUrl.protocol = window.location.protocol;
    }
    window.location.replace(targetUrl.toString());
  }, [preservePathAndSearch, preserveSearch, shouldRedirect, targetHost, targetPath]);

  return <RoutePendingSkeleton />;
}

function runtimeHost(host: string) {
  if (typeof window === "undefined") return host;
  if (window.location.port === "3001" && !host.includes(":")) return `${host}:3001`;
  return host;
}

function isLocalRuntimeHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized.endsWith(".erg.edu.local");
}

function LegacyAliasRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return <RoutePendingSkeleton />;
}

function withPortalAuth(portal: "lcms" | "crm" | "lms" | "elearning", children: ReactNode, requiredPermission?: string) {
  return <PortalAuthGate portal={portal} requiredPermission={requiredPermission}>{children}</PortalAuthGate>;
}

function stripPath(pathname: string) {
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "");
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
  const activePortal = resolveActivePortal();

  if (activePortal && allowedPortals.includes(activePortal)) {
    return <Suspense fallback={<RoutePendingSkeleton />}>{element}</Suspense>;
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
    <Suspense fallback={<RoutePendingSkeleton />}>
      <NotFoundPage />
    </Suspense>
  );
}

const rootRoute = createRootRouteWithContext<AppRouterContext>()({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PortalIndexPage,
});

function PortalIndexPage() {
  const activePortal = resolveActivePortal();
  const auth = useAuthSession();
  const studentSession = getCurrentStudentSession();

  if (getDesktopRuntime() === "tauri") {
    if (studentSession) return <Navigate to="/student" replace />;
    if (auth.isHydratingProfile) return <RoutePendingSkeleton />;
    if (auth.account) {
      const landingTarget = resolveDesktopWorkspaceLanding({
        workspaces: auth.session?.workspaces,
        roles: auth.session?.roles,
        portals: auth.session?.portals,
        permissions: auth.session?.permissions,
        deniedPermissions: auth.session?.deniedPermissions,
      });
      return landingTarget
        ? <Navigate to={landingTarget.path} replace />
        : <Navigate to="/access-denied" replace />;
    }
    return (
      <Suspense fallback={<RoutePendingSkeleton />}>
        <DesktopWorkspaceEntryPage />
      </Suspense>
    );
  }
  if (studentSession) return <Navigate to="/student" replace />;
  if (activePortal === "lcms") return <Navigate to="/admin" replace />;
  if (activePortal === "crm") return withPortalAuth("crm", <CrmPage />, "seo.manage");
  if (activePortal === "lms") {
    const isPlatformSuperAdmin = (auth.session?.roles ?? []).some((role) =>
      ["super_admin", "super-admin", "system.super_admin", "erg_super_admin", "global_admin"].includes(role.trim().toLowerCase()),
    ) && (auth.session?.permissions ?? []).some((permission) => permission.trim() === "*");
    const landingTarget = auth.account
      ? resolveWorkspaceLandingTarget({
          // Let verified capabilities choose the default workspace. A plain
          // lms host must not force every authenticated account into Teacher.
          preferredWorkspace: isPlatformSuperAdmin ? "ADMIN" : undefined,
          workspaces: auth.session?.workspaces,
          roles: auth.session?.roles,
          portals: auth.session?.portals,
          permissions: auth.session?.permissions,
          deniedPermissions: auth.session?.deniedPermissions,
        })
      : undefined;

    if (landingTarget?.workspace === "CRM") {
      return <PortalHostRedirect targetHost={canonicalCrmWorkspaceHostForRuntime()} targetPath="/" />;
    }
    const accountLooksAdmin = auth.account?.role === "admin"
      || (auth.session?.permissions ?? []).some((permission) => permission.trim().toLowerCase() === "lms.admin");
    return <Navigate to={landingTarget?.path ?? (accountLooksAdmin ? "/admin" : "/teacher")} replace />;
  }
  if (activePortal === "elearning") return withPortalAuth("elearning", <StudentPage />, "elearning.assignment.read_self");
  return (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <NotFoundPage />
    </Suspense>
  );
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: DesktopLoginRoute,
});

function DesktopLoginRoute() {
  const location = useLocation();
  if (AUTH_BYPASS_ENABLED) {
    const search = new URLSearchParams(location.searchStr);
    const redirectTarget = search.get("redirect") || "/admin";
    return <Navigate to={redirectTarget} replace />;
  }
  const activePortal = resolveActivePortal();
  const workspace = getDesktopRuntime() === "tauri"
    ? desktopWorkspaceFromLoginSearch(location.searchStr)
    : undefined;
  const portal = getDesktopRuntime() === "tauri"
    ? desktopLoginPortal(workspace)
    : activePortal ?? "lms";
  return <PortalLoginPage portal={portal} />;
}

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/access-denied",
  component: () => (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <AccessDeniedPage />
    </Suspense>
  ),
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === "string" ? sanitizeLocalRedirect(search.redirect) ?? teacherPath("/home") : teacherPath("/home"),
  }),
  beforeLoad: ({ context, location, search }) => {
    if (!context.auth.authenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: buildRedirectPath(location.pathname, location.searchStr, location.hash) },
      });
    }
    if (context.auth.lifecycle?.status === "ACTIVE" && context.auth.lifecycle.nextSteps.length === 0) {
      throw redirect({ href: search.redirect });
    }
    if (context.auth.lifecycle?.status === "INACTIVE" || context.auth.lifecycle?.status === "BLOCKED") {
      throw redirect({ to: "/access-denied" });
    }
  },
  component: () => (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <TeacherOnboardingPage />
    </Suspense>
  ),
});

function ProfileRouteContent({ portal }: { portal: "lcms" | "crm" | "lms" | "elearning" }) {
  return withPortalAuth(
    portal,
    <AuthenticatedAccountGate>
      <Suspense fallback={<RoutePendingSkeleton />}>
        <ProfilePage />
      </Suspense>
    </AuthenticatedAccountGate>,
  );
}

const adminProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: adminPath("/profile"),
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "ADMIN");
    enforcePermissionRoute(context.auth, location, "account.self.read");
  },
  component: () => <ProfileRouteContent portal="lcms" />,
});

const teacherProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: teacherPath("/profile"),
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "TEACHER");
    enforcePermissionRoute(context.auth, location, "account.self.read");
  },
  component: () => <ProfileRouteContent portal="lms" />,
});

const studentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: studentPath("/profile"),
  beforeLoad: ({ context, location }) => {
    enforceWorkspaceRoute(context.auth, location, "STUDENT");
    enforcePermissionRoute(context.auth, location, "account.self.read");
  },
  component: () => <ProfileRouteContent portal="elearning" />,
});

const legacyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: ({ context, location }) => enforcePermissionRoute(context.auth, location, "account.self.read"),
  component: () => {
    const activePortal = resolveActivePortal();
    if (activePortal === "crm") return <ProfileRouteContent portal="crm" />;
    const target = activePortal === "lcms"
      ? adminPath("/profile")
      : activePortal === "elearning"
        ? studentPath("/profile")
        : teacherPath("/profile");
    return <Navigate to={target} replace />;
  },
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
        element={withPortalAuth("lcms", <LcmsPage />)}
        // Do not redirect here; requests from LMS/CRM should render 404.
      />
    ),
    }),
  );

const crmRoutes = crmPaths.map((cPath) =>
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
  })
);

const lmsRoutes = lmsPaths.map((lPath) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: teacherPath(`/${lPath}`),
    beforeLoad: ({ context, location }) => {
      enforceWorkspaceRoute(context.auth, location, "TEACHER");
    },
    component: () => {
      return (
        <PortalRoute
          allowedPortals={["lms"]}
          element={withPortalAuth("lms", <DashboardPage />)}
          targetHostIfRedirect={canonicalLmsWorkspaceHostForRuntime()}
        />
      );
    },
  })
);

const LEGACY_ADMIN_CONTENT_SEGMENTS = ["structure", "resources", "questions", "quiz-bank", "quiz-editor"] as const;
const legacyWorkspaceSegments = Array.from(new Set([
  ...lcmsWorkspacePaths,
  ...lmsPaths,
  ...LEGACY_ADMIN_CONTENT_SEGMENTS,
  "question-types",
]));

function canonicalLegacyWorkspacePath(segment: string) {
  const legacyPath = `/${stripPath(segment)}`;
  const activePortal = resolveActivePortal();
  const isAdminOnlySegment = lcmsWorkspacePaths.includes(segment as (typeof lcmsWorkspacePaths)[number])
    && !lmsPaths.includes(segment as (typeof lmsPaths)[number]);
  if (activePortal === "lcms" || isAdminOnlySegment) return canonicalAdminWorkspacePath(legacyPath);
  if (activePortal === "elearning") return studentPath(legacyPath);
  return teacherPath(legacyPath);
}

function LegacyWorkspaceRedirect({ segment }: { segment: string }) {
  const targetPath = canonicalLegacyWorkspacePath(segment);
  if (typeof window !== "undefined" && isCanonicalLmsWorkspaceHost(window.location)) {
    const suffix = `${window.location.search}${window.location.hash}`;
    return <LegacyAliasRedirect href={sanitizeLocalRedirect(`${targetPath}${suffix}`) ?? targetPath} />;
  }
  return (
    <PortalHostRedirect
      preserveSearch
      targetHost={canonicalLmsWorkspaceHostForRuntime()}
      targetPath={targetPath}
    />
  );
}

const legacyWorkspaceRoutes = legacyWorkspaceSegments.map((segment) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/${segment}`,
    component: () => <LegacyWorkspaceRedirect segment={segment} />,
  }),
);

const classesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/classes",
  component: () => {
    const isLcms = isPortalHost(LCMS_PORTAL_HOSTS);
    const isElearning = isPortalHost(ELEARNING_PORTAL_HOSTS);
    if (isLcms) {
      return (
        <Suspense fallback={<RoutePendingSkeleton />}>
          <NotFoundPage />
        </Suspense>
      );
    }
     if (isElearning) return <Navigate to="/student" replace />;
     return <Navigate to="/teacher/homework" replace />;
  },
});

const homeworkClassesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/homework/classes",
   component: () => <Navigate to="/teacher/homework" replace />,
});

const teachingScheduleRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teaching-schedule",
   component: () => <Navigate to="/teacher/calendar" replace />,
});

const adminWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN"),
  component: () => {
    if (!isCanonicalLmsWorkspaceHost(window.location)) {
      return <PortalHostRedirect targetHost={canonicalLmsWorkspaceHostForRuntime()} targetPath="/admin" />;
    }
        return withPortalAuth("lcms", <LcmsPage />);
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
    return withPortalAuth("lcms", <LearningStandardsPage />);
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
    return withPortalAuth("lcms", <EnterpriseConnectorsPage />);
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
    return withPortalAuth("lcms", <LearningOutcomesPage workspace="ADMIN" />, "learning.outcomes.manage");
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
        return withPortalAuth("lcms", <LcmsPage />);
    },
  }),
);

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

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: () => {
    const path = stripPath(window.location.pathname);
    const legacyRedirect = resolveLegacyRouteRedirect(path, resolveActivePortal());
    if (legacyRedirect && isRecognizedErgHost(window.location.hostname)) {
      recordLegacyAliasHit(path, legacyRedirect);
      const targetHost = legacyRedirect.target === "crm"
        ? canonicalCrmWorkspaceHostForRuntime()
        : canonicalLmsWorkspaceHostForRuntime();
      const safePath = sanitizeLocalRedirect(
        `${legacyRedirect.path ?? "/"}${window.location.search}${window.location.hash}`,
      ) ?? legacyRedirect.path ?? "/";
      if (!shouldRedirectLocalPortal(targetHost)) {
        // A canonical workspace path that has no concrete route must not
        // redirect to itself forever through the catch-all alias boundary.
        if (safePath.split(/[?#]/, 1)[0] === `/${path}`) {
          return (
            <Suspense fallback={<RoutePendingSkeleton />}>
              <NotFoundPage />
            </Suspense>
          );
        }
        return <LegacyAliasRedirect href={safePath} />;
      }
      return (
        <PortalHostRedirect
          preserveSearch
          targetHost={targetHost}
          targetPath={legacyRedirect.path}
        />
      );
    }
    return (
      <Suspense fallback={<RoutePendingSkeleton />}>
        <NotFoundPage />
      </Suspense>
    );
  },
});

function isRecognizedErgHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1"
    || normalized.endsWith(".erg.edu.local") || normalized.endsWith(".erg.edu.vn")
    || normalized.endsWith(".org.edu.local") || normalized.endsWith(".org.edu.vn");
}

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  accessDeniedRoute,
  onboardingRoute,
  adminProfileRoute,
  teacherProfileRoute,
  studentProfileRoute,
  legacyProfileRoute,
  questionTypesRoute,
  classesRedirectRoute,
  homeworkClassesRedirectRoute,
  teachingScheduleRedirectRoute,
  adminWorkspaceRoute,
  learningStandardsAdminRoute,
  legacyLearningStandardsRoute,
  enterpriseConnectorsAdminRoute,
  legacyEnterpriseConnectorsRoute,
  learningOutcomesAdminRoute,
  ...adminContentRoutes,
  teacherWorkspaceRoute,
  teacherPortableExamRoute,
  teacherDesktopReleaseRoute,
  learningOutcomesTeacherRoute,
  studentRedirectRoute,
  studentPortableExamRoute,
  studentDesktopReleaseRoute,
  learningOutcomesStudentRoute,
  ...lcmsRoutes,
  ...crmRoutes,
  ...lmsRoutes,
  ...legacyWorkspaceRoutes,
  catchAllRoute,
]);

export function createAppRouter() {
  const loadingPolicy = getAdaptiveLoadingPolicy();
  return createRouter({
    defaultErrorComponent: RouteErrorBoundary,
    defaultPendingComponent: RoutePendingSkeleton,
    defaultPreload: loadingPolicy.preloadRoutes ? "intent" : false,
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
        workspaces: [],
        hasWorkspace: () => false,
        hasPermission: () => false,
      },
    },
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}

export function AppRoutes() {
  return null;
}
