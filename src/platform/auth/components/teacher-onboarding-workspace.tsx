import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ERG_ASSETS } from "@/config/seo";
import type {
  PasswordChangeResult,
  RecoveryEmailChallenge,
  RecoveryEmailVerification,
  UpdateMyTeacherProfileInput,
} from "@/platform/auth/api/account-security-api";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";
import { describeOnboardingError, isGoogleEmail } from "@/platform/auth/components/teacher-onboarding/onboarding-helpers";
import { OnboardingStepper } from "@/platform/auth/components/teacher-onboarding/onboarding-stepper";
import { PasswordStep } from "@/platform/auth/components/teacher-onboarding/password-step";
import { ProfileStep } from "@/platform/auth/components/teacher-onboarding/profile-step";
import { RecoveryStep } from "@/platform/auth/components/teacher-onboarding/recovery-step";

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

  const isGoogleAccount = isGoogleEmail(props.account.email);

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
      setError(describeOnboardingError(caught instanceof Error ? caught.message : "Không thể lưu bước onboarding."));
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
    const targetEmail = isGoogleAccount
      ? props.account.email.trim().toLowerCase()
      : recoveryEmail.trim().toLowerCase();

    if (!isGoogleAccount) {
      const errors: Record<string, string> = {};
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
        errors.recoveryEmail = "Email khôi phục không hợp lệ.";
      }
      if (targetEmail === props.account.email.trim().toLowerCase()) {
        errors.recoveryEmail = "Email khôi phục phải khác email đăng nhập.";
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length) return;
    }

    void run(async () => {
      const nextChallenge = await props.onRequestRecovery(targetEmail);
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
    <Box
      sx={{
        background: "radial-gradient(120% 120% at 50% 0%, #F8FAFD 0%, #EEF2F7 100%)",
        color: "#1D1D1F",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100svh",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Manrope', sans-serif",
      }}
    >
      <Container maxWidth="sm" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Top Brand Header */}
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", gap: 1.75, mb: 0.5 }}>
          <Box
            alt="ERG EduRise Global"
            component="img"
            src={ERG_ASSETS.logo}
            sx={{
              height: { xs: 50, sm: 60 },
              width: { xs: 50, sm: 60 },
              objectFit: "contain",
              borderRadius: "16px",
              filter: "drop-shadow(0 6px 16px rgba(15, 23, 42, 0.1))",
            }}
          />
          <Box sx={{ textAlign: "left" }}>
            <Typography
              sx={{
                color: "#1D1D1F",
                fontSize: { xs: 19, sm: 22 },
                fontWeight: 850,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              ERG System
            </Typography>
            <Typography
              sx={{
                color: "#6E6E73",
                fontSize: { xs: 12, sm: 13 },
                fontWeight: 600,
                letterSpacing: "0.02em",
                mt: 0.25,
              }}
            >
              EduRise Global Platform
            </Typography>
          </Box>
        </Box>

        {/* Main Frosted Apple Card */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "24px",
            boxShadow: "0 24px 64px -12px rgba(15, 23, 42, 0.08), 0 3px 12px rgba(15, 23, 42, 0.02)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {busy ? (
            <LinearProgress
              aria-label="Đang lưu onboarding"
              sx={{
                bgcolor: "rgba(0, 113, 227, 0.12)",
                "& .MuiLinearProgress-bar": { bgcolor: "#0071E3" },
              }}
            />
          ) : null}

          <Stack spacing={3.5} sx={{ p: { xs: 3, sm: 4.5 } }}>
            {/* Header Titles */}
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  alignItems: "center",
                  background: "linear-gradient(135deg, rgba(0, 113, 227, 0.1) 0%, rgba(105, 108, 255, 0.08) 100%)",
                  border: "1px solid rgba(0, 113, 227, 0.15)",
                  borderRadius: "16px",
                  display: "inline-flex",
                  height: 48,
                  justifyContent: "center",
                  mb: 1.75,
                  width: 48,
                }}
              >
                <ShieldRoundedIcon sx={{ color: "#0071E3", fontSize: 26 }} />
              </Box>
              <Typography
                sx={{
                  color: "#0071E3",
                  fontSize: 11,
                  fontWeight: 750,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                ERG Teacher Onboarding
              </Typography>
              <Typography
                component="h1"
                sx={{
                  color: "#1D1D1F",
                  fontSize: { xs: 22, sm: 26 },
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  mt: 0.5,
                }}
              >
                Hoàn tất bảo mật tài khoản
              </Typography>
              <Typography
                sx={{
                  color: "#6E6E73",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  mt: 0.75,
                  maxWidth: 440,
                  mx: "auto",
                }}
              >
                Các bước được điều khiển bởi trạng thái từ máy chủ và không thể bỏ qua.
              </Typography>
            </Box>

            <OnboardingStepper activeStep={activeStep} nextSteps={lifecycle.nextSteps} />

            {/* Notifications */}
            {error ? (
              <Alert
                severity="error"
                sx={{
                  borderRadius: "14px",
                  fontSize: 13,
                  fontWeight: 550,
                  bgcolor: "rgba(255, 59, 48, 0.08)",
                  border: "1px solid rgba(255, 59, 48, 0.2)",
                  color: "#D70015",
                }}
              >
                {error}
              </Alert>
            ) : null}

            {notice ? (
              <Alert
                severity="success"
                aria-live="polite"
                sx={{
                  borderRadius: "14px",
                  fontSize: 13,
                  fontWeight: 550,
                  bgcolor: "rgba(52, 199, 89, 0.08)",
                  border: "1px solid rgba(52, 199, 89, 0.2)",
                  color: "#248A3D",
                }}
              >
                {notice}
              </Alert>
            ) : null}

            {/* Step 1: Complete Profile */}
            {currentStep === "COMPLETE_PROFILE" ? (
              <ProfileStep
                busy={busy}
                fieldErrors={fieldErrors}
                fullName={fullName}
                phone={phone}
                saveProfile={saveProfile}
                setFullName={setFullName}
                setPhone={setPhone}
              />
            ) : null}

            {/* Step 2: Verify Recovery Email */}
            {currentStep === "VERIFY_RECOVERY_EMAIL" ? (
              <RecoveryStep
                accountEmail={props.account.email}
                busy={busy}
                challenge={challenge}
                fieldErrors={fieldErrors}
                isGoogleAccount={isGoogleAccount}
                otp={otp}
                recoveryEmail={recoveryEmail}
                requestRecovery={requestRecovery}
                setOtp={setOtp}
                setRecoveryEmail={setRecoveryEmail}
                verifyRecovery={verifyRecovery}
              />
            ) : null}

            {/* Step 3: Change Password */}
            {currentStep === "CHANGE_PASSWORD" ? (
              <PasswordStep
                busy={busy}
                changePassword={changePassword}
                confirmPassword={confirmPassword}
                currentPassword={currentPassword}
                fieldErrors={fieldErrors}
                newPassword={newPassword}
                setConfirmPassword={setConfirmPassword}
                setCurrentPassword={setCurrentPassword}
                setNewPassword={setNewPassword}
              />
            ) : null}

            {/* Logout Button */}
            <Button variant="contained"
              color="inherit"
              disabled={busy}
              onClick={props.onLogout}
              startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "14px",
                color: "#6E6E73",
                fontSize: 13.5,
                fontWeight: 600,
                minHeight: 42,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  color: "#1D1D1F",
                },
              }}
            >
              Đăng xuất
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
