import Box from "@mui/material/Box";
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
  AppleStatusBadge,
} from "@/features/employee-management/components/apple-ui-tokens";
import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";
import type { useEmployeeRoleOptions } from "@/features/employee-management/hooks/use-employee-management";

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
  roles: ReturnType<typeof useEmployeeRoleOptions>["data"];
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
      <DialogTitle sx={{ fontWeight: 750, letterSpacing: "-0.01em" }}>
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
                const meta = getRoleMeta(String(selected));
                return (
                  <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                    <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 700 }}>
                      {meta.label}
                    </Typography>
                    <Typography
                      sx={{
                        bgcolor: "rgba(0, 0, 0, 0.05)",
                        borderRadius: "4px",
                        color: appleDesign.colors.textSecondary,
                        fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        px: 0.6,
                        py: 0.1,
                      }}
                    >
                      {String(selected)}
                    </Typography>
                  </Box>
                );
              },
            },
          }}
          sx={appleInputSx}
        >
          {(roles ?? []).map((role) => {
            const meta = getRoleMeta(role.name);
            return (
              <MenuItem
                key={role.id}
                value={role.name}
                sx={{
                  alignItems: "flex-start",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.3,
                  mx: 0.5,
                  my: 0.35,
                  py: 1,
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 113, 227, 0.08) !important",
                  },
                }}
              >
                <Box sx={{ alignItems: "center", display: "flex", gap: 1, width: "100%" }}>
                  <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.85rem", fontWeight: 700 }}>
                    {meta.label}
                  </Typography>
                  <Typography
                    sx={{
                      bgcolor: "rgba(0, 0, 0, 0.05)",
                      borderRadius: "4px",
                      color: appleDesign.colors.textSecondary,
                      fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      ml: "auto",
                      px: 0.5,
                      py: 0.1,
                    }}
                  >
                    {role.name}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: appleDesign.colors.textSecondary,
                    fontSize: "0.74rem",
                    lineHeight: 1.35,
                    whiteSpace: "normal",
                  }}
                >
                  {meta.description}
                </Typography>
              </MenuItem>
            );
          })}
        </TextField>

        {roleName ? (() => {
          const meta = getRoleMeta(roleName);
          return (
            <Box
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${appleDesign.colors.border}`,
                borderRadius: "14px",
                mt: 2,
                p: 2,
              }}
            >
              <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 1 }}>
                <AppleStatusBadge label={meta.category} tone={meta.badgeTone} />
                <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 750 }}>
                  {meta.label}
                </Typography>
              </Box>
              <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.78rem", lineHeight: 1.45, mb: 1.25 }}>
                {meta.description}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                {meta.keyPermissions.map((perm) => (
                  <Box
                    key={perm}
                    sx={{
                      alignItems: "center",
                      bgcolor: "#FFFFFF",
                      border: `1px solid ${appleDesign.colors.borderSubtle}`,
                      borderRadius: "6px",
                      color: appleDesign.colors.textPrimary,
                      display: "inline-flex",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      gap: 0.5,
                      px: 0.85,
                      py: 0.3,
                    }}
                  >
                    <Box sx={{ bgcolor: appleDesign.colors.green, borderRadius: "50%", height: 5, width: 5 }} />
                    {perm}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })() : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="text"
          onClick={() => onClose()}
          sx={{
            bgcolor: "transparent !important",
            borderRadius: "10px",
            color: `${appleDesign.colors.textSecondary} !important`,
            fontWeight: 650,
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
            borderRadius: "10px",
            boxShadow: appleDesign.shadows.button,
            color: "#FFFFFF !important",
            fontWeight: 650,
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
