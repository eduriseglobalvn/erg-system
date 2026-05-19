import { type FormEvent } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { AccountPanel } from "@/features/auth/components/account-panel";
import { AuthFormPanel } from "@/features/auth/components/auth-form-panel";
import { AuthHeroPanel } from "@/features/auth/components/auth-hero-panel";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { useI18n } from "@/features/i18n";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(47,70,210,0.14),transparent_26%),linear-gradient(180deg,#f8f9fc,#eef2ff)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher className="w-full max-w-[280px]" />
        </div>

        {auth.notice ? (
          <div
            className={cn(
              "mb-4 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm",
              auth.notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : auth.notice.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-blue-200 bg-blue-50 text-blue-700",
            )}
          >
            {auth.notice.message}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)]">
          <div className="grid min-h-[780px] lg:grid-cols-[1.08fr_1fr]">
            <AuthHeroPanel />
            <div className="bg-white p-5 sm:p-7 lg:p-8">
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
