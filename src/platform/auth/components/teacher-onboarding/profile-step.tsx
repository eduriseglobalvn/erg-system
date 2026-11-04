import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import { ErgTextField } from "@/components/erg-mui";
import { OnboardingSection } from "@/platform/auth/components/teacher-onboarding/onboarding-section";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function ProfileStep({
  busy,
  fieldErrors,
  fullName,
  phone,
  saveProfile,
  setFullName,
  setPhone,
}: {
  busy: boolean;
  fieldErrors: Record<string, string>;
  fullName: string;
  phone: string;
  saveProfile: () => void;
  setFullName: (value: string) => void;
  setPhone: (value: string) => void;
}) {
  return (
    <OnboardingSection
      icon={<PersonOutlineRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />}
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
          bgcolor: "primary.main",
          borderRadius: "14px",
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 600,
          minHeight: 48,
          textTransform: "none",
          boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.25)}`,
          transition: "all 180ms ease",
          "&:hover": {
            bgcolor: "primary.dark",
            boxShadow: `0 6px 18px ${alpha(ergEnterpriseTokens.color.primary, 0.35)}`,
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
  );
}
