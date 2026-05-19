import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import {
  ELEARNING_PORTAL_HOST,
  ELEARNING_PORTAL_HOSTS,
  HOCLIEU_PORTAL_HOST,
  HOCLIEU_PORTAL_HOSTS,
  isPortalHost,
  LMS_PORTAL_HOST,
  shouldRedirectLocalPortal,
} from "@/config/portal-urls";
import { AuthenticatedAccountGate, PortalAuthGate, PortalLoginPage } from "@/features/auth/components/portal-auth-gates";
import { RootLayout } from "@/layouts/root-layout";

const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/pages/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
const HomePage = lazy(() =>
  import("@/pages/home-page").then((module) => ({
    default: module.HomePage,
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
const HocLieuLayout = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuLayout,
  })),
);
const HocLieuHomePage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuHomePage,
  })),
);
const HocLieuProgramsPage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuProgramsPage,
  })),
);
const HocLieuProgramDetailPage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuProgramDetailPage,
  })),
);
const HocLieuLibraryPage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuLibraryPage,
  })),
);
const HocLieuCommunityPage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuCommunityPage,
  })),
);
const HocLieuPortfolioPage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuPortfolioPage,
  })),
);
const HocLieuQuizzesPage = lazy(() =>
  import("@/features/hoclieu").then((module) => ({
    default: module.HocLieuQuizzesPage,
  })),
);
const AccessDeniedPage = lazy(() =>
  import("@/features/auth").then((module) => ({
    default: module.AccessDeniedPage,
  })),
);
const SsoHandoffPage = lazy(() =>
  import("@/features/auth/components/sso-handoff-page").then((module) => ({
    default: module.SsoHandoffPage,
  })),
);

function isHocLieuPortalHost() {
  return isPortalHost(HOCLIEU_PORTAL_HOSTS);
}

function HocLieuRouteGroup({ includeIndex = false }: { includeIndex?: boolean } = {}) {
  return (
    <>
      <Route path="login" element={<PortalLoginPage portal="hoclieu" />} />
      <Route element={<HocLieuLayout />}>
        {includeIndex ? <Route index element={<HocLieuHomePage />} /> : null}
        <Route path="hoclieu" element={<Navigate to="/" replace />} />
        <Route
          path="profile"
          element={
            <AuthenticatedAccountGate>
              <ProfilePage />
            </AuthenticatedAccountGate>
          }
        />
        <Route path="chuong-trinh" element={<HocLieuProgramsPage />} />
        <Route path="chuong-trinh/:slug" element={<HocLieuProgramDetailPage />} />
        <Route
          path="kho-hoc-lieu"
          element={
            <PortalAuthGate portal="hoclieu">
              <HocLieuLibraryPage />
            </PortalAuthGate>
          }
        />
        <Route
          path="kho-hoc-lieu/:gradeId"
          element={
            <PortalAuthGate portal="hoclieu">
              <HocLieuLibraryPage />
            </PortalAuthGate>
          }
        />
        <Route path="cong-dong" element={<HocLieuCommunityPage />} />
        <Route path="portfolio" element={<HocLieuPortfolioPage />} />
        <Route path="quizzes" element={<HocLieuQuizzesPage />} />
      </Route>
    </>
  );
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

export function AppRoutes() {
  const isHocLieuPortal = isHocLieuPortalHost();
  const isLmsPortal = isPortalHost(LMS_PORTAL_HOST);
  const isElearningPortal = isPortalHost(ELEARNING_PORTAL_HOSTS);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<RootLayout />}>
          {isHocLieuPortal ? (
            <>
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="sso-handoff" element={<SsoHandoffPage />} />
              {HocLieuRouteGroup({ includeIndex: true })}
            </>
          ) : isLmsPortal ? (
            <>
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="login" element={<PortalLoginPage portal="lms" />} />
              <Route path="sso-handoff" element={<SsoHandoffPage />} />
              <Route
                index
                element={
                  <PortalAuthGate portal="lms">
                    <DashboardPage />
                  </PortalAuthGate>
                }
              />
              <Route
                path="profile"
                element={
                  <AuthenticatedAccountGate>
                    <ProfilePage />
                  </AuthenticatedAccountGate>
                }
              />
              <Route path="student" element={<PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
            </>
          ) : isElearningPortal ? (
            <>
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="login" element={<PortalLoginPage portal="elearning" />} />
              <Route
                index
                element={
                  <PortalAuthGate portal="elearning">
                    <StudentPage />
                  </PortalAuthGate>
                }
              />
              <Route path="student" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/student" element={<PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />} />
              <Route path="/dashboard" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} />} />
              <Route path="/cong-khai" element={<PublicDisclosurePage />} />
              <Route path="/cong-khai/viewer/:documentId" element={<PublicDisclosurePage />} />
              <Route path="/public-disclosure" element={<PublicDisclosureAdminPage />} />
              <Route path="/question-types" element={<QuestionTypeDemoPage />} />
              <Route path="/kho-hoc-lieu/*" element={<PortalHostRedirect targetHost={HOCLIEU_PORTAL_HOST} preservePathAndSearch />} />
              <Route path="/chuong-trinh/*" element={<PortalHostRedirect targetHost={HOCLIEU_PORTAL_HOST} preservePathAndSearch />} />
              <Route path="/cong-dong" element={<PortalHostRedirect targetHost={HOCLIEU_PORTAL_HOST} preservePathAndSearch />} />
              <Route path="/portfolio" element={<PortalHostRedirect targetHost={HOCLIEU_PORTAL_HOST} preservePathAndSearch />} />
              <Route path="/quizzes" element={<PortalHostRedirect targetHost={HOCLIEU_PORTAL_HOST} preservePathAndSearch />} />
              <Route path="/hoclieu" element={<PortalHostRedirect targetHost={HOCLIEU_PORTAL_HOST} targetPath="/" />} />
              {HocLieuRouteGroup()}
            </>
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
