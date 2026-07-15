import { Toaster } from "@/components/ui/sonner";
import { AppSeo } from "@/components/seo/app-seo";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT } from "@/lib/api-client";
import { useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "@/routes/router-compat";
import {
  CRM_PORTAL_HOSTS,
  ELEARNING_PORTAL_HOSTS,
  LCMS_PORTAL_HOSTS,
  LMS_PORTAL_HOSTS,
  isPortalHost,
} from "@/config/portal-urls";
import ErgMuiProvider from "@/themes/ErgMuiProvider";

export function RootLayout() {
  const navigate = useNavigate();

  // Determine portal type from host for auth/theme compatibility.
  const portal = useMemo(() => {
    if (typeof window === 'undefined') return 'default';
    if (isPortalHost(LMS_PORTAL_HOSTS)) return 'lms' as const;
    if (isPortalHost(LCMS_PORTAL_HOSTS)) return 'lcms' as const;
    if (isPortalHost(CRM_PORTAL_HOSTS)) return 'crm' as const;
    if (isPortalHost(ELEARNING_PORTAL_HOSTS)) return 'elearning' as const;
    return 'default' as const;
  }, []);

  useEffect(() => {
    function redirectToLogin() {
      logoutAccount();
      logoutStudentSession();

      if (window.location.pathname === "/login") return;

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const redirect = currentPath && currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
      navigate(`/login${redirect}`, { replace: true });
    }

    window.addEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);

    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);
    };
  }, [navigate]);

  return (
    <ErgMuiProvider portal={portal}>
      <AppSeo />
      <Outlet />
      <Toaster richColors position="top-right" />
    </ErgMuiProvider>
  );
}
