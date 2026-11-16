import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  appleDesign,
  appleInputSx,
} from "@/features/employee-management/components/apple-ui-tokens";
import { assignableRoleValue } from "@/features/rbac/lib/exclusive-roles";
import type { AssignableRole } from "@/features/rbac/api/rbac-api";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function RoleAssignDialog({
  onClose,
  onConfirm,
  onRoleNameChange,
  open,
  pending,
  roleName,
  roles,
}: {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onRoleNameChange: (roleName: string) => void;
  open: boolean;
  pending: boolean;
  roleName: string;
  roles: AssignableRole[] | undefined;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            boxShadow: appleDesign.shadows.sheet,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
        Gán nhóm quyền nhân sự
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: appleDesign.colors.textSecondary, mb: 2.5 }}>
          Nhóm quyền mới sẽ được cấp thêm cho nhân sự. Thay đổi có hiệu lực ngay lập tức và được lưu vết trong nhật ký kiểm toán.
        </DialogContentText>
        <TextField
          select
          fullWidth
          label="Nhóm quyền"
          value={roleName}
          onChange={(event) => onRoleNameChange(event.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: (selected) => {
                if (!selected) {
                  return (
                    <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.875rem" }}>
                      Chọn nhóm quyền...
                    </Typography>
                  );
                }
                return (
                  <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 600 }}>
                    {(roles ?? []).find((role) => assignableRoleValue(role) === String(selected))?.label ?? String(selected)}
                  </Typography>
                );
              },
            },
          }}
          sx={appleInputSx}
        >
          {(roles ?? []).map((role) => (
            <MenuItem
              key={role.id}
              value={assignableRoleValue(role)}
              sx={{ borderRadius: "8px", mx: 0.5, my: 0.35, py: 1, "&.Mui-selected": { bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.08)} !important` } }}
            >
              <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.85rem", fontWeight: 600 }}>{role.label}</Typography>
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="text"
          onClick={() => onClose()}
          sx={{
            bgcolor: "transparent !important",
            borderRadius: `${ergEnterpriseTokens.radius.md}px`,
            color: `${appleDesign.colors.textSecondary} !important`,
            fontWeight: 600,
            px: 2,
            textTransform: "none",
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05) !important" },
          }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={() => void onConfirm()}
          disabled={!roleName || pending}
          sx={{
            bgcolor: `${appleDesign.colors.blue} !important`,
            borderRadius: `${ergEnterpriseTokens.radius.md}px`,
            boxShadow: appleDesign.shadows.button,
            color: "#FFFFFF !important",
            fontWeight: 600,
            px: 2.5,
            textTransform: "none",
            "&:hover": {
              bgcolor: `${appleDesign.colors.blueHover} !important`,
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(0, 0, 0, 0.12) !important",
              color: "rgba(0, 0, 0, 0.35) !important",
            },
          }}
        >
          Xác nhận gán quyền
        </Button>
      </DialogActions>
    </Dialog>
  );
}
