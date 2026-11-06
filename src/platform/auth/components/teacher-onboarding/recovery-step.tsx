import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui";
import type { RecoveryEmailChallenge } from "@/platform/auth/api/account-security-api";
import { formatExpiryTime } from "@/platform/auth/components/teacher-onboarding/onboarding-helpers";
import { OnboardingSection } from "@/platform/auth/components/teacher-onboarding/onboarding-section";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function RecoveryStep({
  accountEmail,
  busy,
  challenge,
  fieldErrors,
  isGoogleAccount,
  otp,
  recoveryEmail,
  requestRecovery,
  setOtp,
  setRecoveryEmail,
  verifyRecovery,
}: {
  accountEmail: string;
  busy: boolean;
  challenge: RecoveryEmailChallenge | null;
  fieldErrors: Record<string, string>;
  isGoogleAccount: boolean;
  otp: string;
  recoveryEmail: string;
  requestRecovery: () => void;
  setOtp: (value: string) => void;
  setRecoveryEmail: (value: string) => void;
  verifyRecovery: () => void;
}) {
  return (
    <OnboardingSection
      icon={<MarkEmailReadRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />}
      title={isGoogleAccount ? "Xác minh tài khoản Google" : "Xác minh email khôi phục"}
      description={
        isGoogleAccount
          ? `Tài khoản sử dụng email Google (${accountEmail}). Vui lòng nhận và nhập mã xác minh OTP để kích hoạt tài khoản.`
          : "Email này dùng để khôi phục quyền truy cập khi cần."
      }
    >
      {isGoogleAccount ? (
        <Paper
          sx={{
            alignItems: "center",
            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.05),
            border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.16)}`,
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
              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.12),
              borderRadius: "12px",
              color: "primary.main",
              display: "flex",
              height: 42,
              justifyContent: "center",
              width: 42,
            }}
          >
            <MarkEmailReadRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "text.secondary", fontSize: 11.5, fontWeight: 600 }}>
              Email Google chính chủ
            </Typography>
            <Typography
              sx={{
                color: "text.primary",
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {accountEmail}
            </Typography>
          </Box>
          <Chip
            label={challenge ? "Đã gửi mã" : "Cần xác minh"}
            size="small"
            sx={{
              bgcolor: challenge ? alpha(ergEnterpriseTokens.color.success, 0.12) : alpha(ergEnterpriseTokens.color.primary, 0.1),
              color: challenge ? "success.main" : ergEnterpriseTokens.color.primary,
              fontWeight: 600,
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
                  fontWeight: 600,
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
                color: fieldErrors.otp ? "error.main" : ergEnterpriseTokens.color.textMuted,
              },
            }}
          />
          <Button
            disabled={busy}
            variant="contained"
            onClick={verifyRecovery}
            sx={{
              bgcolor: "primary.main",
              borderRadius: "14px",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              minHeight: 48,
              textTransform: "none",
              boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.25)}`,
              "&:hover": {
                bgcolor: "primary.dark",
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
          <Button variant="contained"
            color="inherit"
            disabled={busy}
            onClick={requestRecovery}
            sx={{
              color: "primary.main",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "980px",
              alignSelf: "center",
              "&:hover": { bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.06) },
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
            bgcolor: "primary.main",
            borderRadius: "14px",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            minHeight: 48,
            textTransform: "none",
            boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.25)}`,
            "&:hover": {
              bgcolor: "primary.dark",
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
  );
}
