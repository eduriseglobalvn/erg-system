import { type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { AccountPanel } from "@/platform/auth/components/account-panel";
import { AuthFormPanel } from "@/platform/auth/components/auth-form-panel";
import { AuthCard, AuthPageBackdrop } from "@/platform/auth/components/auth-page-layout";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { useI18n } from "@/platform/i18n";

export function AuthWorkspace() {
  const { t } = useI18n();
  const auth = useAuthSession();

  async function safely(run: () => unknown | Promise<unknown>) {
    try {
      await run();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : t("auth.errorGeneric"),
      });
    }
  }

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void safely(auth.actions.login);
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void safely(auth.actions.saveProfile);
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void safely(auth.actions.savePassword);
  }

  return (
    <AuthPageBackdrop>
      <Box sx={{ alignSelf: "center", justifySelf: "center", maxWidth: 440, width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Box sx={{ maxWidth: 260, width: "100%" }}><LocaleSwitcher /></Box>
        </Box>

        {auth.notice ? (
          <Alert role={auth.notice.tone === "error" ? "alert" : "status"} severity={auth.notice.tone === "success" ? "success" : auth.notice.tone === "error" ? "error" : "info"} sx={{ mb: 2 }}>
            {auth.notice.message}
          </Alert>
        ) : null}

        <AuthCard>
          {!auth.account ? (
            <AuthFormPanel
              rememberMe={auth.rememberMe}
              showPassword={auth.showPassword}
              loginForm={auth.loginForm}
              onRememberMeChange={auth.setRememberMe}
              onShowPasswordToggle={() => auth.setShowPassword((current) => !current)}
              onLoginFormChange={auth.setLoginForm}
              onLoginSubmit={handleLoginSubmit}
              onForgotPassword={auth.actions.forgotPassword}
            />
          ) : (
            <AccountPanel
              account={auth.account}
              accountTab={auth.accountTab}
              profileForm={auth.profileForm}
              passwordForm={auth.passwordForm}
              capabilities={auth.accountCapabilities}
              onAccountTabChange={auth.setAccountTab}
              onProfileFormChange={auth.setProfileForm}
              onPasswordFormChange={auth.setPasswordForm}
              onProfileSubmit={handleProfileSubmit}
              onPasswordSubmit={handlePasswordSubmit}
              onLogout={auth.actions.signOut}
            />
          )}
        </AuthCard>
      </Box>
    </AuthPageBackdrop>
  );
}
