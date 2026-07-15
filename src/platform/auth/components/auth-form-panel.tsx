import {
  forwardRef,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useForm } from "@tanstack/react-form";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputBase from "@mui/material/InputBase";
import { TsForm } from "@/components/ui/tanstack-form";
import { PortalMobileLoginForm } from "@/platform/auth/components/portal-mobile-login-form";
import type { AuthMode, LoginFormState, RegisterFormState } from "@/platform/auth/types/auth-types";
import { useI18n } from "@/platform/i18n";

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
  const effectiveMode: AuthMode = "login";
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
    <Box component="section" sx={{ width: "100%" }}>
      {false && allowRegister ? (
        <Box sx={{ backdropFilter: "blur(16px)", bgcolor: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 1.5, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)", display: "grid", gap: 0.5, gridTemplateColumns: "repeat(2,minmax(0,1fr))", mb: 2.5, p: 0.5 }}>
          <SegmentButton active={effectiveMode === "login"} onClick={() => onModeChange("login")}>
            {t("auth.login")}
          </SegmentButton>
          <SegmentButton active={effectiveMode === "register"} onClick={() => onModeChange("register")}>
            {t("auth.register")}
          </SegmentButton>
        </Box>
      ) : null}

      {effectiveMode === "login" ? (
        <>
          <AuthHeading
            title={loginTitle ?? t("auth.loginTeacherHub")}
            subtitle={loginSubtitle ?? t("auth.loginSubtitle")}
          />

          {false && allowGoogle ? (
            <Box sx={{ mt: 3 }}>
              <button
                type="button"
                hidden
                onClick={() => undefined}
              />
              <Box sx={{ alignItems: "center", color: "text.secondary", display: "flex", fontSize: 12, fontWeight: 700, gap: 1.5, mt: 2.5 }}>
                <Box component="span" sx={{ bgcolor: "rgba(255,255,255,0.6)", flex: 1, height: 1 }} />
                <Box component="span">Hoặc tiếp tục với</Box>
                <Box component="span" sx={{ bgcolor: "rgba(255,255,255,0.6)", flex: 1, height: 1 }} />
              </Box>
            </Box>
          ) : null}

          <Box component={TsForm}
            sx={{ display: "grid", gap: 2, mt: 2.5 }}
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
                  icon={<EmailRoundedIcon sx={{ fontSize: 18 }} />}
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
                  icon={<LockRoundedIcon sx={{ fontSize: 18 }} />}
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
                    <ButtonBase
                      aria-label={t("auth.showHidePassword")}
                      sx={{ borderRadius: 1, color: "text.secondary", display: "grid", height: 36, placeItems: "center", width: 36, "&:hover": { bgcolor: "rgba(255,255,255,0.55)", color: "text.primary" }, "&:focus-visible": { outline: "2px solid rgba(105,108,255,0.18)" } }}
                      onClick={onShowPasswordToggle}
                    >
                      {showPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                    </ButtonBase>
                  }
                />
              )}
            </loginTanstackForm.Field>

            <Box sx={{ alignItems: "center", display: "flex", fontSize: 12, gap: 1.5, justifyContent: "space-between" }}>
              <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(event) => onRememberMeChange(event.target.checked)} size="small" />} label={t("auth.rememberMe")} sx={{ color: "text.secondary", m: 0, minHeight: 32, "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 500 } }} />
              <ButtonBase
                sx={{ color: "#5558e8", fontSize: 12, fontWeight: 700, minHeight: 32, "&:hover": { color: "#3f42c8", textDecoration: "underline" } }}
                onClick={onForgotPassword}
              >
                {t("auth.forgotPassword")}
              </ButtonBase>
            </Box>

            <loginTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ bgcolor: "#696CFF", borderRadius: 1.5, boxShadow: "0 16px 34px rgba(105,108,255,0.3)", fontSize: 14, fontWeight: 800, height: 44, "&:hover": { bgcolor: "#585BE0" } }}
                  disabled={!canSubmit || isSubmitting}
                  style={{ backgroundColor: "#696CFF", boxShadow: "0 16px 34px rgba(105,108,255,0.30)", color: "#fff" }}
                  type="submit"
                >
                  {isSubmitting ? "Đang đăng nhập..." : t("auth.login")}
                </Button>
              )}
            </loginTanstackForm.Subscribe>
          </Box>

          {false && allowRegister ? (
            <Box component="p" sx={{ color: "text.secondary", fontSize: 14, mt: 2.5, textAlign: "center" }}>
              {t("auth.noAccount")}
              <ButtonBase
                sx={{ color: "text.primary", fontSize: 14, fontWeight: 700, ml: 0.5, textDecoration: "underline", textUnderlineOffset: 4, "&:hover": { color: "#696CFF" } }}
                onClick={() => onModeChange("register")}
              >
                {t("auth.registerNow")}
              </ButtonBase>
            </Box>
          ) : null}
        </>
      ) : (
        <>
          <AuthHeading title={t("auth.createTeacherAccount")} subtitle={t("auth.registerSubtitle")} center />

          <Box component={TsForm}
            sx={{ display: "grid", gap: 2, mt: 3 }}
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
                  icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
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
                  icon={<EmailRoundedIcon sx={{ fontSize: 18 }} />}
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
              icon={<BusinessRoundedIcon sx={{ fontSize: 18 }} />}
              label={t("auth.department")}
              onChange={(value) => onRegisterFormChange({ ...registerForm, department: value })}
              placeholder={t("auth.placeholderDepartment")}
              value={registerForm.department}
            />

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "repeat(2,minmax(0,1fr))" } }}>
              <registerTanstackForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) => validatePassword(value),
                }}
              >
                {(field) => (
                  <GlassField
                    error={field.state.meta.errors[0]}
                    icon={<LockRoundedIcon sx={{ fontSize: 18 }} />}
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
                    icon={<LockRoundedIcon sx={{ fontSize: 18 }} />}
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
            </Box>

            <registerTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ bgcolor: "#696CFF", borderRadius: 1.5, boxShadow: "0 16px 34px rgba(105,108,255,0.3)", fontSize: 14, fontWeight: 800, height: 44, "&:hover": { bgcolor: "#585BE0" } }}
                  disabled={!canSubmit || isSubmitting}
                  style={{ backgroundColor: "#696CFF", boxShadow: "0 16px 34px rgba(105,108,255,0.30)", color: "#fff" }}
                  type="submit"
                >
                  {isSubmitting ? "Đang tạo tài khoản..." : t("auth.createAccount")}
                </Button>
              )}
            </registerTanstackForm.Subscribe>
          </Box>

          <Box component="p" sx={{ color: "text.secondary", fontSize: 14, mt: 2.5, textAlign: "center" }}>
            {t("auth.hasAccount")}
            <ButtonBase
              sx={{ color: "text.primary", fontSize: 14, fontWeight: 700, ml: 0.5, textDecoration: "underline", textUnderlineOffset: 4, "&:hover": { color: "#696CFF" } }}
              onClick={() => onModeChange("login")}
            >
              {t("auth.backToLogin")}
            </ButtonBase>
          </Box>
        </>
      )}
    </Box>
  );
}

function AuthHeading({ center, subtitle, title }: { center?: boolean; subtitle: string; title: string }) {
  return (
    <Box component="header" sx={{ textAlign: center ? "center" : "left" }}>
      <Box component="h1" sx={{ color: "#1C252E", fontSize: 26, fontWeight: 700, lineHeight: 1.25, m: 0 }}>{title}</Box>
      <Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.5, m: 0, mt: 1, ...(center ? { mx: "auto", maxWidth: 360 } : {}) }}>{subtitle}</Box>
    </Box>
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
    <ButtonBase
      sx={{ borderRadius: 1, color: active ? "#1C252E" : "text.secondary", height: 40, fontSize: 14, fontWeight: 700, ...(active ? { bgcolor: "background.paper", boxShadow: "0 10px 22px rgba(105,108,255,0.12)" } : { "&:hover": { bgcolor: "rgba(255,255,255,0.4)", color: "#1C252E" } }), "&:focus-visible": { outline: "2px solid rgba(105,108,255,0.2)" } }}
      onClick={onClick}
    >
      {children}
    </ButtonBase>
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
      <Box component="label" sx={{ display: "grid", gap: 1 }}>
        <Box component="span" sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700 }}>{label}</Box>
        <Box component="span" sx={{ alignItems: "center", backdropFilter: "blur(16px)", bgcolor: "rgba(255,255,255,0.55)", border: "1px solid", borderColor: error ? "error.light" : "rgba(255,255,255,0.6)", borderRadius: 1.5, boxShadow: error ? "0 0 0 4px rgba(244,63,94,0.1)" : "inset 0 1px 0 rgba(255,255,255,0.65)", color: "text.secondary", display: "flex", gap: 1, minHeight: 44, px: 1.5, transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease", "&:focus-within": { bgcolor: "rgba(255,255,255,0.75)", borderColor: "rgba(105,108,255,0.55)", boxShadow: "0 0 0 4px rgba(105,108,255,0.1)" } }}>
          {icon}
          <InputBase
            fullWidth
            error={Boolean(error)}
            autoComplete={autoComplete}
            sx={{ height: 40 }}
            placeholder={placeholder}
            inputRef={ref}
            type={type}
            value={value}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
          {action}
        </Box>
        <FormHelperText error sx={{ fontSize: 12, fontWeight: 700, m: 0 }}>{error}</FormHelperText>
      </Box>
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
