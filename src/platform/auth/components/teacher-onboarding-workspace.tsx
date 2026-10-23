import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui";
import type {
  PasswordChangeResult,
  RecoveryEmailChallenge,
  RecoveryEmailVerification,
  UpdateMyTeacherProfileInput,
} from "@/platform/auth/api/account-security-api";
import type { TeacherAccountLifecycle, TeacherOnboardingStep } from "@/platform/auth/types/account-lifecycle";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

type TeacherOnboardingWorkspaceProps = {
  account: TeacherAccount;
  lifecycle: TeacherAccountLifecycle;
  onUpdateProfile: (input: Pick<UpdateMyTeacherProfileInput, "fullName" | "phone">) => Promise<TeacherAccount>;
  onRequestRecovery: (recoveryEmail: string) => Promise<RecoveryEmailChallenge>;
  onVerifyRecovery: (input: { challengeId: string; otp: string }) => Promise<RecoveryEmailVerification>;
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<PasswordChangeResult>;
  onComplete: (lifecycle: TeacherAccountLifecycle) => void;
  onLogout: () => void;
};

const stepLabels: Record<TeacherOnboardingStep, string> = {
  COMPLETE_PROFILE: "Hồ sơ & số điện thoại",
  VERIFY_RECOVERY_EMAIL: "Email khôi phục",
  CHANGE_PASSWORD: "Mật khẩu mới",
};

export function TeacherOnboardingWorkspace(props: TeacherOnboardingWorkspaceProps) {
  const [lifecycle, setLifecycle] = useState(props.lifecycle);
  const [fullName, setFullName] = useState(props.account.fullName);
  const [phone, setPhone] = useState(props.account.phone ?? "");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [challenge, setChallenge] = useState<RecoveryEmailChallenge | null>(null);
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setLifecycle(props.lifecycle), [props.lifecycle]);

  const currentStep = lifecycle.nextSteps[0];
  const activeStep = currentStep ? ["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"].indexOf(currentStep) : 3;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu bước onboarding.");
    } finally {
      setBusy(false);
    }
  }

  function applyLifecycle(nextLifecycle?: TeacherAccountLifecycle) {
    if (!nextLifecycle) throw new Error("Backend chưa trả lifecycle mới. Không thể tự đánh dấu bước đã hoàn tất.");
    setLifecycle(nextLifecycle);
    return nextLifecycle;
  }

  function saveProfile() {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
    if (!phone.trim()) errors.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^\+?[0-9][0-9 .-]{7,14}$/.test(phone.trim())) errors.phone = "Số điện thoại không hợp lệ.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void run(async () => {
      const updated = await props.onUpdateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      applyLifecycle(updated.lifecycle);
      setNotice("Đã lưu hồ sơ từ máy chủ.");
    });
  }

  function requestRecovery() {
    const normalized = recoveryEmail.trim().toLowerCase();
    const errors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) errors.recoveryEmail = "Email khôi phục không hợp lệ.";
    if (normalized === props.account.email.trim().toLowerCase()) errors.recoveryEmail = "Email khôi phục phải khác email đăng nhập.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void run(async () => {
      const nextChallenge = await props.onRequestRecovery(normalized);
      setChallenge(nextChallenge);
      setNotice(`Mã xác minh đã được gửi tới ${nextChallenge.maskedEmail}.`);
    });
  }

  function verifyRecovery() {
    if (!challenge) return;
    if (!otp.trim()) {
      setFieldErrors({ otp: "Vui lòng nhập mã xác minh." });
      return;
    }
    void run(async () => {
      const result = await props.onVerifyRecovery({ challengeId: challenge.challengeId, otp: otp.trim() });
      applyLifecycle(result.lifecycle);
      setNotice("Email khôi phục đã được xác minh.");
    });
  }

  function changePassword() {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Vui lòng nhập mật khẩu tạm thời.";
    if (newPassword.length < 12) errors.newPassword = "Mật khẩu mới cần ít nhất 12 ký tự.";
    if (newPassword === currentPassword) errors.newPassword = "Mật khẩu mới phải khác mật khẩu tạm thời.";
    if (confirmPassword !== newPassword) errors.confirmPassword = "Xác nhận mật khẩu chưa khớp.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void run(async () => {
      const result = await props.onChangePassword({ currentPassword, newPassword });
      const nextLifecycle = applyLifecycle(result.lifecycle);
      if (nextLifecycle.status === "ACTIVE" && nextLifecycle.nextSteps.length === 0) props.onComplete(nextLifecycle);
    });
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100svh", py: { xs: 3, md: 7 } }}>
      <Container maxWidth="md">
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {busy ? <LinearProgress aria-label="Đang lưu onboarding" /> : null}
          <Stack spacing={3} sx={{ p: { xs: 2.5, md: 4 } }}>
            <Box>
              <Typography color="primary" sx={{ fontWeight: 700 }} variant="overline">ERG Teacher Onboarding</Typography>
              <Typography component="h1" sx={{ fontWeight: 750 }} variant="h5">Hoàn tất bảo mật tài khoản</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                Các bước được điều khiển bởi trạng thái từ máy chủ và không thể bỏ qua.
              </Typography>
            </Box>
            <Stepper activeStep={activeStep} alternativeLabel>
              {Object.entries(stepLabels).map(([key, label]) => (
                <Step completed={!lifecycle.nextSteps.includes(key as TeacherOnboardingStep)} key={key}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success" aria-live="polite">{notice}</Alert> : null}
            {currentStep === "COMPLETE_PROFILE" ? (
              <OnboardingSection title="Bổ sung hồ sơ giáo viên" description="Xác nhận tên hiển thị và số điện thoại liên hệ.">
                <ErgTextField label="Họ và tên" value={fullName} error={Boolean(fieldErrors.fullName)} helperText={fieldErrors.fullName} onChange={(event) => setFullName(event.target.value)} />
                <ErgTextField label="Số điện thoại" value={phone} error={Boolean(fieldErrors.phone)} helperText={fieldErrors.phone} onChange={(event) => setPhone(event.target.value)} />
                <Button disabled={busy} variant="contained" onClick={saveProfile}>Lưu và tiếp tục</Button>
              </OnboardingSection>
            ) : null}
            {currentStep === "VERIFY_RECOVERY_EMAIL" ? (
              <OnboardingSection title="Xác minh email khôi phục" description="Email này dùng để khôi phục quyền truy cập khi cần.">
                <ErgTextField label="Email khôi phục" type="email" value={recoveryEmail} error={Boolean(fieldErrors.recoveryEmail)} helperText={fieldErrors.recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} />
                {challenge ? (
                  <>
                    <ErgTextField label="Mã xác minh" value={otp} error={Boolean(fieldErrors.otp)} helperText={fieldErrors.otp || `Mã hết hạn lúc ${challenge.expiresAt}`} onChange={(event) => setOtp(event.target.value)} />
                    <Button disabled={busy} variant="contained" onClick={verifyRecovery}>Xác minh</Button>
                  </>
                ) : (
                  <Button disabled={busy} variant="contained" onClick={requestRecovery}>Gửi mã xác minh</Button>
                )}
              </OnboardingSection>
            ) : null}
            {currentStep === "CHANGE_PASSWORD" ? (
              <OnboardingSection title="Đổi mật khẩu lần đầu" description="Mật khẩu mới cần tối thiểu 12 ký tự và khác mật khẩu tạm thời.">
                <ErgTextField label="Mật khẩu tạm thời" type="password" value={currentPassword} error={Boolean(fieldErrors.currentPassword)} helperText={fieldErrors.currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                <ErgTextField label="Mật khẩu mới" type="password" value={newPassword} error={Boolean(fieldErrors.newPassword)} helperText={fieldErrors.newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                <ErgTextField label="Xác nhận mật khẩu mới" type="password" value={confirmPassword} error={Boolean(fieldErrors.confirmPassword)} helperText={fieldErrors.confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                <Button disabled={busy} variant="contained" onClick={changePassword}>Hoàn tất onboarding</Button>
              </OnboardingSection>
            ) : null}
            <Button color="inherit" disabled={busy} onClick={props.onLogout}>Đăng xuất</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function OnboardingSection({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h6">{title}</Typography>
        <Typography color="text.secondary" variant="body2">{description}</Typography>
      </Box>
      {children}
    </Stack>
  );
}
