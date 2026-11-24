import { useState } from "react";
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
import type { PasswordChangeResult } from "@/platform/auth/api/account-security-api";
import { requiresTeacherOnboarding, type TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import { describeOnboardingError } from "@/platform/auth/components/teacher-onboarding/onboarding-helpers";
import { EmailStep, type EmailStepProps } from "@/platform/auth/components/teacher-onboarding/email-step";
import { PasswordStep } from "@/platform/auth/components/teacher-onboarding/password-step";
import { passwordPolicyError } from "@/platform/auth/password-policy";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type TeacherOnboardingWorkspaceProps = {
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<PasswordChangeResult>;
  onComplete: (lifecycle: TeacherAccountLifecycle) => void;
  onLogout: () => void;
  /** Present while the account still has to verify an email; the password step shows once it is done. */
  emailStep?: Omit<EmailStepProps, "onVerified">;
};

export function TeacherOnboardingWorkspace(props: TeacherOnboardingWorkspaceProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailVerified, setEmailVerified] = useState(!props.emailStep);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(describeOnboardingError(caught instanceof Error ? caught.message : "Không thể lưu bước onboarding."));
    } finally {
      setBusy(false);
    }
  }

  function changePassword() {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Vui lòng nhập mật khẩu tạm thời.";
    const policyError = passwordPolicyError(newPassword);
    if (policyError) errors.newPassword = policyError;
    if (newPassword === currentPassword) errors.newPassword = "Mật khẩu mới phải khác mật khẩu tạm thời.";
    if (confirmPassword !== newPassword) errors.confirmPassword = "Xác nhận mật khẩu chưa khớp.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void run(async () => {
      const result = await props.onChangePassword({ currentPassword, newPassword });
      if (!result.lifecycle) throw new Error("Backend chưa trả lifecycle mới. Không thể tự đánh dấu bước đã hoàn tất.");
      if (!requiresTeacherOnboarding(result.lifecycle)) props.onComplete(result.lifecycle);
    });
  }

  return (
    <Box
      sx={{
        background: "radial-gradient(120% 120% at 50% 0%, #F8FAFD 0%, #EEF2F7 100%)",
        color: "text.primary",
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
                color: "text.primary",
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
                color: "text.secondary",
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
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
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
                bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.12),
                "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
              }}
            />
          ) : null}

          <Stack spacing={3.5} sx={{ p: { xs: 3, sm: 4.5 } }}>
            {/* Header Titles */}
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  alignItems: "center",
                  background: `linear-gradient(135deg, ${alpha(ergEnterpriseTokens.color.primary, 0.1)} 0%, rgba(105, 108, 255, 0.08) 100%)`,
                  border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
                  borderRadius: "16px",
                  display: "inline-flex",
                  height: 48,
                  justifyContent: "center",
                  mb: 1.75,
                  width: 48,
                }}
              >
                <ShieldRoundedIcon sx={{ color: "primary.main", fontSize: 26 }} />
              </Box>
              <Typography
                sx={{
                  color: "primary.main",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Thiết lập tài khoản ERG
              </Typography>
              <Typography
                component="h1"
                sx={{
                  color: "text.primary",
                  fontSize: { xs: 22, sm: 26 },
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  mt: 0.5,
                }}
              >
                Hoàn tất bảo mật tài khoản
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  mt: 0.75,
                  maxWidth: 440,
                  mx: "auto",
                }}
              >
                {emailVerified ? "Đặt mật khẩu mới để bắt đầu sử dụng." : "Bước 1/2: xác thực email, sau đó đặt mật khẩu mới."}
              </Typography>
            </Box>

            {/* Notifications */}
            {error ? (
              <Alert
                severity="error"
                sx={{
                  borderRadius: "14px",
                  fontSize: 13,
                  fontWeight: 550,
                  bgcolor: alpha(ergEnterpriseTokens.color.danger, 0.08),
                  border: `1px solid ${alpha(ergEnterpriseTokens.color.danger, 0.2)}`,
                  color: "error.main",
                }}
              >
                {error}
              </Alert>
            ) : null}

            {!emailVerified && props.emailStep ? (
              <EmailStep {...props.emailStep} onVerified={() => setEmailVerified(true)} />
            ) : (
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
            )}

            {/* Logout Button */}
            <Button variant="text"
              color="inherit"
              disabled={busy}
              onClick={props.onLogout}
              startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "14px",
                color: "text.secondary",
                fontSize: 13.5,
                fontWeight: 600,
                minHeight: 42,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  color: "text.primary",
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
