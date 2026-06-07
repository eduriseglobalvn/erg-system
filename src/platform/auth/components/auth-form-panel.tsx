import { useRef, type FormEvent, type KeyboardEvent } from "react";

import { EyeIcon } from "@/platform/auth/components/auth-icons";
import { useForm } from "@tanstack/react-form";
import {
  DividerText,
  Field,
} from "@/platform/auth/components/auth-shared";
import { inputClassName, submitButtonClassName } from "@/platform/auth/components/auth-shared-styles";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { PortalMobileLoginForm } from "@/platform/auth/components/portal-mobile-login-form";
import { GoogleSignInButton } from "@/platform/auth/components/google-sign-in-button";
import type {
  AuthMode,
  LoginFormState,
  RegisterFormState,
} from "@/platform/auth/types/auth-types";
import { useI18n } from "@/platform/i18n";
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
  const loginTanstackForm = useForm({
    defaultValues: loginForm,
    onSubmit: () => onLoginSubmit(createHandledSubmitEvent()),
  });
  const registerTanstackForm = useForm({
    defaultValues: registerForm,
    onSubmit: () => onRegisterSubmit(createHandledSubmitEvent()),
  });

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
    ? ({ color: "#242424", fontSize: 20, fontWeight: 600, letterSpacing: 0, lineHeight: 1.25 } as const)
    : undefined;
  const subtitleStyle = mobileVariant
    ? ({ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginTop: 10, maxWidth: 320 } as const)
    : undefined;
  const formCardStyle = mobileVariant
    ? ({
        backgroundColor: "#ffffff",
        border: "1px solid #d9e0ea",
        borderRadius: 8,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        marginTop: allowRegister ? 14 : 0,
        padding: "22px 18px",
      } as const)
    : undefined;
  const inputStyle = mobileVariant
    ? ({
        backgroundColor: "#ffffff",
        border: "1px solid #cfd7e3",
        borderRadius: 6,
        color: "#242424",
        fontSize: 14,
        height: 40,
        padding: "0 12px",
        width: "100%",
      } as const)
    : undefined;
  const passwordInputStyle = mobileVariant
    ? ({
        backgroundColor: "#ffffff",
        border: "1px solid #cfd7e3",
        borderRadius: 6,
        color: "#242424",
        fontSize: 14,
        height: 40,
        padding: "0 42px 0 12px",
        width: "100%",
      } as const)
    : undefined;
  const submitStyle = mobileVariant
    ? ({
        backgroundColor: "var(--erg-blue)",
        borderRadius: 6,
        color: "#fff",
        display: "inline-flex",
        fontSize: 14,
        fontWeight: 600,
        height: 40,
        justifyContent: "center",
        width: "100%",
      } as const)
    : undefined;
  const footnoteStyle = mobileVariant
    ? ({
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
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
      <div className="rounded-lg border border-[#cfd7e3] bg-[#f6f8fb] p-1 shadow-sm" style={{ backgroundColor: "#f6f8fb", border: "1px solid #cfd7e3", borderRadius: 8, padding: 4 }}>
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
                "relative h-10 rounded-md border border-transparent px-4 text-sm font-semibold transition",
                mode === item.id
                  ? "border-[#b8d6fa] bg-white text-[var(--erg-blue)] shadow-sm after:absolute after:inset-x-6 after:bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--erg-blue)]"
                  : "text-slate-600 hover:bg-white hover:text-slate-950",
              )}
              style={{ borderRadius: 6, fontSize: 14, fontWeight: 600, height: 40, padding: "0 16px" }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      ) : null}

      <div className={cn("rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7", allowRegister ? "mt-4" : "mt-0")} style={formCardStyle}>
        {effectiveMode === "login" ? (
          <>
            <div className="text-left" style={{ textAlign: "left" }}>
              <h2 className="text-lg font-semibold text-[#242424] sm:text-xl" style={titleStyle}>
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

            <TsForm
              className="mt-5 space-y-4"
              style={{ marginTop: 20 }}
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void loginTanstackForm.handleSubmit();
              }}
            >
              <loginTanstackForm.Field
                name="email"
                validators={{
                  onChange: ({ value }) => validateCredential(value, credentialLabel ?? t("auth.email")),
                }}
              >
                {(field) => (
                  <Field label={credentialLabel ?? t("auth.email")}>
                    <input
                      className={inputClassName}
                      style={inputStyle}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        onLoginFormChange({
                          ...loginForm,
                          email: event.target.value,
                        });
                      }}
                      placeholder={credentialPlaceholder ?? t("auth.placeholderWorkEmail")}
                      type="text"
                      autoComplete="username"
                      aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                      onKeyDown={focusPasswordFromEmail}
                    />
                    <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                  </Field>
                )}
              </loginTanstackForm.Field>

              <loginTanstackForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) => validatePassword(value),
                }}
              >
                {(field) => (
                  <Field
                    label={t("auth.password")}
                    action={
                      <button
                        type="button"
                        className="font-semibold text-[var(--erg-blue)] hover:text-[var(--erg-blue-hover)]"
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
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                          onLoginFormChange({
                            ...loginForm,
                            password: event.target.value,
                          });
                        }}
                        placeholder={t("auth.enterPassword")}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        aria-invalid={field.state.meta.errors.length ? "true" : undefined}
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
                    <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                  </Field>
                )}
              </loginTanstackForm.Field>

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

              <loginTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <button className={submitButtonClassName} disabled={!canSubmit || isSubmitting} style={submitStyle} type="submit">
                    {t("auth.login")}
                  </button>
                )}
              </loginTanstackForm.Subscribe>
            </TsForm>

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
              <h2 className="text-lg font-semibold text-[#242424] sm:text-xl">
                {t("auth.createTeacherAccount")}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {t("auth.registerSubtitle")}
              </p>
            </div>

            <TsForm
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void registerTanstackForm.handleSubmit();
              }}
            >
              <registerTanstackForm.Field
                name="fullName"
                validators={{
                  onChange: ({ value }) => validateRequired(value, t("auth.fullName")),
                }}
              >
                {(field) => (
                  <Field label={t("auth.fullName")}>
                    <input
                      className={inputClassName}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        onRegisterFormChange({
                          ...registerForm,
                          fullName: event.target.value,
                        });
                      }}
                      placeholder={t("auth.placeholderName")}
                      type="text"
                      aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                    />
                    <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                  </Field>
                )}
              </registerTanstackForm.Field>

              <registerTanstackForm.Field
                name="email"
                validators={{
                  onChange: ({ value }) => validateEmail(value),
                }}
              >
                {(field) => (
                  <Field label={t("auth.internalEmail")}>
                    <input
                      className={inputClassName}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        onRegisterFormChange({
                          ...registerForm,
                          email: event.target.value,
                        });
                      }}
                      placeholder={t("auth.placeholderWorkEmail")}
                      type="email"
                      aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                    />
                    <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                  </Field>
                )}
              </registerTanstackForm.Field>

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
                <registerTanstackForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => validatePassword(value),
                  }}
                >
                  {(field) => (
                    <Field label={t("auth.password")}>
                      <input
                        className={inputClassName}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                          onRegisterFormChange({
                            ...registerForm,
                            password: event.target.value,
                          });
                        }}
                        placeholder={t("auth.placeholderPasswordMin")}
                        type="password"
                        aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                      />
                      <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                    </Field>
                  )}
                </registerTanstackForm.Field>
                <registerTanstackForm.Field
                  name="confirmPassword"
                  validators={{
                    onChange: ({ value, fieldApi }) => {
                      const password = fieldApi.form.getFieldValue("password");
                      return value === password ? undefined : "Mật khẩu xác nhận chưa khớp.";
                    },
                  }}
                >
                  {(field) => (
                    <Field label={t("auth.confirmPassword")}>
                      <input
                        className={inputClassName}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                          onRegisterFormChange({
                            ...registerForm,
                            confirmPassword: event.target.value,
                          });
                        }}
                        placeholder={t("auth.placeholderConfirmPassword")}
                        type="password"
                        aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                      />
                      <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                    </Field>
                  )}
                </registerTanstackForm.Field>
              </div>

              <registerTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <button className={submitButtonClassName} disabled={!canSubmit || isSubmitting} type="submit">
                    {t("auth.createAccount")}
                  </button>
                )}
              </registerTanstackForm.Subscribe>
            </TsForm>

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

function createHandledSubmitEvent() {
  return {
    preventDefault() {},
    stopPropagation() {},
  } as FormEvent<HTMLFormElement>;
}

function validateRequired(value: string, label: string) {
  return value.trim() ? undefined : `${label} là bắt buộc.`;
}

function validateCredential(value: string, label: string) {
  const requiredMessage = validateRequired(value, label);
  if (requiredMessage) return requiredMessage;
  if (label.toLowerCase().includes("email")) return validateEmail(value);
  return undefined;
}

function validateEmail(value: string) {
  if (!value.trim()) return "Email là bắt buộc.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Email không hợp lệ.";
}

function validatePassword(value: string) {
  if (!value) return "Mật khẩu là bắt buộc.";
  return value.length >= 6 ? undefined : "Mật khẩu tối thiểu 6 ký tự.";
}
