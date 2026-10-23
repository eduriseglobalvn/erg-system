import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "@tanstack/react-router";

import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import { AuthFormPanel } from "@/platform/auth/components/auth-form-panel";
import {
  accessDeniedPath,
  defaultPortalRedirect,
  googleEmailFromIdToken,
  handleLoginSubmit,
  handleRegisterSubmit,
  handleStudentLoginSubmit,
  redirectAfterAuth,
  resolveDefaultPostLoginRedirect,
  safely,
  sanitizeRedirect,
} from "@/platform/auth/components/portal-login-controller";
import { getPortalLoginCopy, type PortalKey } from "@/platform/auth/components/portal-login-copy";
import { NoticeBanner, PortalLoginShell } from "@/platform/auth/components/portal-login-presentation";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { isAuthOnlyRedirect, sanitizeLocalRedirect } from "@/platform/auth/utils/auth-redirects";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const [studentNotice, setStudentNotice] = useState<AuthSession["notice"] | null>(null);
  const requestedRedirect = new URLSearchParams(location.searchStr).get("redirect");
  const hasExplicitRedirect = Boolean(requestedRedirect && sanitizeLocalRedirect(requestedRedirect));
  const redirect = sanitizeRedirect(
    requestedRedirect,
    resolveDefaultPostLoginRedirect(auth.account, portal, auth.session ?? readStoredAuthSession(portal)) || defaultPortalRedirect(portal),
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
      ? readStoredAuthSession("lms") ?? readStoredAuthSession("lcms") ?? readStoredAuthSession(portal)
      : readStoredAuthSession(portal);
  const navigateTo = (path: string) => {
    // Let the auth/account storage event render once before TanStack Router
    // evaluates the destination's workspace guard. This matters for a direct
    // post-login deep link such as /student; otherwise the guard can see the
    // pre-login route context for one navigation tick.
    window.setTimeout(() => void navigate({ href: path, replace: true }), 0);
  };

  if (canAccessPortal({ portal, studentSession, teacherAccount, teacherSession })) {
    return <Navigate replace to={redirect} />;
  }
  if (portal !== "elearning" && auth.account && isAuthOnlyRedirect(portal, redirect)) {
    return <Navigate replace to={redirect} />;
  }
  if (portal !== "elearning" && auth.account) {
    return <Navigate replace to={accessDeniedPath(portal, auth.account.email, redirect)} />;
  }

  return (
    <PortalLoginShell copy={resolvedCopy}>
      <NoticeBanner notice={portal === "elearning" ? studentNotice : auth.notice} />
      <AuthFormPanel
        mode={auth.mode}
        rememberMe={auth.rememberMe}
        showPassword={auth.showPassword}
        loginForm={auth.loginForm}
        registerForm={auth.registerForm}
        onModeChange={auth.setMode}
        onRememberMeChange={auth.setRememberMe}
        onShowPasswordToggle={() => auth.setShowPassword((current) => !current)}
        onLoginFormChange={auth.setLoginForm}
        onRegisterFormChange={auth.setRegisterForm}
        onLoginSubmit={(event) =>
          portal === "elearning"
            ? handleStudentLoginSubmit(event, auth, redirect, navigateTo, setStudentNotice)
            : handleLoginSubmit(event, auth, portal, redirect, navigateTo, { hasExplicitRedirect })
        }
        onRegisterSubmit={(event) => handleRegisterSubmit(event, auth, portal, redirect, navigateTo, { hasExplicitRedirect })}
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
        onProviderLogin={(provider, idToken) =>
          void safely(
              auth,
            async () => {
              const account = await auth.actions.loginByProvider(provider, idToken, portal);
              redirectAfterAuth(account ?? getCurrentAccount(portal), portal, redirect, navigateTo, { hasExplicitRedirect });
            },
            () => navigateTo(accessDeniedPath(portal, googleEmailFromIdToken(idToken) || auth.loginForm.email, redirect)),
          )
        }
        allowGoogle={resolvedCopy.allowGoogle}
        allowRegister={resolvedCopy.allowRegister}
        credentialLabel={resolvedCopy.credentialLabel}
        credentialPlaceholder={resolvedCopy.credentialPlaceholder}
        loginFootnote={resolvedCopy.formFootnote}
        loginSubtitle={resolvedCopy.formSubtitle}
        loginTitle={resolvedCopy.formTitle}
        mobileVariant={isMobile}
      />
    </PortalLoginShell>
  );
}
