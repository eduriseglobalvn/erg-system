import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

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
import { AuthenticatedAccountGate, PortalAuthGate, PortalLoginPage } from "@/platform/auth/components/portal-auth-gates";
import { RootLayout } from "@/layouts/root-layout";

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
const AccountPage = lazy(() =>
  import("@/pages/account-page").then((module) => ({
    default: module.AccountPage,
  })),
);
const LoginLogsPage = lazy(() =>
  import("@/pages/login-logs-page").then((module) => ({
    default: module.LoginLogsPage,
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

export function AppRoutes() {
  const isLcmsPortal = isLcmsPortalHost();
  const isCrmPortal = isPortalHost(CRM_PORTAL_HOSTS);
  const isLmsPortal = isPortalHost(LMS_PORTAL_HOST);
  const isElearningPortal = isPortalHost(ELEARNING_PORTAL_HOSTS);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<RootLayout />}>
          {isLcmsPortal ? (
            <>
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="login" element={<PortalLoginPage portal="lcms" />} />
              <Route
                index
                element={
                  <PortalAuthGate portal="lcms">
                    <LcmsPage />
                  </PortalAuthGate>
                }
              />
              {[
                "schools",
                "students",
                "import",
                "users",
                "questions",
                "quiz-bank",
                "quiz-editor",
                "resources",
                "legal",
                "settings",
              ].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PortalAuthGate portal="lcms">
                      <LcmsPage />
                    </PortalAuthGate>
                  }
                />
              ))}
              <Route path="kho-hoc-lieu/*" element={<Navigate to="/resources" replace />} />
              <Route path="hoclieu/*" element={<Navigate to="/resources" replace />} />
            </>
          ) : isCrmPortal ? (
            <>
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="login" element={<PortalLoginPage portal="crm" />} />
              <Route
                index
                element={
                  <PortalAuthGate portal="crm">
                    <CrmPage />
                  </PortalAuthGate>
                }
              />
              {[
                "seo",
                "seo/schools",
                "seo/opportunities",
                "seo/pnl",
                "seo/follow-ups",
                "seo/handover",
              ].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PortalAuthGate portal="crm">
                      <CrmPage />
                    </PortalAuthGate>
                  }
                />
              ))}
              {["schools", "students", "import", "users", "questions", "quiz-bank", "quiz-editor", "resources", "legal", "settings"].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={<PortalHostRedirect targetHost={LCMS_PORTAL_HOST} preservePathAndSearch />}
                />
              ))}
            </>
          ) : isLmsPortal ? (
            <>
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="login" element={<PortalLoginPage portal="lms" />} />
              <Route
                index
                element={
                  <PortalAuthGate portal="lms">
                    <DashboardPage />
                  </PortalAuthGate>
                }
              />
              {["homework", "score", "attendance", "calendar", "class-log", "students", "resources", "reports"].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PortalAuthGate portal="lms">
                      <DashboardPage />
                    </PortalAuthGate>
                  }
                />
              ))}
              <Route path="teaching-schedule" element={<Navigate to="/calendar" replace />} />
              <Route
                path="profile"
                element={
                  <AuthenticatedAccountGate>
                    <ProfilePage />
                  </AuthenticatedAccountGate>
                }
              />
              <Route
                path="account"
                element={
                  <PortalAuthGate portal="lms">
                    <AccountPage />
                  </PortalAuthGate>
                }
              />
              <Route
                path="account/login-logs"
                element={
                  <PortalAuthGate portal="lms">
                    <LoginLogsPage />
                  </PortalAuthGate>
                }
              />
              <Route path="student" element={<PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />} />
              <Route path="dashboard" element={<Navigate to="/homework" replace />} />
              <Route path="kho-hoc-lieu/*" element={<Navigate to="/resources" replace />} />
              <Route path="hoclieu/*" element={<Navigate to="/resources" replace />} />
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
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/student" element={<PortalHostRedirect targetHost={ELEARNING_PORTAL_HOST} />} />
              <Route path="/admin" element={<PortalHostRedirect targetHost={CRM_PORTAL_HOST} />} />
              <Route path="/crm" element={<PortalHostRedirect targetHost={CRM_PORTAL_HOST} />} />
              <Route path="/dashboard" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} />} />
              <Route path="/cong-khai" element={<PublicDisclosurePage />} />
              <Route path="/cong-khai/viewer/:documentId" element={<PublicDisclosurePage />} />
              <Route path="/public-disclosure" element={<PublicDisclosureAdminPage />} />
              <Route path="/question-types" element={<QuestionTypeDemoPage />} />
              <Route path="/kho-hoc-lieu/*" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />} />
              <Route path="/chuong-trinh/*" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />} />
              <Route path="/cong-dong" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />} />
              <Route path="/portfolio" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />} />
              <Route path="/quizzes" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />} />
              <Route path="/hoclieu/*" element={<PortalHostRedirect targetHost={LMS_PORTAL_HOST} targetPath="/resources" />} />
            </>
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
