import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";

import { ErgTextField } from "@/components/erg-mui";
import { OnboardingSection } from "@/platform/auth/components/teacher-onboarding/onboarding-section";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function PasswordStep({
  busy,
  changePassword,
  confirmPassword,
  currentPassword,
  fieldErrors,
  newPassword,
  setConfirmPassword,
  setCurrentPassword,
  setNewPassword,
}: {
  busy: boolean;
  changePassword: () => void;
  confirmPassword: string;
  currentPassword: string;
  fieldErrors: Record<string, string>;
  newPassword: string;
  setConfirmPassword: (value: string) => void;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
}) {
  return (
    <OnboardingSection
      icon={<LockResetRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />}
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
        Hoàn tất onboarding
      </Button>
    </OnboardingSection>
  );
}
