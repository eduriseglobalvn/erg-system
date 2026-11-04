import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeActionMenu({
  anchorEl,
  onAssignRole,
  onClose,
  onToggleStatus,
  onView,
  status,
}: {
  anchorEl: HTMLElement | null;
  onAssignRole: () => void;
  onClose: () => void;
  onToggleStatus: () => void;
  onView: () => void;
  status?: string;
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            backdropFilter: "blur(20px)",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            border: `1px solid ${appleDesign.colors.border}`,
            borderRadius: "14px",
            boxShadow: appleDesign.shadows.popover,
            minWidth: 180,
            p: 0.5,
            "& .MuiMenuItem-root": {
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              my: 0.25,
              px: 1.5,
              py: 0.75,
              transition: "all 0.12s ease",
              "&:hover": {
                bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                color: appleDesign.colors.blue,
              },
            },
          },
        },
      }}
    >
      <MenuItem
        onClick={onView}
      >
        Xem hồ sơ
      </MenuItem>
      <MenuItem onClick={onAssignRole}>Gán nhóm quyền</MenuItem>
      <MenuItem
        onClick={onToggleStatus}
      >
        {status === "ACTIVE" ? "Deactive tài khoản" : "Active tài khoản"}
      </MenuItem>
    </Menu>
  );
}
