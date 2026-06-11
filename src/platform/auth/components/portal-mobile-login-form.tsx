import { useRef, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Apple, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { useForm } from "@tanstack/react-form";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { GoogleSignInButton } from "@/platform/auth/components/google-sign-in-button";
import type {
  AuthMode,
  LoginFormState,
  RegisterFormState,
} from "@/platform/auth/types/auth-types";
import { useI18n } from "@/platform/i18n";

type PortalMobileLoginFormProps = {
  allowGoogle?: boolean;
  allowRegister?: boolean;
  credentialLabel?: string;
  credentialPlaceholder?: string;
  loginFootnote?: string;
  loginForm: LoginFormState;
  loginSubtitle?: string;
  loginTitle?: string;
  mode: AuthMode;
  onForgotPassword: () => void;
  onLoginFormChange: (value: LoginFormState) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: AuthMode) => void;
  onProviderLogin: (provider: "google", idToken?: string) => void;
  onRegisterFormChange: (value: RegisterFormState) => void;
  onRegisterSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRememberMeChange: (rememberMe: boolean) => void;
  onShowPasswordToggle: () => void;
  registerForm: RegisterFormState;
  rememberMe: boolean;
  showPassword: boolean;
};

export function PortalMobileLoginForm({
  allowGoogle = true,
  allowRegister = true,
  credentialLabel,
  credentialPlaceholder,
  loginForm,
  mode,
  onForgotPassword,
  onLoginFormChange,
  onLoginSubmit,
  onModeChange,
  onProviderLogin,
  onRegisterFormChange,
  onRegisterSubmit,
  onRememberMeChange,
  onShowPasswordToggle,
  registerForm,
  rememberMe,
  showPassword,
}: PortalMobileLoginFormProps) {
  const { t } = useI18n();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const effectiveMode = allowRegister ? mode : "login";
  const loginTanstackForm = useForm({
    defaultValues: loginForm,
    onSubmit: () => onLoginSubmit(createHandledSubmitEvent()),
  });
  const registerTanstackForm = useForm({
    defaultValues: registerForm,
    onSubmit: () => onRegisterSubmit(createHandledSubmitEvent()),
  });

  function focusPasswordFromEmail(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key !== "Tab" || event.shiftKey) && event.key !== "Enter") return;

    event.preventDefault();
    passwordInputRef.current?.focus();
  }

  return (
    <section style={styles.card}>
      <div style={styles.cardAccent} />
      {allowRegister ? (
        <div style={styles.segmentedControl}>
          <button
            style={effectiveMode === "login" ? styles.segmentedActive : styles.segmentedButton}
            type="button"
            onClick={() => onModeChange("login")}
          >
            {t("auth.login")}
          </button>
          <button
            style={effectiveMode === "register" ? styles.segmentedActive : styles.segmentedButton}
            type="button"
            onClick={() => onModeChange("register")}
          >
            {t("auth.register")}
          </button>
        </div>
      ) : null}

      {effectiveMode === "login" ? (
        <>
          <div style={styles.headingBlock}>
            <h2 style={styles.title}>
              Chào mừng trở lại
            </h2>
            <p style={styles.subtitle}>Đăng nhập để quản lý lớp học, lịch dạy và học sinh ERG.</p>
          </div>

          <TsForm
            style={styles.form}
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
                <label style={styles.field}>
                  <span style={styles.label}>{credentialLabel ?? t("auth.email")}</span>
                  <span style={styles.inputWrap}>
                    <Mail color="#6b8aaa" size={17} />
                    <input
                      autoComplete="username"
                      inputMode="email"
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        onLoginFormChange({ ...loginForm, email: event.target.value });
                      }}
                      onKeyDown={focusPasswordFromEmail}
                      placeholder={credentialPlaceholder ?? t("auth.placeholderWorkEmail")}
                      style={styles.input}
                      type="text"
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                    />
                  </span>
                  <TsFormMessage style={styles.errorText}>{field.state.meta.errors[0]}</TsFormMessage>
                </label>
              )}
            </loginTanstackForm.Field>

            <loginTanstackForm.Field
              name="password"
              validators={{
                onChange: ({ value }) => validatePassword(value),
              }}
            >
              {(field) => (
                <label style={styles.field}>
                  <span style={styles.label}>{t("auth.password")}</span>
                  <span style={styles.inputWrap}>
                    <LockKeyhole color="#6b8aaa" size={17} />
                    <input
                      ref={passwordInputRef}
                      autoComplete="current-password"
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        onLoginFormChange({ ...loginForm, password: event.target.value });
                      }}
                      placeholder={t("auth.enterPassword")}
                      style={styles.input}
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                    />
                    <button
                      aria-label={t("auth.showHidePassword")}
                      style={styles.iconButton}
                      type="button"
                      onClick={onShowPasswordToggle}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </span>
                  <TsFormMessage style={styles.errorText}>{field.state.meta.errors[0]}</TsFormMessage>
                </label>
              )}
            </loginTanstackForm.Field>

            <div style={styles.metaRow}>
              <label style={styles.rememberRow}>
                <input
                  checked={rememberMe}
                  onChange={(event) => onRememberMeChange(event.target.checked)}
                  style={styles.checkbox}
                  type="checkbox"
                />
                <span>{t("auth.rememberMe")}</span>
              </label>
              <button style={styles.inlineButton} type="button" onClick={onForgotPassword}>
                {t("auth.forgotPassword")}
              </button>
            </div>

            <loginTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button disabled={!canSubmit || isSubmitting} style={styles.submitButton} type="submit">
                  {t("auth.login")}
                </button>
              )}
            </loginTanstackForm.Subscribe>
          </TsForm>

          {allowGoogle ? (
            <div style={styles.socialArea}>
              <p style={styles.socialLabel}>Hoặc đăng nhập với</p>
              <div style={styles.socialButtons}>
                <DisabledSocialButton label="Facebook">
                  <span style={styles.facebookGlyph}>f</span>
                </DisabledSocialButton>
                <GoogleSignInButton
                  label={t("auth.loginWithGoogle")}
                  onCredential={(idToken) => onProviderLogin("google", idToken)}
                  onError={(message) => {
                    console.warn(message);
                  }}
                  variant="icon"
                />
                <DisabledSocialButton label="Apple">
                  <Apple fill="#111827" size={23} strokeWidth={0} />
                </DisabledSocialButton>
              </div>
            </div>
          ) : null}

        </>
      ) : (
        <TsForm
          style={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void registerTanstackForm.handleSubmit();
          }}
        >
          <div style={styles.headingBlock}>
            <h2 style={styles.title}>{t("auth.createTeacherAccount")}</h2>
            <p style={styles.subtitle}>{t("auth.registerSubtitle")}</p>
          </div>

          <registerTanstackForm.Field
            name="fullName"
            validators={{
              onChange: ({ value }) => validateRequired(value, t("auth.fullName")),
            }}
          >
            {(field) => (
              <MobileTextField
                error={field.state.meta.errors[0]}
                label={t("auth.fullName")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onRegisterFormChange({ ...registerForm, fullName: value });
                }}
                placeholder={t("auth.placeholderName")}
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
              <MobileTextField
                error={field.state.meta.errors[0]}
                label={t("auth.internalEmail")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onRegisterFormChange({ ...registerForm, email: value });
                }}
                placeholder={t("auth.placeholderWorkEmail")}
                type="email"
              />
            )}
          </registerTanstackForm.Field>
          <MobileTextField
            label={t("auth.department")}
            value={registerForm.department}
            onChange={(value) => onRegisterFormChange({ ...registerForm, department: value })}
            placeholder={t("auth.placeholderDepartment")}
          />
          <registerTanstackForm.Field
            name="password"
            validators={{
              onChange: ({ value }) => validatePassword(value),
            }}
          >
            {(field) => (
              <MobileTextField
                error={field.state.meta.errors[0]}
                label={t("auth.password")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onRegisterFormChange({ ...registerForm, password: value });
                }}
                placeholder={t("auth.placeholderPasswordMin")}
                type="password"
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
              <MobileTextField
                error={field.state.meta.errors[0]}
                label={t("auth.confirmPassword")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onRegisterFormChange({ ...registerForm, confirmPassword: value });
                }}
                placeholder={t("auth.placeholderConfirmPassword")}
                type="password"
              />
            )}
          </registerTanstackForm.Field>

          <registerTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <button disabled={!canSubmit || isSubmitting} style={styles.submitButton} type="submit">
                {t("auth.createAccount")}
              </button>
            )}
          </registerTanstackForm.Subscribe>
        </TsForm>
      )}
    </section>
  );
}

function MobileTextField({
  error,
  label,
  onBlur,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <span style={styles.inputWrap}>
        <input
          aria-invalid={error ? "true" : undefined}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{ ...styles.input, paddingLeft: 0 }}
          type={type}
          value={value}
        />
      </span>
      <TsFormMessage style={styles.errorText}>{error}</TsFormMessage>
    </label>
  );
}

function DisabledSocialButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button aria-label={label} disabled style={styles.socialButton} type="button">
      {children}
    </button>
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

const styles = {
  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, #ffffff 100%)",
    border: "1px solid rgba(255,255,255,0.72)",
    borderRadius: 34,
    boxShadow: "0 30px 70px rgba(24, 58, 99, 0.13)",
    overflow: "hidden",
    padding: "28px 24px 28px",
    position: "relative",
    width: "100%",
  },
  cardAccent: {
    background: "linear-gradient(90deg, transparent, rgba(49, 134, 246, 0.50), transparent)",
    height: 2,
    left: 44,
    position: "absolute",
    right: 44,
    top: 0,
  },
  checkbox: {
    accentColor: "#3186f6",
    flex: "0 0 auto",
    height: 13,
    width: 13,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  errorText: {
    color: "#cc0022",
    fontSize: 11,
    fontWeight: 600,
    margin: 0,
  },
  footnote: {
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: 14,
    color: "#475569",
    fontSize: 12,
    lineHeight: 1.6,
    margin: "16px 0 0",
    padding: "12px 14px",
  },
  form: {
    display: "grid",
    gap: 14,
    marginTop: 23,
  },
  headingBlock: {
    display: "grid",
    gap: 7,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    background: "transparent",
    border: 0,
    color: "#9aa5b5",
    display: "inline-flex",
    flex: "0 0 auto",
    height: 42,
    justifyContent: "center",
    marginRight: -8,
    width: 42,
  },
  inlineButton: {
    background: "transparent",
    border: 0,
    color: "#2f86f6",
    flex: "0 0 auto",
    fontSize: 11,
    fontWeight: 500,
    minHeight: 28,
    padding: "4px 0 4px 8px",
  },
  input: {
    background: "transparent",
    border: 0,
    color: "#192232",
    flex: "1 1 auto",
    fontSize: 14,
    height: 46,
    minWidth: 0,
    outline: "none",
    width: "100%",
  },
  inputWrap: {
    alignItems: "center",
    background: "#f5f8fc",
    border: "1px solid #edf2f8",
    borderRadius: 20,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
    display: "flex",
    gap: 8,
    minHeight: 48,
    padding: "0 14px",
    width: "100%",
  },
  label: {
    color: "#243246",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  metaRow: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    minWidth: 0,
    paddingTop: 1,
  },
  rememberRow: {
    alignItems: "center",
    color: "#a5adba",
    display: "flex",
    fontSize: 11,
    fontWeight: 500,
    gap: 6,
    lineHeight: 1.4,
  },
  segmentedActive: {
    background: "var(--erg-blue, #0f6cbd)",
    border: 0,
    borderRadius: 10,
    boxShadow: "0 8px 18px rgba(15, 108, 189, 0.22)",
    color: "#ffffff",
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    height: 44,
  },
  segmentedButton: {
    background: "transparent",
    border: 0,
    borderRadius: 10,
    color: "#64748b",
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    height: 44,
  },
  segmentedControl: {
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: 14,
    display: "flex",
    gap: 4,
    marginBottom: 18,
    padding: 4,
  },
  socialArea: {
    marginTop: 22,
  },
  socialButton: {
    alignItems: "center",
    background: "#ffffff",
    border: 0,
    borderRadius: 18,
    boxShadow: "0 14px 28px rgba(24, 58, 99, 0.09)",
    color: "#111827",
    display: "inline-flex",
    height: 48,
    justifyContent: "center",
    opacity: 1,
    width: 48,
  },
  socialButtons: {
    alignItems: "center",
    display: "flex",
    gap: 18,
    justifyContent: "center",
    marginTop: 12,
  },
  socialLabel: {
    color: "#a0a8b5",
    fontSize: 11,
    fontWeight: 500,
    margin: 0,
    textAlign: "center",
  },
  facebookGlyph: {
    alignItems: "center",
    background: "#4267b2",
    borderRadius: 999,
    color: "#ffffff",
    display: "inline-flex",
    fontFamily: "Arial, sans-serif",
    fontSize: 21,
    fontWeight: 700,
    height: 22,
    justifyContent: "center",
    lineHeight: 1,
    paddingTop: 4,
    width: 22,
  },
  submitButton: {
    alignItems: "center",
    background: "linear-gradient(180deg, #3d92ff 0%, #247cf1 100%)",
    border: 0,
    borderRadius: 20,
    boxShadow: "0 16px 30px rgba(49, 134, 246, 0.30)",
    color: "#ffffff",
    display: "inline-flex",
    fontSize: 13,
    fontWeight: 800,
    height: 48,
    justifyContent: "center",
    marginTop: 8,
    width: "100%",
  },
  subtitle: {
    color: "#7f8da0",
    fontSize: 12,
    lineHeight: 1.55,
    margin: 0,
  },
  title: {
    color: "#101828",
    fontSize: 21,
    fontWeight: 850,
    letterSpacing: 0,
    lineHeight: 1.18,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;
