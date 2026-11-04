import { Suspense } from "react";
import { createRoute, Navigate } from "@tanstack/react-router";

import {
  ELEARNING_PORTAL_HOSTS,
  isPortalHost,
  LCMS_PORTAL_HOSTS,
  shouldRedirectLocalPortal,
} from "@/config/portal-urls";
import { lcmsWorkspacePaths, lmsPaths } from "@/app/portal-route-registry";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { enforcePermissionRoute } from "@/app/router/route-guards";
import { recordLegacyAliasHit, resolveLegacyRouteRedirect } from "@/app/router/legacy-route-redirects";
import { canonicalAdminWorkspacePath } from "@/features/lcms/admin-content/admin-content-route";
import { adminPath, studentPath, teacherPath } from "@/platform/workspaces/workspace-paths";
import {
  canonicalLmsWorkspaceHostForRuntime,
  canonicalCrmWorkspaceHostForRuntime,
  isCanonicalLmsWorkspaceHost,
} from "@/platform/workspaces/workspace-route";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { RoutePendingSkeleton } from "@/routes/route-feedback";
import {
  LegacyAliasRedirect,
  NotFoundPage,
  PortalHostRedirect,
  ProfileRouteContent,
  rootRoute,
  stripPath,
} from "@/routes/portals/route-shared";

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

function isRecognizedErgHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1"
    || normalized.endsWith(".erg.edu.local") || normalized.endsWith(".erg.edu.vn")
    || normalized.endsWith(".org.edu.local") || normalized.endsWith(".org.edu.vn");
}

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

export const legacyRoutes = [
  legacyProfileRoute,
  classesRedirectRoute,
  homeworkClassesRedirectRoute,
  teachingScheduleRedirectRoute,
  ...legacyWorkspaceRoutes,
];
export { catchAllRoute };
