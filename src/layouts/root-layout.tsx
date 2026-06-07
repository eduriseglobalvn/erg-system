import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppSeo } from "@/components/seo/app-seo";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT } from "@/lib/api-client";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "@/routes/router-compat";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function redirectToLogin() {
      logoutAccount();
      logoutStudentSession();

      if (location.pathname === "/login") return;

      const currentPath = `${location.pathname}${location.search}${location.hash}`;
      const redirect = currentPath && currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
      navigate(`/login${redirect}`, { replace: true });
    }

    window.addEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);

    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);
    };
  }, [location.hash, location.pathname, location.search, navigate]);

  return (
    <TooltipProvider>
      <AppSeo />
      <Outlet />
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
