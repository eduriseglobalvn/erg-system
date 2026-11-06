import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { getAuthScope, getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import { AuthFormPanel } from "@/platform/auth/components/auth-form-panel";
import {
  accessDeniedPath,
  defaultPortalRedirect,
  handleLoginSubmit,
  handleStudentLoginSubmit,
  resolveDefaultPostLoginRedirect,
  sanitizeRedirect,
} from "@/platform/auth/components/portal-login-controller";
import { getPortalLoginCopy, type PortalKey } from "@/platform/auth/components/portal-login-copy";
import { NoticeBanner, PortalLoginShell } from "@/platform/auth/components/portal-login-presentation";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { isAuthOnlyRedirect, sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { isBffAuthEnabled } from "@/lib/api-client";

type AuthSession = ReturnType<typeof useAuthSession>;

type PortalLoginPageProps = {
  portal: PortalKey;
  badge?: string;
  title?: string;
  description?: string;
};

export function PortalLoginPage({ badge, description, portal, title }: PortalLoginPageProps) {
  const auth = useAuthSession(portal);
  const location = useLocation();
  const navigate = useNavigate();
  const [studentNotice, setStudentNotice] = useState<AuthSession["notice"] | null>(null);
  const requestedRedirect = new URLSearchParams(location.searchStr).get("redirect");
  const hasExplicitRedirect = Boolean(requestedRedirect && sanitizeLocalRedirect(requestedRedirect));
  const redirect = sanitizeRedirect(
    requestedRedirect,
    resolveDefaultPostLoginRedirect(auth.account, portal, auth.session ?? getAuthScope(portal).session) || defaultPortalRedirect(portal),
  );
  const copy = getPortalLoginCopy(portal);
  const resolvedCopy = {
    ...copy,
    badge: badge ?? copy.badge,
    title: title ?? copy.title,
    description: description ?? copy.description,
  };
  const studentSession = getCurrentStudentSession();
  const teacherAccount = isBffAuthEnabled()
    ? auth.account
    : portal === "elearning"
      ? getCurrentAccount("lms") ?? getCurrentAccount("lcms")
      : auth.account;
  const teacherSession = isBffAuthEnabled()
    ? auth.session
    : portal === "elearning"
      ? getAuthScope("lms").session ?? getAuthScope("lcms").session ?? getAuthScope(portal).session
      : getAuthScope(portal).session;
  const navigateTo = (path: string) => {
    // Let the auth/account storage event render once before TanStack Router
    // evaluates the destination's workspace guard. This matters for a direct
    // post-login deep link such as /student; otherwise the guard can see the
    // pre-login route context for one navigation tick.
    window.setTimeout(() => void navigate({ href: path, replace: true }), 0);
  };

  const redirectTarget = canAccessPortal({ portal, studentSession, teacherAccount, teacherSession })
    ? redirect
    : portal !== "elearning" && auth.account
      ? isAuthOnlyRedirect(portal, redirect) ? redirect : accessDeniedPath(portal, auth.account.email, redirect)
      : null;

  // A string dependency navigates once per target. <Navigate> re-fires on every render while the
  // lazy destination is pending, which loops into "Maximum update depth exceeded".
  useEffect(() => {
    if (redirectTarget) void navigate({ href: redirectTarget, replace: true });
  }, [navigate, redirectTarget]);

  if (redirectTarget) return null;

  return (
    <PortalLoginShell>
      <NoticeBanner notice={portal === "elearning" ? studentNotice : auth.notice} />
      <AuthFormPanel
        rememberMe={auth.rememberMe}
        showPassword={auth.showPassword}
        loginForm={auth.loginForm}
        onRememberMeChange={auth.setRememberMe}
        onShowPasswordToggle={() => auth.setShowPassword((current) => !current)}
        onLoginFormChange={auth.setLoginForm}
        onLoginSubmit={(event) =>
          portal === "elearning"
            ? handleStudentLoginSubmit(event, auth, redirect, navigateTo, setStudentNotice)
            : handleLoginSubmit(event, auth, portal, redirect, navigateTo, { hasExplicitRedirect })
        }
        onForgotPassword={() => {
          if (portal === "elearning") {
            setStudentNotice({
              tone: "info",
              message:
                "Tài khoản học sinh chỉ được cấp bởi nhà trường hoặc ERG. Nếu quên mật khẩu, vui lòng liên hệ giáo viên phụ trách.",
            });
            return;
          }
          auth.actions.forgotPassword();
        }}
        loginTitle={resolvedCopy.formTitle}
      />
    </PortalLoginShell>
  );
}
