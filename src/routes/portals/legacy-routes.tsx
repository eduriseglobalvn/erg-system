import { Suspense } from "react";
import { createRoute, redirect } from "@tanstack/react-router";

import {
  ELEARNING_PORTAL_HOSTS,
  isPortalHost,
  LCMS_PORTAL_HOSTS,
  shouldRedirectLocalPortal,
} from "@/config/portal-urls";
import { lcmsWorkspacePaths, lmsPaths } from "@/app/portal-route-registry";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { buildPortalHostUrl } from "@/app/router/portal-host-url";
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
  NotFoundPage,
  ProfileRouteContent,
  rootRoute,
  stripPath,
} from "@/routes/portals/route-shared";

const legacyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: ({ context, location }) => {
    enforcePermissionRoute(context.auth, location, "account.self.read");
    const activePortal = resolveActivePortal();
    if (activePortal === "crm") return;
    throw redirect({
      href: activePortal === "lcms"
        ? adminPath("/profile")
        : activePortal === "elearning"
          ? studentPath("/profile")
          : teacherPath("/profile"),
      replace: true,
    });
  },
  component: () => <ProfileRouteContent portal="crm" />,
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

/** Old un-prefixed workspace URLs (/homework, /schools ...) go to their canonical workspace path, on the canonical host. */
function legacyWorkspaceBeforeLoad(segment: string) {
  const targetPath = canonicalLegacyWorkspacePath(segment);
  const suffix = `${window.location.search}${window.location.hash}`;
  if (isCanonicalLmsWorkspaceHost(window.location)) {
    throw redirect({ href: sanitizeLocalRedirect(`${targetPath}${suffix}`) ?? targetPath, replace: true });
  }
  const targetHost = canonicalLmsWorkspaceHostForRuntime();
  if (!shouldRedirectLocalPortal(targetHost)) return; // unknown host: render the 404 below
  throw redirect({ href: buildPortalHostUrl(targetHost, `${targetPath}${suffix}`, targetPath), reloadDocument: true });
}

const legacyWorkspaceRoutes = legacyWorkspaceSegments.map((segment) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/${segment}`,
    beforeLoad: () => legacyWorkspaceBeforeLoad(segment),
    component: NotFoundRoute,
  }),
);

const classesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/classes",
  beforeLoad: () => {
    if (isPortalHost(LCMS_PORTAL_HOSTS)) return; // admin host has no classes page: 404 below
    throw redirect({ href: isPortalHost(ELEARNING_PORTAL_HOSTS) ? "/student" : teacherPath("/homework"), replace: true });
  },
  component: NotFoundRoute,
});

const homeworkClassesRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/homework/classes",
  beforeLoad: () => {
    throw redirect({ href: teacherPath("/homework"), replace: true });
  },
});

const teachingScheduleRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teaching-schedule",
  beforeLoad: () => {
    throw redirect({ href: teacherPath("/calendar"), replace: true });
  },
});

function isRecognizedErgHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1"
    || normalized.endsWith(".erg.edu.local") || normalized.endsWith(".erg.edu.vn")
    || normalized.endsWith(".org.edu.local") || normalized.endsWith(".org.edu.vn");
}

function NotFoundRoute() {
  return (
    <Suspense fallback={<RoutePendingSkeleton />}>
      <NotFoundPage />
    </Suspense>
  );
}

/** Table-driven legacy aliases (resolveLegacyRouteRedirect); anything else falls through to the 404 page. */
export function catchAllBeforeLoad() {
  const path = stripPath(window.location.pathname);
  const legacyRedirect = resolveLegacyRouteRedirect(path, resolveActivePortal());
  if (!legacyRedirect || !isRecognizedErgHost(window.location.hostname)) return;
  recordLegacyAliasHit(path, legacyRedirect);
  const targetHost = legacyRedirect.target === "crm"
    ? canonicalCrmWorkspaceHostForRuntime()
    : canonicalLmsWorkspaceHostForRuntime();
  const suffix = `${window.location.search}${window.location.hash}`;
  const safePath = sanitizeLocalRedirect(`${legacyRedirect.path ?? "/"}${suffix}`) ?? legacyRedirect.path ?? "/";
  if (!shouldRedirectLocalPortal(targetHost)) {
    // A canonical workspace path that has no concrete route must not redirect to itself forever.
    if (safePath.split(/[?#]/, 1)[0] === `/${path}`) return;
    throw redirect({ href: safePath, replace: true });
  }
  throw redirect({
    href: buildPortalHostUrl(targetHost, `${legacyRedirect.path ?? "/"}${suffix}`, legacyRedirect.path),
    reloadDocument: true,
  });
}

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  beforeLoad: catchAllBeforeLoad,
  component: NotFoundRoute,
});

export const legacyRoutes = [
  legacyProfileRoute,
  classesRedirectRoute,
  homeworkClassesRedirectRoute,
  teachingScheduleRedirectRoute,
  ...legacyWorkspaceRoutes,
];
export { catchAllRoute };
