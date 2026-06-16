import { type FormEvent } from "react";

import { ERG_ASSETS } from "@/config/seo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AccountPanel } from "@/platform/auth/components/account-panel";
import { AuthFormPanel } from "@/platform/auth/components/auth-form-panel";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/utils/cn";

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
    <main
      className="relative grid min-h-screen overflow-hidden bg-[#dfeeff] bg-cover bg-center px-4 py-5 text-[#1C252E] sm:px-6 lg:px-8"
      style={{ backgroundImage: "url('https://media.erg.edu.vn/logo/bg.jpg')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/10" />

      <div className="relative z-10 flex w-full items-start justify-end">
        <LocaleSwitcher className="w-full max-w-[260px] rounded-xl border-white/50 bg-white/45 shadow-[0_16px_34px_rgba(57,78,124,0.10)] backdrop-blur-xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-col justify-center pb-10 pt-4 sm:pb-14">
        {auth.notice ? (
          <div
            className={cn(
              "mb-4 rounded-xl border px-4 py-3 text-sm font-semibold shadow-[0_16px_34px_rgba(57,78,124,0.10)] backdrop-blur-xl",
              auth.notice.tone === "success"
                ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-700"
                : auth.notice.tone === "error"
                  ? "border-rose-200/80 bg-rose-50/70 text-rose-700"
                  : "border-cyan-200/80 bg-cyan-50/70 text-cyan-800",
            )}
          >
            {auth.notice.message}
          </div>
        ) : null}

        <section className="rounded-[24px] border border-white/55 bg-white/32 p-5 shadow-[0_30px_90px_rgba(72,81,156,0.20)] backdrop-blur-2xl sm:p-7">
          <div className="mb-7 grid justify-items-center text-center">
            <img alt="ERG" className="h-auto w-28 object-contain drop-shadow-[0_12px_26px_rgba(72,81,156,0.16)]" src={ERG_ASSETS.logo} />
          </div>

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
        </section>
      </div>
    </main>
  );
}
