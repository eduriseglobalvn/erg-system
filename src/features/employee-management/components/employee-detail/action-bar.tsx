import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeAccount } from "@/features/employee-management/components/employee-detail/types";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeActionBar({
  account,
  onEdit,
  onResetCredential,
  onToggleStatus,
}: {
  account: EmployeeAccount;
  onEdit: () => void;
  onResetCredential: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<EditRoundedIcon fontSize="small" />}
        onClick={() => onEdit()}
        sx={{
          borderColor: appleDesign.colors.borderMedium,
          borderRadius: `${ergEnterpriseTokens.radius.md}px`,
          color: appleDesign.colors.textPrimary,
          fontSize: "0.825rem",
          fontWeight: 600,
          textTransform: "none",
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.04)",
            borderColor: appleDesign.colors.borderHover,
          },
        }}
      >
        Chỉnh sửa hồ sơ
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={account?.status === "ACTIVE" ? <BlockRoundedIcon fontSize="small" /> : <CheckCircleRoundedIcon fontSize="small" />}
        onClick={() => onToggleStatus()}
        sx={{
          borderColor: appleDesign.colors.borderMedium,
          borderRadius: `${ergEnterpriseTokens.radius.md}px`,
          color: account?.status === "ACTIVE" ? appleDesign.colors.textSecondary : appleDesign.colors.greenText,
          fontSize: "0.825rem",
          fontWeight: 600,
          textTransform: "none",
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.04)",
            borderColor: appleDesign.colors.borderHover,
          },
        }}
      >
        {account?.status === "ACTIVE" ? "Deactive" : "Active"}
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<LockResetRoundedIcon fontSize="small" />}
        onClick={() => onResetCredential()}
        sx={{
          borderColor: alpha(ergEnterpriseTokens.color.warning, 0.3),
          borderRadius: `${ergEnterpriseTokens.radius.md}px`,
          color: appleDesign.colors.amberText,
          fontSize: "0.825rem",
          fontWeight: 600,
          textTransform: "none",
          "&:hover": {
            bgcolor: appleDesign.colors.amberSoft,
            borderColor: appleDesign.colors.amber,
          },
        }}
      >
        Reset credential
      </Button>
    </Box>
  );
}
