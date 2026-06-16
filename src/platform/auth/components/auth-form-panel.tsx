import {
  forwardRef,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import { Building2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { GoogleSignInButton } from "@/platform/auth/components/google-sign-in-button";
import { PortalMobileLoginForm } from "@/platform/auth/components/portal-mobile-login-form";
import type { AuthMode, LoginFormState, RegisterFormState } from "@/platform/auth/types/auth-types";
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

  return (
    <section className="w-full">
      {allowRegister ? (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/55 bg-white/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl">
          <SegmentButton active={effectiveMode === "login"} onClick={() => onModeChange("login")}>
            {t("auth.login")}
          </SegmentButton>
          <SegmentButton active={effectiveMode === "register"} onClick={() => onModeChange("register")}>
            {t("auth.register")}
          </SegmentButton>
        </div>
      ) : null}

      {effectiveMode === "login" ? (
        <>
          <AuthHeading
            title={loginTitle ?? t("auth.loginTeacherHub")}
            subtitle={loginSubtitle ?? t("auth.loginSubtitle")}
          />

          {allowGoogle ? (
            <div className="mt-6">
              <GoogleSignInButton
                label={t("auth.loginWithGoogle")}
                onCredential={(idToken) => onProviderLogin("google", idToken)}
                onError={(message) => {
                  console.warn(message);
                }}
              />
              <div className="mt-5 flex items-center gap-3 text-xs font-semibold text-slate-500/80">
                <span className="h-px flex-1 bg-white/60" />
                <span>Hoặc tiếp tục với</span>
                <span className="h-px flex-1 bg-white/60" />
              </div>
            </div>
          ) : null}

          <TsForm
            className="mt-5 space-y-4"
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
                <GlassField
                  autoComplete="username"
                  error={field.state.meta.errors[0]}
                  icon={<Mail size={18} />}
                  label={credentialLabel ?? t("auth.email")}
                  onBlur={field.handleBlur}
                  onChange={(value) => {
                    field.handleChange(value);
                    onLoginFormChange({ ...loginForm, email: value });
                  }}
                  onKeyDown={focusPasswordFromEmail}
                  placeholder={credentialPlaceholder ?? t("auth.placeholderWorkEmail")}
                  value={field.state.value}
                />
              )}
            </loginTanstackForm.Field>

            <loginTanstackForm.Field
              name="password"
              validators={{
                onChange: ({ value }) => validatePassword(value),
              }}
            >
              {(field) => (
                <GlassField
                  ref={passwordInputRef}
                  autoComplete="current-password"
                  error={field.state.meta.errors[0]}
                  icon={<LockKeyhole size={18} />}
                  label={t("auth.password")}
                  onBlur={field.handleBlur}
                  onChange={(value) => {
                    field.handleChange(value);
                    onLoginFormChange({ ...loginForm, password: value });
                  }}
                  placeholder={t("auth.enterPassword")}
                  type={showPassword ? "text" : "password"}
                  value={field.state.value}
                  action={
                    <button
                      aria-label={t("auth.showHidePassword")}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-white/55 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[rgba(105,108,255,0.18)]"
                      type="button"
                      onClick={onShowPasswordToggle}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              )}
            </loginTanstackForm.Field>

            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="inline-flex min-h-8 items-center gap-2 font-medium text-slate-600">
                <input
                  checked={rememberMe}
                  className="h-3.5 w-3.5 rounded border-white/60 accent-[#696CFF]"
                  type="checkbox"
                  onChange={(event) => onRememberMeChange(event.target.checked)}
                />
                <span>{t("auth.rememberMe")}</span>
              </label>
              <button
                className="min-h-8 font-semibold text-[#5558e8] underline-offset-4 transition hover:text-[#3f42c8] hover:underline"
                type="button"
                onClick={onForgotPassword}
              >
                {t("auth.forgotPassword")}
              </button>
            </div>

            <loginTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  className="h-11 w-full rounded-xl bg-[#696CFF] text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(105,108,255,0.30)] hover:bg-[#585BE0]"
                  disabled={!canSubmit || isSubmitting}
                  style={{ backgroundColor: "#696CFF", boxShadow: "0 16px 34px rgba(105,108,255,0.30)", color: "#fff" }}
                  type="submit"
                >
                  {isSubmitting ? "Đang đăng nhập..." : t("auth.login")}
                </Button>
              )}
            </loginTanstackForm.Subscribe>
          </TsForm>

          {allowRegister ? (
            <p className="mt-5 text-center text-sm text-slate-600">
              {t("auth.noAccount")}
              <button
                className="ml-1 font-semibold text-slate-900 underline underline-offset-4 transition hover:text-[#696CFF]"
                type="button"
                onClick={() => onModeChange("register")}
              >
                {t("auth.registerNow")}
              </button>
            </p>
          ) : null}
        </>
      ) : (
        <>
          <AuthHeading title={t("auth.createTeacherAccount")} subtitle={t("auth.registerSubtitle")} center />

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
                <GlassField
                  error={field.state.meta.errors[0]}
                  icon={<UserRound size={18} />}
                  label={t("auth.fullName")}
                  onBlur={field.handleBlur}
                  onChange={(value) => {
                    field.handleChange(value);
                    onRegisterFormChange({ ...registerForm, fullName: value });
                  }}
                  placeholder={t("auth.placeholderName")}
                  value={field.state.value}
                />
              )}
            </registerTanstackForm.Field>

            <registerTanstackForm.Field
              name="email"
              validators={{
                onChange: ({ value }) => validateEmail(value),
              }}
            >
              {(field) => (
                <GlassField
                  autoComplete="email"
                  error={field.state.meta.errors[0]}
                  icon={<Mail size={18} />}
                  label={t("auth.internalEmail")}
                  onBlur={field.handleBlur}
                  onChange={(value) => {
                    field.handleChange(value);
                    onRegisterFormChange({ ...registerForm, email: value });
                  }}
                  placeholder={t("auth.placeholderWorkEmail")}
                  type="email"
                  value={field.state.value}
                />
              )}
            </registerTanstackForm.Field>

            <GlassField
              icon={<Building2 size={18} />}
              label={t("auth.department")}
              onChange={(value) => onRegisterFormChange({ ...registerForm, department: value })}
              placeholder={t("auth.placeholderDepartment")}
              value={registerForm.department}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <registerTanstackForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) => validatePassword(value),
                }}
              >
                {(field) => (
                  <GlassField
                    error={field.state.meta.errors[0]}
                    icon={<LockKeyhole size={18} />}
                    label={t("auth.password")}
                    onBlur={field.handleBlur}
                    onChange={(value) => {
                      field.handleChange(value);
                      onRegisterFormChange({ ...registerForm, password: value });
                    }}
                    placeholder={t("auth.placeholderPasswordMin")}
                    type="password"
                    value={field.state.value}
                  />
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
                  <GlassField
                    error={field.state.meta.errors[0]}
                    icon={<LockKeyhole size={18} />}
                    label={t("auth.confirmPassword")}
                    onBlur={field.handleBlur}
                    onChange={(value) => {
                      field.handleChange(value);
                      onRegisterFormChange({ ...registerForm, confirmPassword: value });
                    }}
                    placeholder={t("auth.placeholderConfirmPassword")}
                    type="password"
                    value={field.state.value}
                  />
                )}
              </registerTanstackForm.Field>
            </div>

            <registerTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  className="h-11 w-full rounded-xl bg-[#696CFF] text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(105,108,255,0.30)] hover:bg-[#585BE0]"
                  disabled={!canSubmit || isSubmitting}
                  style={{ backgroundColor: "#696CFF", boxShadow: "0 16px 34px rgba(105,108,255,0.30)", color: "#fff" }}
                  type="submit"
                >
                  {isSubmitting ? "Đang tạo tài khoản..." : t("auth.createAccount")}
                </Button>
              )}
            </registerTanstackForm.Subscribe>
          </TsForm>

          <p className="mt-5 text-center text-sm text-slate-600">
            {t("auth.hasAccount")}
            <button
              className="ml-1 font-semibold text-slate-900 underline underline-offset-4 transition hover:text-[#696CFF]"
              type="button"
              onClick={() => onModeChange("login")}
            >
              {t("auth.backToLogin")}
            </button>
          </p>
        </>
      )}
    </section>
  );
}

function AuthHeading({ center, subtitle, title }: { center?: boolean; subtitle: string; title: string }) {
  return (
    <header className={cn(center ? "text-center" : "text-left")}>
      <h1 className="text-[26px] font-bold leading-tight text-[#1C252E]">{title}</h1>
      <p className={cn("mt-2 text-sm leading-6 text-slate-600", center && "mx-auto max-w-[360px]")}>{subtitle}</p>
    </header>
  );
}

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "h-10 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[rgba(105,108,255,0.20)]",
        active
          ? "bg-white text-[#1C252E] shadow-[0_10px_22px_rgba(105,108,255,0.12)]"
          : "text-slate-600 hover:bg-white/40 hover:text-[#1C252E]",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const GlassField = forwardRef<HTMLInputElement, {
  action?: ReactNode;
  autoComplete?: string;
  error?: string;
  icon?: ReactNode;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  placeholder: string;
  type?: string;
  value: string;
}>(function GlassField({
    action,
    autoComplete,
    error,
    icon,
    label,
    onBlur,
    onChange,
    onKeyDown,
    placeholder,
    type = "text",
    value,
  },
  ref,
) {
    return (
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-xl border border-white/60 bg-white/55 px-3 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl transition focus-within:border-[#696CFF]/55 focus-within:bg-white/75 focus-within:ring-4 focus-within:ring-[#696CFF]/10",
            error && "border-rose-300/80 ring-4 ring-rose-500/10",
          )}
        >
          {icon}
          <Input
            aria-invalid={error ? "true" : undefined}
            autoComplete={autoComplete}
            className="h-10 border-0 bg-transparent px-0 shadow-none focus:border-0 focus:ring-0"
            placeholder={placeholder}
            ref={ref}
            type={type}
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
          {action}
        </span>
        <TsFormMessage className="text-xs font-semibold text-rose-600">{error}</TsFormMessage>
      </label>
    );
});

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
