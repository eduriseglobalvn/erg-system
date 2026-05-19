import { useRef, type FormEvent, type KeyboardEvent } from "react";

import { EyeIcon } from "@/features/auth/components/auth-icons";
import {
  DividerText,
  Field,
  inputClassName,
  submitButtonClassName,
} from "@/features/auth/components/auth-shared";
import { PortalMobileLoginForm } from "@/features/auth/components/portal-mobile-login-form";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import type {
  AuthMode,
  LoginFormState,
  RegisterFormState,
} from "@/features/auth/types/auth-types";
import { useI18n } from "@/features/i18n";
import { cn } from "@/utils/cn";

export function AuthFormPanel({
  mode,
  rememberMe,
  showPassword,
  loginForm,
  registerForm,
  onModeChange,
  onRememberMeChange,
  onShowPasswordToggle,
  onLoginFormChange,
  onRegisterFormChange,
  onLoginSubmit,
  onRegisterSubmit,
  onForgotPassword,
  onProviderLogin,
  allowGoogle = true,
  allowRegister = true,
  loginTitle,
  loginSubtitle,
  loginFootnote,
  credentialLabel,
  credentialPlaceholder,
  mobileVariant = false,
}: {
  mode: AuthMode;
  rememberMe: boolean;
  showPassword: boolean;
  loginForm: LoginFormState;
  registerForm: RegisterFormState;
  onModeChange: (mode: AuthMode) => void;
  onRememberMeChange: (rememberMe: boolean) => void;
  onShowPasswordToggle: () => void;
  onLoginFormChange: (value: LoginFormState) => void;
  onRegisterFormChange: (value: RegisterFormState) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRegisterSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onProviderLogin: (provider: "google", idToken?: string) => void;
  allowGoogle?: boolean;
  allowRegister?: boolean;
  loginTitle?: string;
  loginSubtitle?: string;
  loginFootnote?: string;
  credentialLabel?: string;
  credentialPlaceholder?: string;
  mobileVariant?: boolean;
}) {
  const { t } = useI18n();
  const effectiveMode = allowRegister ? mode : "login";
  const hasSocialLogin = allowGoogle;
  const passwordInputRef = useRef<HTMLInputElement>(null);

  if (mobileVariant) {
    return (
      <PortalMobileLoginForm
        allowGoogle={allowGoogle}
        allowRegister={allowRegister}
        credentialLabel={credentialLabel}
        credentialPlaceholder={credentialPlaceholder}
        loginFootnote={loginFootnote}
        loginForm={loginForm}
        loginSubtitle={loginSubtitle}
        loginTitle={loginTitle}
        mode={mode}
        onForgotPassword={onForgotPassword}
        onLoginFormChange={onLoginFormChange}
        onLoginSubmit={onLoginSubmit}
        onModeChange={onModeChange}
        onProviderLogin={onProviderLogin}
        onRegisterFormChange={onRegisterFormChange}
        onRegisterSubmit={onRegisterSubmit}
        onRememberMeChange={onRememberMeChange}
        onShowPasswordToggle={onShowPasswordToggle}
        registerForm={registerForm}
        rememberMe={rememberMe}
        showPassword={showPassword}
      />
    );
  }

  function focusPasswordFromEmail(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key !== "Tab" || event.shiftKey) && event.key !== "Enter") return;

    event.preventDefault();
    passwordInputRef.current?.focus();
  }

  const titleStyle = mobileVariant
    ? ({ color: "#020617", fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.12 } as const)
    : undefined;
  const subtitleStyle = mobileVariant
    ? ({ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginTop: 10, maxWidth: 320 } as const)
    : undefined;
  const formCardStyle = mobileVariant
    ? ({
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        boxShadow: "0 24px 52px -42px rgba(15,23,42,0.24)",
        marginTop: allowRegister ? 14 : 0,
        padding: "22px 18px",
      } as const)
    : undefined;
  const inputStyle = mobileVariant
    ? ({
        backgroundColor: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: 14,
        color: "#0f172a",
        fontSize: 16,
        height: 52,
        padding: "0 16px",
        width: "100%",
      } as const)
    : undefined;
  const passwordInputStyle = mobileVariant
    ? ({
        backgroundColor: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: 14,
        color: "#0f172a",
        fontSize: 16,
        height: 52,
        padding: "0 48px 0 16px",
        width: "100%",
      } as const)
    : undefined;
  const submitStyle = mobileVariant
    ? ({
        backgroundColor: "var(--erg-blue)",
        borderRadius: 16,
        color: "#fff",
        display: "inline-flex",
        fontSize: 16,
        fontWeight: 700,
        height: 52,
        justifyContent: "center",
        width: "100%",
      } as const)
    : undefined;
  const footnoteStyle = mobileVariant
    ? ({
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        color: "#475569",
        fontSize: 14,
        lineHeight: 1.7,
        marginTop: 18,
        padding: "14px 16px",
      } as const)
    : undefined;

  return (
    <div className="w-full" style={{ width: "100%" }}>
      {allowRegister ? (
      <div className="rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur" style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(255,255,255,0.88)", border: "1px solid #e2e8f0", borderRadius: 16, padding: 4 }}>
        <div className="grid grid-cols-2 gap-1" style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {[
            { id: "login" as const, label: t("auth.login") },
            { id: "register" as const, label: t("auth.register") },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={cn(
                "h-11 rounded-xl px-4 text-sm font-bold transition",
                mode === item.id
                  ? "bg-[var(--erg-blue)] text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-[var(--erg-blue)]",
              )}
              style={{ borderRadius: 12, fontSize: 14, fontWeight: 700, height: 44, padding: "0 16px" }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      ) : null}

      <div className={cn("rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.55)] sm:px-7", allowRegister ? "mt-4" : "mt-0")} style={formCardStyle}>
        {effectiveMode === "login" ? (
          <>
            <div className="text-left" style={{ textAlign: "left" }}>
              <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl" style={titleStyle}>
                {loginTitle ?? t("auth.loginTeacherHub")}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500" style={subtitleStyle}>
                {loginSubtitle ?? t("auth.loginSubtitle")}
              </p>
            </div>

            {hasSocialLogin ? (
            <>
            <div className="mt-6 space-y-3">
              {allowGoogle ? (
              <GoogleSignInButton
                label={t("auth.loginWithGoogle")}
                onCredential={(idToken) => onProviderLogin("google", idToken)}
                onError={(message) => {
                  console.warn(message);
                }}
              />
              ) : null}
            </div>

            <DividerText text={t("auth.orContinueWith")} />
            </>
            ) : null}

            <form className="mt-5 space-y-4" style={{ marginTop: 20 }} onSubmit={onLoginSubmit}>
              <Field label={credentialLabel ?? t("auth.email")}>
                <input
                  className={inputClassName}
                  style={inputStyle}
                  value={loginForm.email}
                  onChange={(event) =>
                    onLoginFormChange({
                      ...loginForm,
                      email: event.target.value,
                    })
                  }
                  placeholder={credentialPlaceholder ?? t("auth.placeholderWorkEmail")}
                  type="text"
                  autoComplete="username"
                  onKeyDown={focusPasswordFromEmail}
                />
              </Field>

              <Field
                label={t("auth.password")}
                action={
                  <button
                    type="button"
                    className="font-semibold text-[var(--erg-blue)] hover:text-blue-800"
                    onClick={onForgotPassword}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                }
              >
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    className={cn(inputClassName, "pr-12")}
                    style={passwordInputStyle}
                    value={loginForm.password}
                    onChange={(event) =>
                      onLoginFormChange({
                        ...loginForm,
                        password: event.target.value,
                      })
                    }
                    placeholder={t("auth.enterPassword")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={onShowPasswordToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={t("auth.showHidePassword")}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </Field>

              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <input
                  checked={rememberMe}
                  onChange={(event) => onRememberMeChange(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[var(--erg-blue)]"
                  style={{ accentColor: "var(--erg-blue)", height: 16, width: 16 }}
                  type="checkbox"
                />
                {t("auth.rememberMe")}
              </label>

              <button className={submitButtonClassName} style={submitStyle} type="submit">
                {t("auth.login")}
              </button>
            </form>

            {loginFootnote ? (
              <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600" style={footnoteStyle}>
                {loginFootnote}
              </p>
            ) : null}

            {allowRegister ? (
            <div className="mt-5 text-center text-sm text-slate-600">
              {t("auth.noAccount")}
              <button
                type="button"
                className="ml-1 font-semibold text-slate-900 underline underline-offset-4"
                onClick={() => onModeChange("register")}
              >
                {t("auth.registerNow")}
              </button>
            </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                {t("auth.createTeacherAccount")}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {t("auth.registerSubtitle")}
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onRegisterSubmit}>
              <Field label={t("auth.fullName")}>
                <input
                  className={inputClassName}
                  value={registerForm.fullName}
                  onChange={(event) =>
                    onRegisterFormChange({
                      ...registerForm,
                      fullName: event.target.value,
                    })
                  }
                  placeholder={t("auth.placeholderName")}
                  type="text"
                />
              </Field>

              <Field label={t("auth.internalEmail")}>
                <input
                  className={inputClassName}
                  value={registerForm.email}
                  onChange={(event) =>
                    onRegisterFormChange({
                      ...registerForm,
                      email: event.target.value,
                    })
                  }
                  placeholder={t("auth.placeholderWorkEmail")}
                  type="email"
                />
              </Field>

              <Field label={t("auth.department")}>
                <input
                  className={inputClassName}
                  value={registerForm.department}
                  onChange={(event) =>
                    onRegisterFormChange({
                      ...registerForm,
                      department: event.target.value,
                    })
                  }
                  placeholder={t("auth.placeholderDepartment")}
                  type="text"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("auth.password")}>
                  <input
                    className={inputClassName}
                    value={registerForm.password}
                    onChange={(event) =>
                      onRegisterFormChange({
                        ...registerForm,
                        password: event.target.value,
                      })
                    }
                    placeholder={t("auth.placeholderPasswordMin")}
                    type="password"
                  />
                </Field>
                <Field label={t("auth.confirmPassword")}>
                  <input
                    className={inputClassName}
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      onRegisterFormChange({
                        ...registerForm,
                        confirmPassword: event.target.value,
                      })
                    }
                    placeholder={t("auth.placeholderConfirmPassword")}
                    type="password"
                  />
                </Field>
              </div>

              <button className={submitButtonClassName} type="submit">
                {t("auth.createAccount")}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-600">
              {t("auth.hasAccount")}
              <button
                type="button"
                className="ml-1 font-semibold text-slate-900 underline underline-offset-4"
                onClick={() => onModeChange("login")}
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
