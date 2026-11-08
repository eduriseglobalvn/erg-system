import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import { ErgToaster } from "@/components/erg-mui/erg-toaster";
import { AppSeo } from "@/components/seo/app-seo";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { useIdleSignOut } from "@/platform/auth/hooks/use-idle-sign-out";
import {
  ACCOUNT_DISABLED_EVENT,
  AUTHORIZATION_CHANGED_EVENT,
  AUTH_SESSION_INVALID_EVENT,
  AUTH_SESSION_REPLACED_EVENT,
} from "@/lib/api-client";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  CRM_PORTAL_HOSTS,
  ELEARNING_PORTAL_HOSTS,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOSTS,
  isPortalHost,
} from "@/config/portal-urls";
import ErgMuiProvider from "@/themes/ErgMuiProvider";
import { buildRedirectPath } from "@/platform/auth/utils/auth-redirects";
import { desktopWorkspaceFromPath, getDesktopRuntime, isDesktopWorkspace } from "@/platform/desktop";

const DesktopUpdateBanner = lazy(() =>
  import("@/features/desktop-release/components/desktop-update-banner").then((module) => ({
    default: module.DesktopUpdateBanner,
  })),
);

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine portal type from host for auth/theme compatibility.
  const portal = useMemo(() => {
    if (typeof window === 'undefined') return 'default';
    if (isPortalHost(LMS_PORTAL_HOSTS)) return 'lms' as const;
    if (isPortalHost(LCMS_PORTAL_HOSTS)) return 'lcms' as const;
    if (isPortalHost(CRM_PORTAL_HOSTS)) return 'crm' as const;
    if (isPortalHost(ELEARNING_PORTAL_HOSTS)) return 'elearning' as const;
    return 'default' as const;
  }, []);

  const redirectToLoginRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    function redirectToLogin() {
      logoutAccount();
      logoutStudentSession();

      if (window.location.pathname === "/login") return;

      const currentPath = buildRedirectPath(window.location.pathname, window.location.search, window.location.hash);
      const redirect = currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
      void navigate({ href: `/login${redirect}`, replace: true });
    }

    redirectToLoginRef.current = redirectToLogin;
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);
    window.addEventListener(ACCOUNT_DISABLED_EVENT, redirectToLogin);
    window.addEventListener(AUTHORIZATION_CHANGED_EVENT, redirectToLogin);

    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);
      window.removeEventListener(ACCOUNT_DISABLED_EVENT, redirectToLogin);
      window.removeEventListener(AUTHORIZATION_CHANGED_EVENT, redirectToLogin);
    };
  }, [navigate]);

  const signOutIdle = useCallback(() => redirectToLoginRef.current(), []);
  useIdleSignOut(signOutIdle);

  return (
    <ErgMuiProvider portal={portal}>
      <AppSeo />
      <Outlet />
      <DesktopUpdateSurface pathname={location.pathname} />
      <ErgToaster richColors position="top-right" />
    </ErgMuiProvider>
  );
}

function DesktopUpdateSurface({ pathname }: { pathname: string }) {
  const workspace = desktopWorkspaceFromPath(pathname);
  const visible = getDesktopRuntime() === "tauri" && Boolean(workspace && isDesktopWorkspace(workspace)) && !pathname.includes("/exams/");
  if (!visible) return null;
  return (
    <Box sx={{ position: "fixed", left: { xs: 12, md: 24 }, right: { xs: 12, md: 24 }, bottom: { xs: 12, md: 24 }, zIndex: (theme) => theme.zIndex.snackbar }}>
      <Suspense fallback={null}>
        <DesktopUpdateBanner />
      </Suspense>
    </Box>
  );
}
