import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";

import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { initialForm } from "@/features/employee-management/components/create-employee/constants";
import { CredentialStep } from "@/features/employee-management/components/create-employee/credential-step";
import { IdentityStep } from "@/features/employee-management/components/create-employee/identity-step";
import { OneTimePasswordView } from "@/features/employee-management/components/create-employee/one-time-password-view";
import { ProfileStep } from "@/features/employee-management/components/create-employee/profile-step";
import { RoleStep } from "@/features/employee-management/components/create-employee/role-step";
import {
  useEmployeeCommands,
  useAssignableRoles,
} from "@/features/employee-management/hooks/use-employee-management";
import { assignableRoleValue } from "@/features/rbac/lib/exclusive-roles";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function CreateEmployeeDialog({
  tenantId,
  open,
  onClose,
}: {
  onClose: () => void;
  open: boolean;
  tenantId: string;
}) {
  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useAssignableRoles();
  const [form, setForm] = useState(initialForm);
  const [oneTimePassword, setOneTimePassword] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const set = (name: keyof typeof form, value: string) => {
    setError(null);
    setForm((current) => {
      return { ...current, [name]: value };
    });
  };

  const chosenRoles = form.roleNames.length > 0 ? form.roleNames : form.roleName ? [form.roleName] : [];

  const roleLabels = chosenRoles.map((value) => (rolesQuery.data ?? []).find((role) => assignableRoleValue(role) === value)?.label ?? value);
  const email = form.email.trim();
  const missingHint = !form.fullName.trim()
    ? "Vui lòng nhập họ và tên."
    : !email
      ? "Vui lòng nhập email công việc."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Vui lòng nhập email hợp lệ."
        : chosenRoles.length === 0
          ? "Vui lòng chọn ít nhất một vai trò."
          : "";
  const valid = !missingHint;

  const close = () => {
    setForm(initialForm);
    setOneTimePassword(undefined);
    setError(null);
    onClose();
  };

  const submit = async () => {
    setError(null);
    try {
      const rolesToSubmit = chosenRoles.length > 0 ? chosenRoles : [form.roleName];
      const result = await commands.create.mutateAsync({
        credentialDelivery: form.credentialDelivery,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        // Trường và lớp được phân sau khi tạo; tài khoản mới không mang phạm vi nào.
        policies: [],
        primaryEmail: form.email.trim().toLowerCase(),
        profile: {
          departmentId: form.departmentId.trim() || undefined,
          emergencyContact:
            form.emergencyName || form.emergencyPhone
              ? { name: form.emergencyName.trim(), phone: form.emergencyPhone.trim() }
              : undefined,
          employeeCode: form.employeeCode.trim() || `NV-${Math.floor(1000 + Math.random() * 9000)}`,
          employmentType: form.employmentType,
          experienceSummary: form.experienceSummary.trim() || undefined,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
          jobTitle: form.jobTitle.trim() || roleLabels[0] || "Nhân sự",
          joinedAt: form.joinedAt || undefined,
          managerId: form.managerId.trim() || undefined,
          workLocation: form.workLocation.trim() || undefined,
        },
        recoveryEmail: form.recoveryEmail.trim() ? form.recoveryEmail.trim().toLowerCase() : undefined,
        roleGroupIds: rolesToSubmit,
      });

      if (result?.account?.oneTimePassword) {
        setOneTimePassword(result.account.oneTimePassword);
        toast.success(`Đã tạo tài khoản cho ${form.fullName}. Mật khẩu tạm thời đã được gửi tới email ${form.email}.`);
      } else {
        toast.success(`Đã tạo tài khoản cho ${form.fullName}. Thư mời đã được gửi tới email ${form.email}.`);
        close();
      }
    } catch (err: unknown) {
      let message = "Không thể tạo tài khoản nhân sự. Vui lòng kiểm tra lại thông tin.";
      if (err instanceof ApiClientError) {
        if (Array.isArray(err.details) && err.details.length > 0) {
          message = err.details
            .map((d: { field?: string; message?: string }) => (d.field ? `${d.field}: ${d.message}` : d.message))
            .filter(Boolean)
            .join("; ");
        } else {
          message = err.message;
        }
        if (message.includes("email already registered") || message.includes("username already registered")) {
          message = `Email "${form.email}" đã tồn tại trên hệ thống. Vui lòng nhập email khác.`;
        } else if (message.includes("employee code already exists")) {
          message = `Mã nhân viên "${form.employeeCode}" đã tồn tại trong tổ chức. Vui lòng đổi mã khác.`;
        } else if (message.includes("role groups were not found")) {
          message = "Nhóm quyền đã chọn không tồn tại trong hệ thống.";
        } else if (message.includes("recovery email must differ")) {
          message = "Email khôi phục phải khác với email công việc chính.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            boxShadow: appleDesign.shadows.sheet,
            maxWidth: 640,
            overflow: "hidden",
            p: 0,
            width: "100%",
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
            Thêm nhân sự mới
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
            Tạo tài khoản nhân sự
          </Typography>
        </Box>
        <IconButton
          aria-label="Đóng trình tạo nhân sự"
          onClick={close}
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
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              bgcolor: alpha(ergEnterpriseTokens.color.danger, 0.08),
              border: `1px solid ${alpha(ergEnterpriseTokens.color.danger, 0.25)}`,
              borderRadius: "12px",
              color: appleDesign.colors.dangerText,
              fontSize: "0.825rem",
              fontWeight: 600,
              mb: 2.5,
            }}
          >
            {error}
          </Alert>
        )}

        {oneTimePassword ? (
          <OneTimePasswordView email={form.email} oneTimePassword={oneTimePassword} />
        ) : (
          <Box sx={{ display: "grid", gap: 2.5 }}>
            <IdentityStep form={form} set={set} />
            <RoleStep form={form} roleOptions={rolesQuery.data} setForm={setForm} />
            <CredentialStep form={form} set={set} />
            <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: "10px", "&::before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography variant="subtitle2">Thông tin thêm (không bắt buộc)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ProfileStep form={form} set={set} />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${appleDesign.colors.border}`, px: { sm: 3, xs: 2.5 }, py: 2 }}>
        {oneTimePassword ? (
          <Button variant="contained" onClick={close}>Đã lưu credential an toàn</Button>
        ) : (
          <>
            {missingHint ? (
              <Typography color="text.secondary" role="status" variant="caption" sx={{ mr: "auto" }}>{missingHint}</Typography>
            ) : null}
            <Button variant="text" onClick={close}>Huỷ</Button>
            <Button
              variant="contained"
              onClick={() => void submit()}
              disabled={commands.create.isPending || !valid}
              startIcon={commands.create.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {commands.create.isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
