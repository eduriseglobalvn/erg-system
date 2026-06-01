import { useRef, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import type {
  AuthMode,
  LoginFormState,
  RegisterFormState,
} from "@/features/auth/types/auth-types";
import { useI18n } from "@/features/i18n";

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

          <form style={styles.form} onSubmit={onLoginSubmit}>
            <label style={styles.field}>
              <span style={styles.label}>{credentialLabel ?? t("auth.email")}</span>
              <span style={styles.inputWrap}>
                <Mail color="#64748b" size={18} />
                <input
                  autoComplete="username"
                  inputMode="email"
                  onChange={(event) => onLoginFormChange({ ...loginForm, email: event.target.value })}
                  onKeyDown={focusPasswordFromEmail}
                  placeholder={credentialPlaceholder ?? t("auth.placeholderWorkEmail")}
                  style={styles.input}
                  type="text"
                  value={loginForm.email}
                />
              </span>
            </label>

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
                  onChange={(event) => onLoginFormChange({ ...loginForm, password: event.target.value })}
                  placeholder={t("auth.enterPassword")}
                  style={styles.input}
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
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
            </label>

            <label style={styles.rememberRow}>
              <input
                checked={rememberMe}
                onChange={(event) => onRememberMeChange(event.target.checked)}
                style={styles.checkbox}
                type="checkbox"
              />
              <span>{t("auth.rememberMe")}</span>
            </label>

            <button style={styles.submitButton} type="submit">
              {t("auth.login")}
            </button>
          </form>

          {loginFootnote ? <p style={styles.footnote}>{loginFootnote}</p> : null}
        </>
      ) : (
        <form style={styles.form} onSubmit={onRegisterSubmit}>
          <div style={styles.headingBlock}>
            <div style={styles.iconBadge}>
              <ShieldCheck size={18} />
            </div>
            <h2 style={styles.title}>{t("auth.createTeacherAccount")}</h2>
            <p style={styles.subtitle}>{t("auth.registerSubtitle")}</p>
          </div>

          <MobileTextField
            label={t("auth.fullName")}
            value={registerForm.fullName}
            onChange={(value) => onRegisterFormChange({ ...registerForm, fullName: value })}
            placeholder={t("auth.placeholderName")}
          />
          <MobileTextField
            label={t("auth.internalEmail")}
            value={registerForm.email}
            onChange={(value) => onRegisterFormChange({ ...registerForm, email: value })}
            placeholder={t("auth.placeholderWorkEmail")}
            type="email"
          />
          <MobileTextField
            label={t("auth.department")}
            value={registerForm.department}
            onChange={(value) => onRegisterFormChange({ ...registerForm, department: value })}
            placeholder={t("auth.placeholderDepartment")}
          />
          <MobileTextField
            label={t("auth.password")}
            value={registerForm.password}
            onChange={(value) => onRegisterFormChange({ ...registerForm, password: value })}
            placeholder={t("auth.placeholderPasswordMin")}
            type="password"
          />
          <MobileTextField
            label={t("auth.confirmPassword")}
            value={registerForm.confirmPassword}
            onChange={(value) => onRegisterFormChange({ ...registerForm, confirmPassword: value })}
            placeholder={t("auth.placeholderConfirmPassword")}
            type="password"
          />

          <button style={styles.submitButton} type="submit">
            {t("auth.createAccount")}
          </button>
        </form>
      )}
    </section>
  );
}

function MobileTextField({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
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
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{ ...styles.input, paddingLeft: 0 }}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid rgba(148,163,184,0.26)",
    borderRadius: 28,
    boxShadow: "0 26px 70px -46px rgba(15,23,42,0.4)",
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
    fontWeight: 700,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  footnote: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
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
    borderRadius: 14,
    color: "var(--erg-blue, #00008b)",
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
    color: "var(--erg-blue, #00008b)",
    flex: "0 0 auto",
    fontSize: 12,
    fontWeight: 800,
    padding: 0,
  },
  input: {
    background: "transparent",
    border: 0,
    color: "#0f172a",
    flex: "1 1 auto",
    fontSize: 16,
    height: 28,
    minWidth: 0,
    outline: "none",
    width: "100%",
  },
  inputWrap: {
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    borderRadius: 18,
    boxShadow: "0 10px 26px -24px rgba(15,23,42,0.55)",
    display: "flex",
    gap: 10,
    minHeight: 56,
    padding: "0 14px",
    width: "100%",
  },
  label: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: 800,
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
    fontWeight: 700,
    gap: 10,
    lineHeight: 1.4,
  },
  segmentedActive: {
    background: "var(--erg-blue, #00008b)",
    border: 0,
    borderRadius: 14,
    color: "#ffffff",
    flex: 1,
    fontSize: 14,
    fontWeight: 800,
    height: 42,
  },
  segmentedButton: {
    background: "transparent",
    border: 0,
    borderRadius: 14,
    color: "#64748b",
    flex: 1,
    fontSize: 14,
    fontWeight: 800,
    height: 42,
  },
  segmentedControl: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
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
    background: "var(--erg-blue, #00008b)",
    border: 0,
    borderRadius: 18,
    boxShadow: "0 18px 38px -24px rgba(0,0,139,0.65)",
    color: "#ffffff",
    display: "inline-flex",
    fontSize: 16,
    fontWeight: 900,
    height: 54,
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
    fontSize: 27,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.12,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;
