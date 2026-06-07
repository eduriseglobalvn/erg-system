import { useRef, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

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
  loginFootnote,
  loginForm,
  loginSubtitle,
  loginTitle,
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
            <div style={styles.iconBadge}>
              <ShieldCheck size={18} />
            </div>
            <h2 style={styles.title}>{loginTitle ?? t("auth.loginTeacherHub")}</h2>
            <p style={styles.subtitle}>{loginSubtitle ?? t("auth.loginSubtitle")}</p>
          </div>

          {allowGoogle ? (
            <div style={styles.socialArea}>
              <GoogleSignInButton
                label={t("auth.loginWithGoogle")}
                onCredential={(idToken) => onProviderLogin("google", idToken)}
                onError={(message) => {
                  console.warn(message);
                }}
              />
              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>{t("auth.orContinueWith")}</span>
                <span style={styles.dividerLine} />
              </div>
            </div>
          ) : null}

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
                    <Mail color="#64748b" size={18} />
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
                  <span style={styles.passwordLabelRow}>
                    <span style={styles.label}>{t("auth.password")}</span>
                    <button style={styles.inlineButton} type="button" onClick={onForgotPassword}>
                      {t("auth.forgotPassword")}
                    </button>
                  </span>
                  <span style={styles.inputWrap}>
                    <LockKeyhole color="#64748b" size={18} />
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

            <label style={styles.rememberRow}>
              <input
                checked={rememberMe}
                onChange={(event) => onRememberMeChange(event.target.checked)}
                style={styles.checkbox}
                type="checkbox"
              />
              <span>{t("auth.rememberMe")}</span>
            </label>

            <loginTanstackForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button disabled={!canSubmit || isSubmitting} style={styles.submitButton} type="submit">
                  {t("auth.login")}
                </button>
              )}
            </loginTanstackForm.Subscribe>
          </TsForm>

          {loginFootnote ? <p style={styles.footnote}>{loginFootnote}</p> : null}
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
            <div style={styles.iconBadge}>
              <ShieldCheck size={18} />
            </div>
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
    background: "#ffffff",
    border: "1px solid #d1d1d1",
    borderRadius: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    padding: "22px 18px",
    width: "100%",
  },
  checkbox: {
    accentColor: "var(--erg-blue)",
    flex: "0 0 auto",
    height: 18,
    width: 18,
  },
  divider: {
    alignItems: "center",
    display: "flex",
    gap: 12,
    marginTop: 16,
  },
  dividerLine: {
    backgroundColor: "#e2e8f0",
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 600,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  errorText: {
    color: "#cc0022",
    fontSize: 12,
    fontWeight: 600,
    margin: 0,
  },
  footnote: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.65,
    margin: "18px 0 0",
    padding: "14px 16px",
  },
  form: {
    display: "grid",
    gap: 15,
    marginTop: 22,
  },
  headingBlock: {
    display: "grid",
    gap: 8,
  },
  iconBadge: {
    alignItems: "center",
    background: "#eef4ff",
    borderRadius: 8,
    color: "var(--erg-blue, #0f6cbd)",
    display: "inline-flex",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  iconButton: {
    alignItems: "center",
    background: "transparent",
    border: 0,
    color: "#64748b",
    display: "inline-flex",
    flex: "0 0 auto",
    height: 40,
    justifyContent: "center",
    marginRight: -8,
    width: 40,
  },
  inlineButton: {
    background: "transparent",
    border: 0,
    color: "var(--erg-blue, #0f6cbd)",
    flex: "0 0 auto",
    fontSize: 12,
    fontWeight: 600,
    padding: 0,
  },
  input: {
    background: "transparent",
    border: 0,
    color: "#0f172a",
    flex: "1 1 auto",
    fontSize: 14,
    height: 24,
    minWidth: 0,
    outline: "none",
    width: "100%",
  },
  inputWrap: {
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    boxShadow: "none",
    display: "flex",
    gap: 8,
    minHeight: 42,
    padding: "0 12px",
    width: "100%",
  },
  label: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  passwordLabelRow: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    minWidth: 0,
  },
  rememberRow: {
    alignItems: "center",
    color: "#334155",
    display: "flex",
    fontSize: 14,
    fontWeight: 600,
    gap: 10,
    lineHeight: 1.4,
  },
  segmentedActive: {
    background: "var(--erg-blue, #0f6cbd)",
    border: 0,
    borderRadius: 6,
    color: "#ffffff",
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    height: 42,
  },
  segmentedButton: {
    background: "transparent",
    border: 0,
    borderRadius: 6,
    color: "#64748b",
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    height: 42,
  },
  segmentedControl: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    display: "flex",
    gap: 4,
    marginBottom: 20,
    padding: 4,
  },
  socialArea: {
    marginTop: 18,
  },
  submitButton: {
    alignItems: "center",
    background: "var(--erg-blue, #0f6cbd)",
    border: 0,
    borderRadius: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    color: "#ffffff",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 600,
    height: 42,
    justifyContent: "center",
    marginTop: 2,
    width: "100%",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.7,
    margin: 0,
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: 1.12,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;
