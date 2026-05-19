import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, Sparkles, X } from "lucide-react";

import { GoogleIcon } from "@/features/auth/components/auth-icons";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
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
        className="relative grid max-h-[92vh] w-full max-w-[1024px] overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_30px_90px_-28px_rgba(15,23,42,0.45)] md:grid-cols-[1.05fr_minmax(0,1fr)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Đóng"
          className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          type="button"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_36%),linear-gradient(145deg,#00008b_0%,#1d4ed8_45%,#cc0022_100%)] p-10 text-white md:flex md:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.18)_100%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher Hub Access
            </div>
            <h2 className="mt-8 max-w-md text-4xl font-black leading-tight">
              Cổng dành riêng cho giảng viên ERG.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
              Đăng nhập bằng email nội bộ hoặc Google để truy cập kho học liệu, bài giảng và không gian làm việc của giáo viên.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Đăng nhập thường và Google dùng cùng một phiên hệ thống.",
                "Tài khoản mới có thể đăng ký ngay trong hộp thoại này.",
                "Sau khi xác thực, bạn sẽ quay lại đúng Teacher Hub hiện tại.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-white" />
                  <p className="text-sm leading-6 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[92vh] overflow-y-auto bg-white p-4 sm:p-8">
          <div className="mr-8 grid grid-cols-2 rounded-full bg-slate-100 p-1">
            {[
              { mode: "login" as const, label: "Đăng nhập" },
              { mode: "register" as const, label: "Đăng ký" },
            ].map((item) => (
              <button
                key={item.mode}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-bold transition",
                  auth.mode === item.mode
                    ? "bg-white text-[#00008b] shadow-[0_1px_4px_rgba(15,23,42,0.16)]"
                    : "text-slate-950 hover:text-[#00008b]",
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

          <div className="mt-8 rounded-[16px] border border-slate-200 bg-white px-6 py-7 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.35)]">
            {auth.notice ? (
              <div
                className={cn(
                  "mb-5 rounded-xl border px-4 py-3 text-sm font-medium",
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
  return (
    <>
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Đăng nhập Teacher Hub</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Sử dụng email nội bộ hoặc Google để vào cổng giảng viên.</p>
      </div>

      <div className="mt-6 space-y-4">
        <AuthSocialButton icon={<GoogleIcon />} label="Đăng nhập với Google" onClick={() => onProviderLogin("google")} />
      </div>

      <DividerText text="Hoặc tiếp tục với" />

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <AuthField label="Email">
          <input
            autoComplete="username"
            className={authInputClassName}
            placeholder="m@example.com"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </AuthField>

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
            value={password}
            onChange={onPasswordChange}
            onShowPasswordToggle={onShowPasswordToggle}
          />
        </AuthField>

        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
          <input
            checked={rememberMe}
            className="h-4 w-4 rounded border-slate-300 accent-[#00008b]"
            type="checkbox"
            onChange={(event) => onRememberMeChange(event.target.checked)}
          />
          Ghi nhớ đăng nhập
        </label>

        <button className={authSubmitClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Đăng nhập
        </button>
      </form>

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
  return (
    <>
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Đăng ký tài khoản giảng viên</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Tạo tài khoản mới để truy cập kho học liệu và công cụ nội bộ.</p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <AuthField label="Họ và tên">
          <input
            autoComplete="name"
            className={authInputClassName}
            placeholder="Nguyễn Văn A"
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
          />
        </AuthField>

        <AuthField label="Email">
          <input
            autoComplete="email"
            className={authInputClassName}
            placeholder="m@example.com"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </AuthField>

        <AuthField label="Mật khẩu">
          <PasswordInput
            autoComplete="new-password"
            showPassword={showPassword}
            value={password}
            onChange={onPasswordChange}
            onShowPasswordToggle={onShowPasswordToggle}
          />
        </AuthField>

        <AuthField label="Xác nhận mật khẩu">
          <PasswordInput
            autoComplete="new-password"
            showPassword={showConfirmPassword}
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            onShowPasswordToggle={onShowConfirmPasswordToggle}
          />
        </AuthField>

        <button className={authSubmitClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Tạo tài khoản
        </button>
      </form>

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
  showPassword,
  value,
  onChange,
  onShowPasswordToggle,
}: {
  autoComplete: string;
  showPassword: boolean;
  value: string;
  onChange: (value: string) => void;
  onShowPasswordToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        autoComplete={autoComplete}
        className={cn(authInputClassName, "pr-10")}
        type={showPassword ? "text" : "password"}
        value={value}
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

const authInputClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100";

const authSubmitClassName =
  "inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#00008b] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(0,0,139,0.45)] transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70";
