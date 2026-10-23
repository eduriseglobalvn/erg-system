import { type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

import { ERG_ASSETS } from "@/config/seo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AccountPanel } from "@/platform/auth/components/account-panel";
import { AuthFormPanel } from "@/platform/auth/components/auth-form-panel";
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

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void safely(auth.actions.register);
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
    <Box component="main" sx={{ backgroundImage: "url('https://media.erg.edu.vn/logo/bg.jpg')", backgroundPosition: "center", backgroundSize: "cover", bgcolor: "#dfeeff", color: "#1C252E", display: "grid", minHeight: "100vh", overflow: "hidden", px: { xs: 2, sm: 3, lg: 4 }, py: 2.5, position: "relative" }}>
      <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", inset: 0, pointerEvents: "none", position: "absolute" }} />

      <Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "flex-end", position: "relative", width: "100%", zIndex: 10 }}>
        <Box sx={{ backdropFilter: "blur(16px)", bgcolor: "rgba(255,255,255,0.45)", borderRadius: 1.5, boxShadow: "0 16px 34px rgba(57,78,124,0.1)", maxWidth: 260, width: "100%" }}><LocaleSwitcher /></Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", mx: "auto", maxWidth: 460, pb: { xs: 5, sm: 7 }, position: "relative", pt: 2, width: "100%", zIndex: 10 }}>
        {auth.notice ? (
          <Alert severity={auth.notice.tone === "success" ? "success" : auth.notice.tone === "error" ? "error" : "info"} sx={{ backdropFilter: "blur(16px)", boxShadow: "0 16px 34px rgba(57,78,124,0.1)", fontSize: 14, fontWeight: 700, mb: 2 }}>
            {auth.notice.message}
          </Alert>
        ) : null}

        <Paper component="section" elevation={0} sx={{ backdropFilter: "blur(24px)", bgcolor: "rgba(255,255,255,0.32)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 3, boxShadow: "0 30px 90px rgba(72,81,156,0.2)", p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{ display: "grid", justifyItems: "center", mb: 3.5, textAlign: "center" }}>
            <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ filter: "drop-shadow(0 12px 26px rgba(72,81,156,0.16))", height: "auto", objectFit: "contain", width: 112 }} />
          </Box>

          {!auth.account ? (
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
              onLoginSubmit={handleLoginSubmit}
              onRegisterSubmit={handleRegisterSubmit}
              onForgotPassword={auth.actions.forgotPassword}
              onProviderLogin={(provider, idToken) => void safely(() => auth.actions.loginByProvider(provider, idToken))}
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
        </Paper>
      </Box>
    </Box>
  );
}
