import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useForm } from "@tanstack/react-form";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { GoogleIcon } from "@/platform/auth/components/auth-icons";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

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
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth={false} slotProps={{ backdrop: { sx: { backdropFilter: "blur(2px)", bgcolor: "rgba(15,23,42,0.45)" } }, paper: { sx: { maxHeight: "92vh", maxWidth: 1024, overflow: "hidden", width: "100%" } } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1.05fr minmax(0,1fr)" }, position: "relative" }}>
        <IconButton
          aria-label="Đóng"
          size="small"
          sx={{ position: "absolute", right: 16, top: 16, zIndex: 20 }}
          onClick={() => onOpenChange(false)}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", display: { xs: "none", md: "flex" }, flexDirection: "column", overflow: "hidden", p: 4, position: "relative" }}>
          <Box sx={{ position: "relative", zIndex: 10 }}>
            <Box sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 1, color: "rgba(255,255,255,0.8)", display: "inline-flex", fontSize: 11, fontWeight: 700, gap: 1, px: 1.5, py: 1 }}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />
              Teacher Hub Access
            </Box>
            <Box component="h2" sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, m: 0, maxWidth: 448, mt: 3 }}>
              Cổng dành riêng cho giảng viên ERG.
            </Box>
            <Box component="p" sx={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.5, m: 0, maxWidth: 448, mt: 2 }}>
              Đăng nhập bằng email nội bộ hoặc Google để truy cập kho học liệu, bài giảng và không gian làm việc của giáo viên.
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, mt: 4 }}>
              {[
                "Đăng nhập thường và Google dùng cùng một phiên hệ thống.",
                "Tài khoản mới có thể đăng ký ngay trong hộp thoại này.",
                "Sau khi xác thực, bạn sẽ quay lại đúng Teacher Hub hiện tại.",
              ].map((item) => (
                <Box key={item} sx={{ alignItems: "flex-start", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 1, display: "flex", gap: 1.5, px: 2, py: 1.5 }}>
                  <Box component="span" sx={{ bgcolor: "common.white", borderRadius: "50%", flexShrink: 0, height: 10, mt: 0.5, width: 10 }} />
                  <Box component="p" sx={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.5, m: 0 }}>{item}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ bgcolor: "background.paper", maxHeight: "92vh", overflowY: "auto", p: { xs: 2, sm: 4 } }}>
          <Paper elevation={0} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", mr: 4, p: 0.5 }}>
            {[
              { mode: "login" as const, label: "Đăng nhập" },
              { mode: "register" as const, label: "Đăng ký" },
            ].map((item) => (
              <ButtonBase
                key={item.mode}
                sx={{ bgcolor: auth.mode === item.mode ? "background.paper" : "transparent", borderRadius: 1, boxShadow: auth.mode === item.mode ? 1 : 0, color: auth.mode === item.mode ? "primary.main" : "text.primary", fontSize: 14, fontWeight: 700, px: 2.5, py: 1, "&:hover": { color: "primary.main" } }}
                onClick={() => {
                  auth.setMode(item.mode);
                  auth.setNotice(null);
                }}
              >
                {item.label}
              </ButtonBase>
            ))}
          </Paper>

          <Paper elevation={1} sx={{ border: "1px solid", borderColor: "divider", mt: 4, px: 3, py: 3.5 }}>
            {auth.notice ? (
              <Alert severity={auth.notice.tone === "success" ? "success" : auth.notice.tone === "error" ? "error" : "info"} sx={{ fontSize: 14, fontWeight: 500, mb: 2.5 }}>
                {auth.notice.message}
              </Alert>
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
          </Paper>
        </Box>
      </Box>
    </Dialog>
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
      <Box sx={{ textAlign: "center" }}>
        <Box component="h2" sx={{ fontSize: 20, fontWeight: 700, m: 0 }}>Đăng nhập Teacher Hub</Box>
        <Box component="p" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.5, m: 0, mt: 1.5 }}>Sử dụng email nội bộ hoặc Google để vào cổng giảng viên.</Box>
      </Box>

      <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
        <AuthSocialButton icon={<GoogleIcon />} label="Đăng nhập với Google" onClick={() => onProviderLogin("google")} />
      </Box>

      <DividerText text="Hoặc tiếp tục với" />

      <Box component={TsForm}
        sx={{ display: "grid", gap: 2.5, mt: 3 }}
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
              <TextField fullWidth size="small"
                autoComplete="username"
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
            <ButtonBase sx={{ color: "text.secondary", fontSize: 14, fontWeight: 500, "&:hover": { color: "text.primary" } }} onClick={onForgotPassword}>
              Quên mật khẩu?
            </ButtonBase>
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

        <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(event) => onRememberMeChange(event.target.checked)} size="small" />} label="Ghi nhớ đăng nhập" sx={{ color: "text.secondary", m: 0, "& .MuiFormControlLabel-label": { fontSize: 14 } }} />

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, formSubmitting]) => (
        <Button disabled={!canSubmit || isSubmitting || formSubmitting} type="submit" variant="contained">
          {isSubmitting || formSubmitting ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
          Đăng nhập
        </Button>
          )}
        </form.Subscribe>
      </Box>

      <Box sx={{ color: "text.secondary", fontSize: 14, mt: 2.5, textAlign: "center" }}>
        Chưa có tài khoản?{" "}
        <ButtonBase sx={{ color: "text.primary", fontSize: 14, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 4 }} onClick={onSwitchToSignup}>
          Đăng ký ngay
        </ButtonBase>
      </Box>
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
      <Box component={TsForm}
        sx={{ display: "grid", gap: 2.5, mt: 3 }}
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
              <TextField fullWidth size="small"
                autoComplete="name"
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
              <TextField fullWidth size="small"
                autoComplete="email"
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
            <Button disabled={!canSubmit || isSubmitting || formSubmitting} type="submit" variant="contained">
              {isSubmitting || formSubmitting ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
              Tao tai khoan
            </Button>
          )}
        </form.Subscribe>
      </Box>

      <Box sx={{ color: "text.secondary", fontSize: 14, mt: 2.5, textAlign: "center" }}>
        Đã có tài khoản?{" "}
        <ButtonBase sx={{ color: "text.primary", fontSize: 14, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 4 }} onClick={onSwitchToLogin}>
          Đăng nhập
        </ButtonBase>
      </Box>
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
    <Box component="label" sx={{ display: "block" }}>
      <Box component="span" sx={{ alignItems: "center", color: "text.primary", display: "flex", fontSize: 14, fontWeight: 500, gap: 1.5, justifyContent: "space-between", mb: 1 }}>
        <Box component="span">{label}</Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function AuthSocialButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <Button
      fullWidth
      sx={{ height: 36 }}
      variant="outlined"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

function DividerText({ text }: { text: string }) {
  return (
    <Box sx={{ alignItems: "center", color: "text.disabled", display: "flex", fontSize: 14, gap: 1.5, mt: 3 }}>
      <Divider sx={{ flex: 1 }} />
      <Box component="span">{text}</Box>
      <Divider sx={{ flex: 1 }} />
    </Box>
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
    <Box sx={{ position: "relative" }}>
      <TextField fullWidth size="small"
        aria-invalid={invalid ? "true" : undefined}
        autoComplete={autoComplete}
        type={showPassword ? "text" : "password"}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        sx={{ "& .MuiInputBase-input": { pr: 5 } }}
      />
      <IconButton
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        size="small"
        sx={{ color: "text.disabled", height: "100%", position: "absolute", right: 0, top: 0, width: 40, "&:hover": { color: "text.secondary" } }}
        onClick={onShowPasswordToggle}
      >
        {showPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
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
