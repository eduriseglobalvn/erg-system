import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, Sparkles, X } from "lucide-react";
import { useForm } from "@tanstack/react-form";

import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { GoogleIcon } from "@/platform/auth/components/auth-icons";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { cn } from "@/lib/utils";

type TeacherAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated?: () => void;
};

export function TeacherAuthDialog({ open, onOpenChange, onAuthenticated }: TeacherAuthDialogProps) {
  const auth = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  async function runAuth(action: () => unknown | Promise<unknown>) {
    setIsSubmitting(true);
    try {
      await action();
      onOpenChange(false);
      onAuthenticated?.();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Không thể xác thực tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAuth(auth.actions.login);
  }

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAuth(auth.actions.register);
  }

  function updateRegisterForm(field: keyof typeof auth.registerForm, value: string) {
    auth.setRegisterForm({
      ...auth.registerForm,
      department: auth.registerForm.department || "Teacher Hub",
      [field]: value,
    });
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[260] grid place-items-center bg-slate-950/45 px-3 py-6 backdrop-blur-[2px]"
      role="dialog"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className="relative grid max-h-[92vh] w-full max-w-[1024px] overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm md:grid-cols-[1.05fr_minmax(0,1fr)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Đóng"
          className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          type="button"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative hidden overflow-hidden bg-[var(--erg-blue)] p-8 text-white md:flex md:flex-col">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher Hub Access
            </div>
            <h2 className="mt-6 max-w-md text-xl font-semibold leading-tight">
              Cổng dành riêng cho giảng viên ERG.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
              Đăng nhập bằng email nội bộ hoặc Google để truy cập kho học liệu, bài giảng và không gian làm việc của giáo viên.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Đăng nhập thường và Google dùng cùng một phiên hệ thống.",
                "Tài khoản mới có thể đăng ký ngay trong hộp thoại này.",
                "Sau khi xác thực, bạn sẽ quay lại đúng Teacher Hub hiện tại.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-white" />
                  <p className="text-sm leading-6 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[92vh] overflow-y-auto bg-white p-4 sm:p-8">
          <div className="mr-8 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { mode: "login" as const, label: "Đăng nhập" },
              { mode: "register" as const, label: "Đăng ký" },
            ].map((item) => (
              <button
                key={item.mode}
                className={cn(
                  "rounded-md px-5 py-2 text-sm font-semibold transition",
                  auth.mode === item.mode
                    ? "bg-white text-[var(--erg-blue)] shadow-sm"
                    : "text-slate-950 hover:text-[var(--erg-blue)]",
                )}
                type="button"
                onClick={() => {
                  auth.setMode(item.mode);
                  auth.setNotice(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white px-6 py-7 shadow-sm">
            {auth.notice ? (
              <div
                className={cn(
                  "mb-5 rounded-lg border px-4 py-3 text-sm font-medium",
                  auth.notice.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : auth.notice.tone === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
                )}
              >
                {auth.notice.message}
              </div>
            ) : null}

            {auth.mode === "login" ? (
              <TeacherLoginForm
                email={auth.loginForm.email}
                password={auth.loginForm.password}
                rememberMe={auth.rememberMe}
                showPassword={auth.showPassword}
                isSubmitting={isSubmitting}
                onEmailChange={(email) => auth.setLoginForm({ ...auth.loginForm, email })}
                onPasswordChange={(password) => auth.setLoginForm({ ...auth.loginForm, password })}
                onRememberMeChange={auth.setRememberMe}
                onShowPasswordToggle={() => auth.setShowPassword((current) => !current)}
                onForgotPassword={auth.actions.forgotPassword}
                onProviderLogin={(provider) => void runAuth(() => auth.actions.loginByProvider(provider))}
                onSubmit={handleLoginSubmit}
                onSwitchToSignup={() => auth.setMode("register")}
              />
            ) : (
              <TeacherRegisterForm
                fullName={auth.registerForm.fullName}
                email={auth.registerForm.email}
                password={auth.registerForm.password}
                confirmPassword={auth.registerForm.confirmPassword}
                showPassword={showRegisterPassword}
                showConfirmPassword={showConfirmPassword}
                isSubmitting={isSubmitting}
                onFullNameChange={(fullName) => updateRegisterForm("fullName", fullName)}
                onEmailChange={(email) => updateRegisterForm("email", email)}
                onPasswordChange={(password) => updateRegisterForm("password", password)}
                onConfirmPasswordChange={(confirmPassword) => updateRegisterForm("confirmPassword", confirmPassword)}
                onShowPasswordToggle={() => setShowRegisterPassword((current) => !current)}
                onShowConfirmPasswordToggle={() => setShowConfirmPassword((current) => !current)}
                onSubmit={handleRegisterSubmit}
                onSwitchToLogin={() => auth.setMode("login")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherLoginForm({
  email,
  password,
  rememberMe,
  showPassword,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onShowPasswordToggle,
  onForgotPassword,
  onProviderLogin,
  onSubmit,
  onSwitchToSignup,
}: {
  email: string;
  password: string;
  rememberMe: boolean;
  showPassword: boolean;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onRememberMeChange: (rememberMe: boolean) => void;
  onShowPasswordToggle: () => void;
  onForgotPassword: () => void;
  onProviderLogin: (provider: "google") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSwitchToSignup: () => void;
}) {
  const form = useForm({
    defaultValues: { email, password },
    onSubmit: () => onSubmit(createHandledSubmitEvent()),
  });

  return (
    <>
      <div className="text-center">
        <h2 className="text-xl font-semibold  text-slate-950">Đăng nhập Teacher Hub</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Sử dụng email nội bộ hoặc Google để vào cổng giảng viên.</p>
      </div>

      <div className="mt-6 space-y-4">
        <AuthSocialButton icon={<GoogleIcon />} label="Đăng nhập với Google" onClick={() => onProviderLogin("google")} />
      </div>

      <DividerText text="Hoặc tiếp tục với" />

      <TsForm
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => validateEmail(value),
          }}
        >
          {(field) => (
            <AuthField label="Email">
              <input
                autoComplete="username"
                className={authInputClassName}
                placeholder="m@example.com"
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  onEmailChange(event.target.value);
                }}
                aria-invalid={field.state.meta.errors.length ? "true" : undefined}
              />
              <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
            </AuthField>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => validatePassword(value),
          }}
        >
          {(field) => (
        <AuthField
          label="Mật khẩu"
          action={
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900" type="button" onClick={onForgotPassword}>
              Quên mật khẩu?
            </button>
          }
        >
          <PasswordInput
            autoComplete="current-password"
            showPassword={showPassword}
            value={field.state.value}
            invalid={field.state.meta.errors.length > 0}
            onBlur={field.handleBlur}
            onChange={(value) => {
              field.handleChange(value);
              onPasswordChange(value);
            }}
            onShowPasswordToggle={onShowPasswordToggle}
          />
          <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
        </AuthField>
          )}
        </form.Field>

        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
          <input
            checked={rememberMe}
            className="h-4 w-4 rounded border-slate-300 accent-[var(--erg-blue)]"
            type="checkbox"
            onChange={(event) => onRememberMeChange(event.target.checked)}
          />
          Ghi nhớ đăng nhập
        </label>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, formSubmitting]) => (
        <button className={authSubmitClassName} disabled={!canSubmit || isSubmitting || formSubmitting} type="submit">
          {isSubmitting || formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Đăng nhập
        </button>
          )}
        </form.Subscribe>
      </TsForm>

      <div className="mt-5 text-center text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <button className="font-semibold text-slate-900 underline underline-offset-4" type="button" onClick={onSwitchToSignup}>
          Đăng ký ngay
        </button>
      </div>
    </>
  );
}

function TeacherRegisterForm({
  fullName,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  isSubmitting,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  onSubmit,
  onSwitchToLogin,
}: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
  onFullNameChange: (fullName: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSwitchToLogin: () => void;
}) {
  const form = useForm({
    defaultValues: { fullName, email, password, confirmPassword },
    onSubmit: () => onSubmit(createHandledSubmitEvent()),
  });

  return (
    <>
      <TsForm
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="fullName"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : "Ho ten la bat buoc."),
          }}
        >
          {(field) => (
            <AuthField label="Ho va ten">
              <input
                autoComplete="name"
                className={authInputClassName}
                placeholder="Nguyen Van A"
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  onFullNameChange(event.target.value);
                }}
                aria-invalid={field.state.meta.errors.length ? "true" : undefined}
              />
              <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
            </AuthField>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => validateEmail(value),
          }}
        >
          {(field) => (
            <AuthField label="Email">
              <input
                autoComplete="email"
                className={authInputClassName}
                placeholder="m@example.com"
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  onEmailChange(event.target.value);
                }}
                aria-invalid={field.state.meta.errors.length ? "true" : undefined}
              />
              <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
            </AuthField>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => validatePassword(value),
          }}
        >
          {(field) => (
            <AuthField label="Mat khau">
              <PasswordInput
                autoComplete="new-password"
                showPassword={showPassword}
                value={field.state.value}
                invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onPasswordChange(value);
                }}
                onShowPasswordToggle={onShowPasswordToggle}
              />
              <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
            </AuthField>
          )}
        </form.Field>

        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ["password"],
            onChange: ({ fieldApi, value }) =>
              value === fieldApi.form.getFieldValue("password") ? undefined : "Mat khau xac nhan chua khop.",
          }}
        >
          {(field) => (
            <AuthField label="Xac nhan mat khau">
              <PasswordInput
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                value={field.state.value}
                invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                  onConfirmPasswordChange(value);
                }}
                onShowPasswordToggle={onShowConfirmPasswordToggle}
              />
              <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
            </AuthField>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, formSubmitting]) => (
            <button className={authSubmitClassName} disabled={!canSubmit || isSubmitting || formSubmitting} type="submit">
              {isSubmitting || formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tao tai khoan
            </button>
          )}
        </form.Subscribe>
      </TsForm>

      <div className="mt-5 text-center text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <button className="font-semibold text-slate-900 underline underline-offset-4" type="button" onClick={onSwitchToLogin}>
          Đăng nhập
        </button>
      </div>
    </>
  );
}

function AuthField({
  action,
  children,
  label,
}: {
  action?: ReactNode;
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-800">
        <span>{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}

function AuthSocialButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex h-9 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function DividerText({ text }: { text: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
      <div className="h-px flex-1 bg-slate-200" />
      <span>{text}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function PasswordInput({
  autoComplete,
  invalid,
  onBlur,
  showPassword,
  value,
  onChange,
  onShowPasswordToggle,
}: {
  autoComplete: string;
  invalid?: boolean;
  onBlur?: () => void;
  showPassword: boolean;
  value: string;
  onChange: (value: string) => void;
  onShowPasswordToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        aria-invalid={invalid ? "true" : undefined}
        autoComplete={autoComplete}
        className={cn(authInputClassName, "pr-10")}
        type={showPassword ? "text" : "password"}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400 transition hover:text-slate-700"
        type="button"
        onClick={onShowPasswordToggle}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function createHandledSubmitEvent() {
  return {
    preventDefault() {},
    stopPropagation() {},
  } as FormEvent<HTMLFormElement>;
}

function validateEmail(value: string) {
  if (!value.trim()) return "Email là bắt buộc.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Email không hợp lệ.";
}

function validatePassword(value: string) {
  if (!value) return "Mật khẩu là bắt buộc.";
  return value.length >= 6 ? undefined : "Mật khẩu tối thiểu 6 ký tự.";
}

const authInputClassName =
  "h-9 w-full rounded-md border border-[#d7e0ec] bg-white px-3 text-sm text-[#242424] outline-none transition placeholder:text-[#707070] focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]";

const authSubmitClassName =
  "inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--erg-blue)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--erg-blue-hover)] disabled:cursor-not-allowed disabled:opacity-70";
