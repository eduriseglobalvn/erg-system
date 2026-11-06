import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  appleDesign,
  appleInputSx,
} from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeEditForm } from "@/features/employee-management/components/employee-detail/types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeEditDialog({
  form,
  onChange,
  onClose,
  onSave,
  open,
  saving,
}: {
  form: EmployeeEditForm;
  onChange: (name: keyof EmployeeEditForm, value: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  open: boolean;
  saving: boolean;
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
            overflow: "hidden",
            p: 0,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          alignItems: "center",
          borderBottom: `1px solid ${appleDesign.colors.border}`,
          display: "flex",
          fontWeight: 600,
          justifyContent: "space-between",
          letterSpacing: "-0.02em",
          px: { sm: 3, xs: 2.5 },
          py: 2,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: appleDesign.colors.blue,
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            Cập nhật thông tin
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: appleDesign.colors.textPrimary,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            Chỉnh sửa hồ sơ nhân sự
          </Typography>
        </Box>
        <IconButton
          aria-label="Đóng chỉnh sửa hồ sơ"
          onClick={() => onClose()}
          size="small"
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.04)",
            color: appleDesign.colors.textSecondary,
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.08)",
              color: appleDesign.colors.textPrimary,
            },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { sm: 3, xs: 2.5 }, py: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr", xs: "1fr" },
            pt: 0.5,
          }}
        >
          <TextField
            label="Họ và tên"
            value={form.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            placeholder="Nhập họ và tên..."
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Điện thoại"
            value={form.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="Ví dụ: 0901234567"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Mã nhân viên"
            value={form.employeeCode}
            onChange={(event) => onChange("employeeCode", event.target.value)}
            placeholder="Ví dụ: NV-001"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Phòng ban"
            value={form.departmentId}
            onChange={(event) => onChange("departmentId", event.target.value)}
            placeholder="Ví dụ: Đào tạo, Học thuật..."
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Chức danh"
            value={form.jobTitle}
            onChange={(event) => onChange("jobTitle", event.target.value)}
            placeholder="Ví dụ: Giảng viên chuyên trách..."
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Loại hợp đồng"
            value={form.employmentType}
            onChange={(event) => onChange("employmentType", event.target.value)}
            placeholder="FULL_TIME, PART_TIME..."
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Nơi làm việc"
            value={form.workLocation}
            onChange={(event) => onChange("workLocation", event.target.value)}
            placeholder="Ví dụ: Cơ sở 1 - Hà Nội"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Quản lý trực tiếp"
            value={form.managerId}
            onChange={(event) => onChange("managerId", event.target.value)}
            placeholder="ID hoặc mã quản lý..."
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <TextField
            label="Số năm kinh nghiệm"
            type="number"
            value={form.experienceYears}
            onChange={(event) => onChange("experienceYears", event.target.value)}
            placeholder="0"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={appleInputSx}
          />
          <Box sx={{ display: { sm: "block", xs: "none" } }} />
          <TextField
            label="Tóm tắt kinh nghiệm"
            value={form.experienceSummary}
            onChange={(event) => onChange("experienceSummary", event.target.value)}
            placeholder="Tóm tắt quá trình làm việc, chứng chỉ, chuyên môn..."
            multiline
            minRows={2.5}
            sx={[{ gridColumn: { sm: "1 / -1" } }, appleInputSx]}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${appleDesign.colors.border}`,
          px: { sm: 3, xs: 2.5 },
          py: 2,
        }}
      >
        <Button
          variant="text"
          onClick={() => onClose()}
          sx={{
            borderRadius: `${ergEnterpriseTokens.radius.md}px`,
            color: `${appleDesign.colors.textSecondary} !important`,
            fontWeight: 600,
            px: 2.5,
            textTransform: "none",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.04) !important",
              color: `${appleDesign.colors.textPrimary} !important`,
            },
          }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={() => void onSave()}
          disabled={saving || !form.fullName.trim() || !form.employeeCode.trim()}
          sx={{
            bgcolor: `${appleDesign.colors.blue} !important`,
            borderRadius: `${ergEnterpriseTokens.radius.md}px`,
            boxShadow: appleDesign.shadows.button,
            color: "#FFFFFF !important",
            fontWeight: 600,
            px: 3,
            textTransform: "none",
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: `${appleDesign.colors.blueHover} !important`,
              boxShadow: appleDesign.shadows.buttonHover,
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(0, 0, 0, 0.12) !important",
              boxShadow: "none",
              color: "rgba(0, 0, 0, 0.35) !important",
            },
          }}
        >
          Lưu hồ sơ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
