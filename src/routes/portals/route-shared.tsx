import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { createRootRouteWithContext } from "@tanstack/react-router";

import { shouldRedirectLocalPortal } from "@/config/portal-urls";
import { RootLayout } from "@/layouts/root-layout";
import { AuthenticatedAccountGate, PortalAuthGate } from "@/platform/auth/components/portal-route-gates";
import type { AuthRouteState } from "@/platform/auth/router/auth-route-context";
import { sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { resolveActivePortal } from "@/app/router/portal-host-resolution";
import { RoutePendingSkeleton } from "@/routes/route-feedback";

type AppRouterContext = {
  auth: AuthRouteState;
};

export const CrmPage = lazy(() =>
  import("@/app/pages/crm/crm-page").then((module) => ({
    default: module.CrmPage,
  })),
);
export const StudentPage = lazy(() => import("@/app/pages/student/student-page"));
export const LearningOutcomesPage = lazy(() => import("@/app/pages/shared/learning-outcomes-page"));
export const PortableExamPage = lazy(() =>
  import("@/app/pages/shared/portable-exam-page").then((module) => ({
    default: module.PortableExamPage,
  })),
);
export const DesktopReleasePage = lazy(() =>
  import("@/app/pages/shared/desktop-release-page").then((module) => ({
    default: module.DesktopReleasePage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/app/pages/shared/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
export const NotFoundPage = lazy(() =>
  import("@/app/pages/shared/not-found-page").then((module) => ({
    default: module.NotFoundPage,
  })),
);

export const rootRoute = createRootRouteWithContext<AppRouterContext>()({ component: RootLayout });

export function PortalHostRedirect({
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

export function LegacyAliasRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return <RoutePendingSkeleton />;
}

export function withPortalAuth(portal: "lcms" | "crm" | "lms" | "elearning", children: ReactNode, requiredPermission?: string) {
  return <PortalAuthGate portal={portal} requiredPermission={requiredPermission}>{children}</PortalAuthGate>;
}

export function stripPath(pathname: string) {
  return pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

// Declarative host checking component
export function PortalRoute({
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

export function ProfileRouteContent({ portal }: { portal: "lcms" | "crm" | "lms" | "elearning" }) {
  return withPortalAuth(
    portal,
    <AuthenticatedAccountGate>
      <Suspense fallback={<RoutePendingSkeleton />}>
        <ProfilePage />
      </Suspense>
    </AuthenticatedAccountGate>,
  );
}
