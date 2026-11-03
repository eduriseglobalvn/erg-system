import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { ERG_ASSETS } from "@/config/seo";
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

// Apple-style connector between stepper nodes
const AppleStepConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 18,
    left: "calc(-50% + 20px)",
    right: "calc(50% + 20px)",
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderTopWidth: 2,
    borderRadius: 1,
    transition: "border-color 300ms ease",
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: "#34C759",
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    borderColor: "#0071E3",
  },
}));

function AppleStepIcon(props: StepIconProps) {
  const { active, completed, icon } = props;

  if (completed) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "#34C759",
          borderRadius: "50%",
          color: "#FFFFFF",
          display: "flex",
          height: 36,
          justifyContent: "center",
          width: 36,
          boxShadow: "0 2px 8px rgba(52, 199, 89, 0.3)",
          zIndex: 1,
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
      </Box>
    );
  }

  if (active) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "#0071E3",
          borderRadius: "50%",
          color: "#FFFFFF",
          display: "flex",
          fontWeight: 700,
          fontSize: 14,
          height: 36,
          justifyContent: "center",
          width: 36,
          boxShadow: "0 0 0 4px rgba(0, 113, 227, 0.18), 0 4px 12px rgba(0, 113, 227, 0.3)",
          zIndex: 1,
        }}
      >
        {icon}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "#F2F2F7",
        border: "1.5px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "50%",
        color: "#8E8E93",
        display: "flex",
        fontWeight: 650,
        fontSize: 13,
        height: 36,
        justifyContent: "center",
        width: 36,
        zIndex: 1,
      }}
    >
      {icon}
    </Box>
  );
}

function formatExpiryTime(isoString?: string | null) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isGoogleEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com");
}

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
      const rawMsg = caught instanceof Error ? caught.message : "Không thể lưu bước onboarding.";
      if (rawMsg.includes("502") || rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError")) {
        setError("Không thể kết nối đến máy chủ (502). Vui lòng đảm bảo server backend đang chạy và thử lại.");
      } else if (rawMsg.includes("conflicts with existing data") || rawMsg.includes("already used by another")) {
        setError("Email này đã được liên kết với một tài khoản khác. Vui lòng kiểm tra lại.");
      } else if (rawMsg.includes("recovery email must differ")) {
        setError("Email khôi phục phải khác với email đăng nhập chính.");
      } else if (rawMsg.includes("wait before requesting another")) {
        setError("Vui lòng đợi ít giây trước khi yêu cầu gửi lại mã xác minh mới.");
      } else if (rawMsg.includes("invalid verification code")) {
        setError("Mã xác minh OTP không chính xác. Vui lòng kiểm tra lại.");
      } else if (rawMsg.includes("verification code has expired")) {
        setError("Mã xác minh OTP đã hết hạn. Vui lòng bấm gửi lại mã mới.");
      } else {
        setError(rawMsg);
      }
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

            {/* Stepper with Apple styling */}
            <Box
              sx={{
                bgcolor: "rgba(245, 245, 247, 0.8)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                borderRadius: "18px",
                p: { xs: 1.5, sm: 2.25 },
              }}
            >
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                connector={<AppleStepConnector />}
              >
                {Object.entries(stepLabels).map(([key, label]) => (
                  <Step completed={!lifecycle.nextSteps.includes(key as TeacherOnboardingStep)} key={key}>
                    <StepLabel
                      slots={{ stepIcon: AppleStepIcon }}
                      sx={{
                        "& .MuiStepLabel-label": {
                          color: "#6E6E73",
                          fontSize: 12,
                          fontWeight: 650,
                          mt: 1,
                          "&.Mui-active": {
                            color: "#0071E3",
                            fontWeight: 750,
                          },
                          "&.Mui-completed": {
                            color: "#1D1D1F",
                            fontWeight: 650,
                          },
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

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
              <OnboardingSection
                icon={<PersonOutlineRoundedIcon sx={{ fontSize: 20, color: "#0071E3" }} />}
                title="Bổ sung hồ sơ giáo viên"
                description="Xác nhận tên hiển thị và số điện thoại liên hệ."
              >
                <ErgTextField
                  label="Họ và tên"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={fullName}
                  error={Boolean(fieldErrors.fullName)}
                  helperText={fieldErrors.fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
                <ErgTextField
                  label="Số điện thoại"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={phone}
                  error={Boolean(fieldErrors.phone)}
                  helperText={fieldErrors.phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                />
                <Button
                  disabled={busy}
                  variant="contained"
                  onClick={saveProfile}
                  sx={{
                    bgcolor: "#0071E3",
                    borderRadius: "14px",
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 650,
                    minHeight: 48,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(0, 113, 227, 0.25)",
                    transition: "all 180ms ease",
                    "&:hover": {
                      bgcolor: "#0077ED",
                      boxShadow: "0 6px 18px rgba(0, 113, 227, 0.35)",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                  }}
                >
                  {busy ? <CircularProgress size={20} sx={{ color: "#FFF", mr: 1 }} /> : null}
                  Lưu và tiếp tục
                </Button>
              </OnboardingSection>
            ) : null}

            {/* Step 2: Verify Recovery Email */}
            {currentStep === "VERIFY_RECOVERY_EMAIL" ? (
              <OnboardingSection
                icon={<MarkEmailReadRoundedIcon sx={{ fontSize: 20, color: "#0071E3" }} />}
                title={isGoogleAccount ? "Xác minh tài khoản Google" : "Xác minh email khôi phục"}
                description={
                  isGoogleAccount
                    ? `Tài khoản sử dụng email Google (${props.account.email}). Vui lòng nhận và nhập mã xác minh OTP để kích hoạt tài khoản.`
                    : "Email này dùng để khôi phục quyền truy cập khi cần."
                }
              >
                {isGoogleAccount ? (
                  <Paper
                    sx={{
                      alignItems: "center",
                      bgcolor: "rgba(0, 113, 227, 0.05)",
                      border: "1px solid rgba(0, 113, 227, 0.16)",
                      borderRadius: "16px",
                      display: "flex",
                      gap: 1.75,
                      p: 2,
                    }}
                    variant="outlined"
                  >
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: "rgba(0, 113, 227, 0.12)",
                        borderRadius: "12px",
                        color: "#0071E3",
                        display: "flex",
                        height: 42,
                        justifyContent: "center",
                        width: 42,
                      }}
                    >
                      <MarkEmailReadRoundedIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: "#6E6E73", fontSize: 11.5, fontWeight: 650 }}>
                        Email Google chính chủ
                      </Typography>
                      <Typography
                        sx={{
                          color: "#1D1D1F",
                          fontSize: 14,
                          fontWeight: 750,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {props.account.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={challenge ? "Đã gửi mã" : "Cần xác minh"}
                      size="small"
                      sx={{
                        bgcolor: challenge ? "rgba(52, 199, 89, 0.12)" : "rgba(0, 113, 227, 0.1)",
                        color: challenge ? "#248A3D" : "#0071E3",
                        fontWeight: 700,
                        fontSize: 11.5,
                        height: 26,
                        ml: "auto",
                        borderRadius: "980px",
                      }}
                    />
                  </Paper>
                ) : (
                  <ErgTextField
                    label="Email khôi phục"
                    type="email"
                    value={recoveryEmail}
                    error={Boolean(fieldErrors.recoveryEmail)}
                    helperText={fieldErrors.recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    placeholder="email.phu@gmail.com"
                  />
                )}

                {challenge ? (
                  <>
                    <ErgTextField
                      id="onboarding-otp-input"
                      label="Mã xác minh"
                      value={otp}
                      error={Boolean(fieldErrors.otp)}
                      helperText={
                        fieldErrors.otp ||
                        (challenge.expiresAt && formatExpiryTime(challenge.expiresAt)
                          ? `Mã gồm 6 chữ số, có hiệu lực đến ${formatExpiryTime(challenge.expiresAt)}`
                          : "Nhập mã xác minh gồm 6 chữ số")
                      }
                      onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(val);
                      }}
                      placeholder="123456"
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          maxLength: 6,
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          autoComplete: "one-time-code",
                          style: {
                            textAlign: "center",
                            fontSize: "22px",
                            letterSpacing: "0.28em",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', 'SF Pro Text', monospace",
                          },
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 54,
                          bgcolor: "#FFFFFF",
                          borderRadius: "14px",
                        },
                        "& .MuiFormHelperText-root": {
                          fontSize: 12,
                          fontWeight: 500,
                          mt: 0.75,
                          textAlign: "center",
                          color: fieldErrors.otp ? "#D70015" : "#6E6E73",
                        },
                      }}
                    />
                    <Button
                      disabled={busy}
                      variant="contained"
                      onClick={verifyRecovery}
                      sx={{
                        bgcolor: "#0071E3",
                        borderRadius: "14px",
                        color: "#FFFFFF",
                        fontSize: 15,
                        fontWeight: 650,
                        minHeight: 48,
                        textTransform: "none",
                        boxShadow: "0 4px 14px rgba(0, 113, 227, 0.25)",
                        "&:hover": {
                          bgcolor: "#0077ED",
                          transform: "translateY(-1px)",
                        },
                        "&:active": {
                          transform: "scale(0.98)",
                        },
                      }}
                    >
                      {busy ? <CircularProgress size={20} sx={{ color: "#FFF", mr: 1 }} /> : null}
                      Xác minh
                    </Button>
                    <Button
                      color="inherit"
                      disabled={busy}
                      onClick={requestRecovery}
                      sx={{
                        color: "#0071E3",
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: "none",
                        borderRadius: "980px",
                        alignSelf: "center",
                        "&:hover": { bgcolor: "rgba(0, 113, 227, 0.06)" },
                      }}
                    >
                      Chưa nhận được mã? Gửi lại mã
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled={busy}
                    variant="contained"
                    onClick={requestRecovery}
                    sx={{
                      bgcolor: "#0071E3",
                      borderRadius: "14px",
                      color: "#FFFFFF",
                      fontSize: 15,
                      fontWeight: 650,
                      minHeight: 48,
                      textTransform: "none",
                      boxShadow: "0 4px 14px rgba(0, 113, 227, 0.25)",
                      "&:hover": {
                        bgcolor: "#0077ED",
                        transform: "translateY(-1px)",
                      },
                      "&:active": {
                        transform: "scale(0.98)",
                      },
                    }}
                  >
                    {busy ? <CircularProgress size={20} sx={{ color: "#FFF", mr: 1 }} /> : null}
                    Gửi mã xác minh
                  </Button>
                )}
              </OnboardingSection>
            ) : null}

            {/* Step 3: Change Password */}
            {currentStep === "CHANGE_PASSWORD" ? (
              <OnboardingSection
                icon={<LockResetRoundedIcon sx={{ fontSize: 20, color: "#0071E3" }} />}
                title="Đổi mật khẩu lần đầu"
                description="Mật khẩu mới cần tối thiểu 12 ký tự và khác mật khẩu tạm thời."
              >
                <ErgTextField
                  label="Mật khẩu tạm thời"
                  slotProps={{ inputLabel: { shrink: true } }}
                  type="password"
                  value={currentPassword}
                  error={Boolean(fieldErrors.currentPassword)}
                  helperText={fieldErrors.currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Nhập mật khẩu được gửi qua mail"
                />
                <ErgTextField
                  label="Mật khẩu mới"
                  slotProps={{ inputLabel: { shrink: true } }}
                  type="password"
                  value={newPassword}
                  error={Boolean(fieldErrors.newPassword)}
                  helperText={fieldErrors.newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Tối thiểu 12 ký tự"
                />
                <ErgTextField
                  label="Xác nhận mật khẩu mới"
                  slotProps={{ inputLabel: { shrink: true } }}
                  type="password"
                  value={confirmPassword}
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <Button
                  disabled={busy}
                  variant="contained"
                  onClick={changePassword}
                  sx={{
                    bgcolor: "#0071E3",
                    borderRadius: "14px",
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 650,
                    minHeight: 48,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(0, 113, 227, 0.25)",
                    "&:hover": {
                      bgcolor: "#0077ED",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                  }}
                >
                  {busy ? <CircularProgress size={20} sx={{ color: "#FFF", mr: 1 }} /> : null}
                  Hoàn tất onboarding
                </Button>
              </OnboardingSection>
            ) : null}

            {/* Logout Button */}
            <Button
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

function OnboardingSection({
  children,
  description,
  icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <Stack spacing={2.25}>
      <Box sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)", pb: 1.5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          {icon}
          <Typography component="h2" sx={{ color: "#1D1D1F", fontSize: 17, fontWeight: 750 }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ color: "#6E6E73", fontSize: 13, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      {children}
    </Stack>
  );
}
