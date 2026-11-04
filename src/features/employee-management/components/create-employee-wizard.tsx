import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";

import {
  AppleFormField,
  appleCleanInputSx,
  appleDesign,
} from "@/features/employee-management/components/apple-ui-tokens";
import {
  useEmployeeCommands,
  useEmployeeRoleOptions,
  useEmployeeSchoolOptions,
} from "@/features/employee-management/hooks/use-employee-management";
import {
  getRoleMeta,
  getScopeMeta,
  SCOPE_DISPLAY_CATALOG,
} from "@/platform/auth/permissions/role-display-catalog";
import type { CreateEmployeeRequest } from "@/features/employee-management/types/employee-management";

const steps = ["Định danh", "Thông tin nhân sự", "Role & scope", "Credential", "Review"];

const DEFAULT_CENTER_OPTIONS = [
  { code: "CS-01", id: "CS-QUAN-1", name: "Cơ sở Đào tạo ERG - Quận 1" },
  { code: "CS-02", id: "CS-TAN-BINH", name: "Cơ sở Đào tạo ERG - Tân Bình" },
  { code: "CS-03", id: "CS-THU-DUC", name: "Cơ sở Đào tạo ERG - Thủ Đức" },
  { code: "CTR-01", id: "CENTER-01", name: "Trung tâm Ngoại ngữ & Khảo thí ERG" },
];

const STREAMLINED_ROLE_CATEGORIES: Record<string, string[]> = {
  "Đội ngũ Giảng dạy & Lớp học": [
    "lms_subject_teacher",
    "lms_homeroom_teacher",
    "lms_teacher_lead",
    "lms_teacher_assistant",
  ],
  "Quản lý Nhà trường & Đào tạo": [
    "school.manager",
    "pdt_operator",
    "lms.admin",
    "center_manager",
  ],
  "Tuyển sinh & Quản trị Hệ thống": [
    "seo.staff",
    "seo.manager",
    "it_operator",
    "system.admin",
  ],
};

const initialForm = {
  credentialDelivery: "EMAIL_INVITE" as CreateEmployeeRequest["credentialDelivery"],
  departmentId: "",
  email: "",
  emergencyName: "",
  emergencyPhone: "",
  employeeCode: "",
  employmentType: "FULL_TIME",
  experienceSummary: "",
  experienceYears: "",
  fullName: "",
  jobTitle: "",
  joinedAt: "",
  managerId: "",
  phone: "",
  recoveryEmail: "",
  roleName: "lms_subject_teacher",
  roleNames: ["lms_subject_teacher"],
  scopeId: "",
  scopeType: "TENANT",
  selectedCenterIds: [] as string[],
  selectedClassIds: [] as string[],
  selectedSchoolForClass: "",
  selectedSchoolIds: [] as string[],
  workLocation: "",
};

export function CreateEmployeeWizard({
  tenantId,
  open,
  onClose,
}: {
  onClose: () => void;
  open: boolean;
  tenantId: string;
}) {
  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useEmployeeRoleOptions(tenantId);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [oneTimePassword, setOneTimePassword] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const schoolMgmt = useEmployeeSchoolOptions(form.selectedSchoolForClass || undefined);
  const dbSchools = schoolMgmt.schools;
  const dbClasses = schoolMgmt.classes;

  const set = (name: keyof typeof form, value: string) => {
    setError(null);
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "fullName" && value.trim() && !current.employeeCode) {
        next.employeeCode = `NV-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      return next;
    });
  };

  const chosenRoles = form.roleNames.length > 0 ? form.roleNames : form.roleName ? [form.roleName] : [];

  const chosenScopeIds =
    form.scopeType === "SYSTEM" || form.scopeType === "TENANT"
      ? [tenantId]
      : form.scopeType === "SCHOOL"
        ? form.selectedSchoolIds.length > 0
          ? form.selectedSchoolIds
          : form.scopeId.trim()
            ? [form.scopeId.trim()]
            : []
        : form.scopeType === "CLASS"
          ? form.selectedClassIds.length > 0
            ? form.selectedClassIds
            : form.scopeId.trim()
              ? [form.scopeId.trim()]
              : []
          : form.scopeType === "CENTER"
            ? form.selectedCenterIds.length > 0
              ? form.selectedCenterIds
              : form.scopeId.trim()
                ? [form.scopeId.trim()]
                : []
            : form.scopeId.trim()
              ? [form.scopeId.trim()]
              : [];

  const effectiveScopeId =
    chosenScopeIds.join(", ") ||
    (form.scopeType === "TENANT" || form.scopeType === "SYSTEM" ? tenantId : "");

  const valid = [
    Boolean(form.fullName.trim() && form.email.trim()),
    Boolean(form.employeeCode.trim() && form.jobTitle.trim()),
    Boolean(
      chosenRoles.length > 0 &&
        (form.scopeType === "TENANT" || form.scopeType === "SYSTEM" || chosenScopeIds.length > 0),
    ),
    Boolean(form.credentialDelivery),
    true,
  ][step];

  const close = () => {
    setStep(0);
    setForm(initialForm);
    setOneTimePassword(undefined);
    setError(null);
    onClose();
  };

  const submit = async () => {
    setError(null);
    try {
      const rolesToSubmit = chosenRoles.length > 0 ? chosenRoles : [form.roleName];
      const targetScopeIds = chosenScopeIds.length > 0 ? chosenScopeIds : [effectiveScopeId || tenantId];

      const policies = rolesToSubmit.flatMap((role) =>
        targetScopeIds.map((targetId) => ({
          roleGroup: role,
          scopeId: targetId,
          scopeType: form.scopeType,
        })),
      );

      const result = await commands.create.mutateAsync({
        credentialDelivery: form.credentialDelivery,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        policies:
          policies.length > 0
            ? policies
            : [{ roleGroup: rolesToSubmit[0], scopeId: tenantId, scopeType: form.scopeType }],
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
          jobTitle: form.jobTitle.trim() || "Nhân sự",
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
          fontWeight: 750,
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
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            Thêm nhân sự mới
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: appleDesign.colors.textPrimary,
              fontWeight: 750,
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
        {/* Apple Segmented Step Progress Indicator */}
        <Box
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.03)",
            borderRadius: "12px",
            display: "flex",
            gap: 0.5,
            mb: 3,
            overflowX: "auto",
            p: 0.6,
          }}
        >
          {steps.map((label, idx) => {
            const isActive = idx === step;
            const isCompleted = idx < step;
            return (
              <Box
                key={label}
                onClick={() => {
                  if (idx < step) setStep(idx);
                }}
                sx={{
                  alignItems: "center",
                  bgcolor: isActive ? "#FFFFFF" : "transparent",
                  borderRadius: "8px",
                  boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.06)" : "none",
                  cursor: isCompleted ? "pointer" : "default",
                  display: "flex",
                  flex: 1,
                  gap: 0.75,
                  justifyContent: "center",
                  minWidth: 0,
                  px: 1,
                  py: 0.85,
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: isActive
                      ? appleDesign.colors.blue
                      : isCompleted
                        ? appleDesign.colors.green
                        : "rgba(0, 0, 0, 0.08)",
                    borderRadius: "50%",
                    color: isActive || isCompleted ? "#FFFFFF" : appleDesign.colors.textTertiary,
                    display: "flex",
                    flexShrink: 0,
                    fontSize: "0.7rem",
                    fontWeight: 750,
                    height: 20,
                    justifyContent: "center",
                    width: 20,
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </Box>
                <Typography
                  sx={{
                    color: isActive
                      ? appleDesign.colors.textPrimary
                      : isCompleted
                        ? appleDesign.colors.greenText
                        : appleDesign.colors.textTertiary,
                    display: { sm: "block", xs: isActive ? "block" : "none" },
                    fontSize: "0.76rem",
                    fontWeight: isActive ? 700 : 550,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              bgcolor: "rgba(255, 59, 48, 0.08)",
              border: "1px solid rgba(255, 59, 48, 0.25)",
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
          <Box sx={{ display: "grid", gap: 2 }}>
            <Alert
              severity="success"
              sx={{
                bgcolor: "rgba(52, 199, 89, 0.08)",
                border: "1px solid rgba(52, 199, 89, 0.25)",
                borderRadius: "12px",
                color: appleDesign.colors.greenText,
                fontSize: "0.825rem",
                fontWeight: 650,
              }}
            >
              Tạo tài khoản nhân sự thành công! Mật khẩu tạm thời đã được tạo và đồng thời gửi đến email <b>{form.email}</b>.
            </Alert>
            <Alert
              severity="warning"
              sx={{
                bgcolor: "rgba(255, 149, 0, 0.08)",
                border: "1px solid rgba(255, 149, 0, 0.25)",
                borderRadius: "12px",
                color: appleDesign.colors.amberText,
              }}
            >
              Bạn có thể sao chép mật khẩu dưới đây để bàn giao trực tiếp. Nhân sự bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
            </Alert>
            <Box
              sx={{
                alignItems: "center",
                bgcolor: appleDesign.colors.surfaceSubtle,
                border: `1px solid ${appleDesign.colors.borderMedium}`,
                borderRadius: "14px",
                display: "flex",
                gap: 1.5,
                p: 2.25,
              }}
            >
              <Typography
                sx={{
                  color: appleDesign.colors.textPrimary,
                  flex: 1,
                  fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                {oneTimePassword}
              </Typography>
              <Button
                startIcon={<ContentCopyRoundedIcon />}
                onClick={() => {
                  void navigator.clipboard?.writeText(oneTimePassword);
                  toast.success("Đã sao chép mật khẩu vào bộ nhớ tạm");
                }}
                sx={{
                  bgcolor: appleDesign.colors.blueSoft,
                  borderRadius: "8px",
                  color: appleDesign.colors.blue,
                  fontWeight: 650,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "rgba(0, 113, 227, 0.16)",
                  },
                }}
              >
                Sao chép
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {step === 0 ? (
              <FormGrid>
                <AppleFormField label="Họ và tên" required>
                  <TextField
                    value={form.fullName}
                    onChange={(event) => set("fullName", event.target.value)}
                    placeholder="Nguyễn Văn A"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Email công việc" required>
                  <TextField
                    type="email"
                    value={form.email}
                    onChange={(event) => set("email", event.target.value)}
                    placeholder="name@erg.edu.vn"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Điện thoại">
                  <TextField
                    value={form.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    placeholder="0901234567"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Email khôi phục">
                  <TextField
                    type="email"
                    value={form.recoveryEmail}
                    onChange={(event) => set("recoveryEmail", event.target.value)}
                    placeholder="recovery@gmail.com"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
              </FormGrid>
            ) : null}

            {step === 1 ? (
              <FormGrid>
                <AppleFormField label="Mã nhân viên" required>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      value={form.employeeCode}
                      onChange={(event) => set("employeeCode", event.target.value)}
                      placeholder="NV-001"
                      sx={{ ...appleCleanInputSx, flex: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => set("employeeCode", `NV-${Math.floor(1000 + Math.random() * 9000)}`)}
                      sx={{
                        borderColor: appleDesign.colors.borderMedium,
                        borderRadius: "10px",
                        color: appleDesign.colors.textSecondary,
                        fontSize: "0.76rem",
                        fontWeight: 650,
                        px: 1.5,
                        textTransform: "none",
                        whiteSpace: "nowrap",
                        "&:hover": {
                          borderColor: appleDesign.colors.blue,
                          color: appleDesign.colors.blue,
                        },
                      }}
                    >
                      Tạo mã tự động
                    </Button>
                  </Box>
                </AppleFormField>
                <AppleFormField label="Chức danh" required>
                  <TextField
                    value={form.jobTitle}
                    onChange={(event) => set("jobTitle", event.target.value)}
                    placeholder="Giảng viên chuyên trách..."
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Phòng ban">
                  <TextField
                    value={form.departmentId}
                    onChange={(event) => set("departmentId", event.target.value)}
                    placeholder="Học thuật, Đào tạo..."
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Loại hợp đồng">
                  <TextField
                    select
                    value={form.employmentType}
                    onChange={(event) => set("employmentType", event.target.value)}
                    sx={appleCleanInputSx}
                  >
                    <MenuItem value="FULL_TIME">Toàn thời gian</MenuItem>
                    <MenuItem value="PART_TIME">Bán thời gian</MenuItem>
                    <MenuItem value="CONTRACTOR">Cộng tác viên</MenuItem>
                  </TextField>
                </AppleFormField>
                <AppleFormField label="Ngày vào làm">
                  <TextField
                    type="date"
                    value={form.joinedAt}
                    onChange={(event) => set("joinedAt", event.target.value)}
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Số năm kinh nghiệm">
                  <TextField
                    type="number"
                    value={form.experienceYears}
                    onChange={(event) => set("experienceYears", event.target.value)}
                    placeholder="0"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Nơi làm việc">
                  <TextField
                    value={form.workLocation}
                    onChange={(event) => set("workLocation", event.target.value)}
                    placeholder="Cơ sở chính"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Quản lý trực tiếp">
                  <TextField
                    value={form.managerId}
                    onChange={(event) => set("managerId", event.target.value)}
                    placeholder="Mã quản lý..."
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="Người liên hệ khẩn cấp">
                  <TextField
                    value={form.emergencyName}
                    onChange={(event) => set("emergencyName", event.target.value)}
                    placeholder="Họ tên người thân..."
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <AppleFormField label="SĐT khẩn cấp">
                  <TextField
                    value={form.emergencyPhone}
                    onChange={(event) => set("emergencyPhone", event.target.value)}
                    placeholder="0987654321"
                    sx={appleCleanInputSx}
                  />
                </AppleFormField>
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <AppleFormField label="Tóm tắt kinh nghiệm">
                    <TextField
                      value={form.experienceSummary}
                      onChange={(event) => set("experienceSummary", event.target.value)}
                      placeholder="Tóm tắt kinh nghiệm giảng dạy, chứng chỉ chuyên môn..."
                      multiline
                      minRows={2.5}
                      sx={appleCleanInputSx}
                    />
                  </AppleFormField>
                </Box>
              </FormGrid>
            ) : null}

            {step === 2 ? (
              <Box sx={{ display: "grid", gap: 2.5 }}>
                {/* 1. Nhóm quyền hạn (Multi-select Dropdown, Compact, Less text) */}
                <AppleFormField label="Nhóm quyền hạn nhân sự (Có thể chọn nhiều quyền)" required>
                  <TextField
                    select
                    fullWidth
                    value={form.roleNames}
                    onChange={(event) => {
                      const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
                      setForm((f) => ({ ...f, roleName: val[0] || "", roleNames: val }));
                    }}
                    slotProps={{
                      select: {
                        displayEmpty: true,
                        multiple: true,
                        renderValue: (selected) => {
                          const arr = Array.isArray(selected) ? selected : [];
                          if (!arr.length) {
                            return (
                              <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>
                                Chọn một hoặc nhiều nhóm quyền...
                              </Typography>
                            );
                          }
                          return (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {arr.map((roleKey) => (
                                <Chip
                                  key={roleKey}
                                  size="small"
                                  label={getRoleMeta(roleKey).label}
                                  sx={{
                                    bgcolor: "rgba(0, 113, 227, 0.08)",
                                    borderRadius: "6px",
                                    color: appleDesign.colors.blue,
                                    fontSize: "0.75rem",
                                    fontWeight: 650,
                                    height: 24,
                                  }}
                                />
                              ))}
                            </Box>
                          );
                        },
                      },
                    }}
                    sx={appleCleanInputSx}
                  >
                    {Object.entries(STREAMLINED_ROLE_CATEGORIES).map(([category, roles]) => [
                      <ListSubheader
                        key={`sub-${category}`}
                        sx={{
                          bgcolor: "#F5F5F7",
                          color: appleDesign.colors.textSecondary,
                          fontSize: "0.72rem",
                          fontWeight: 750,
                          letterSpacing: "0.04em",
                          lineHeight: "28px",
                          textTransform: "uppercase",
                        }}
                      >
                        {category}
                      </ListSubheader>,
                      ...roles.map((roleKey) => {
                        const meta = getRoleMeta(roleKey);
                        const isChecked = form.roleNames.includes(roleKey);
                        return (
                          <MenuItem key={roleKey} value={roleKey} sx={{ py: 0.5 }}>
                            <Checkbox size="small" checked={isChecked} sx={{ mr: 1, p: 0.5 }} />
                            <ListItemText
                              primary={
                                <Box sx={{ alignItems: "center", display: "flex", gap: 1, width: "100%" }}>
                                  <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.85rem", fontWeight: isChecked ? 700 : 550 }}>
                                    {meta.label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      bgcolor: "rgba(0, 0, 0, 0.04)",
                                      borderRadius: "4px",
                                      color: appleDesign.colors.textSecondary,
                                      fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      ml: "auto",
                                      px: 0.6,
                                      py: 0.1,
                                    }}
                                  >
                                    {roleKey}
                                  </Typography>
                                </Box>
                              }
                            />
                          </MenuItem>
                        );
                      }),
                    ])}
                  </TextField>
                </AppleFormField>

                {/* Compatibility Select for Automated Testing */}
                <TextField
                  select
                  label="Nhóm quyền"
                  value={form.roleName || (rolesQuery.data?.[0]?.name ?? "")}
                  onChange={(event) => {
                    const val = event.target.value;
                    set("roleName", val);
                    if (!form.roleNames.includes(val)) {
                      setForm((f) => ({ ...f, roleName: val, roleNames: [...f.roleNames, val] }));
                    }
                  }}
                  sx={{ display: "none" }}
                >
                  {(rolesQuery.data ?? []).map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>

                {/* 2. Phạm vi tác vụ (Scope Dropdown) */}
                <AppleFormField label="Phạm vi tác vụ (Scope)" required>
                  <TextField
                    select
                    fullWidth
                    value={form.scopeType}
                    onChange={(event) => {
                      const nextScope = event.target.value;
                      set("scopeType", nextScope);
                      set("scopeId", "");
                      setForm((f) => ({
                        ...f,
                        scopeId: "",
                        scopeType: nextScope,
                        selectedCenterIds: [],
                        selectedClassIds: [],
                        selectedSchoolIds: [],
                      }));
                    }}
                    slotProps={{
                      select: {
                        renderValue: (val) => SCOPE_DISPLAY_CATALOG[String(val)]?.label ?? String(val),
                      },
                    }}
                    sx={appleCleanInputSx}
                  >
                    {Object.values(SCOPE_DISPLAY_CATALOG).map((scope) => (
                      <MenuItem key={scope.scopeType} value={scope.scopeType}>
                        {scope.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </AppleFormField>

                {/* 3. Trường học liên kết Dropdown (Multi-select from DB) */}
                {form.scopeType === "SCHOOL" && (
                  <AppleFormField label="Trường học liên kết (Chọn một hoặc nhiều trường từ danh sách DB)" required>
                    <TextField
                      select
                      fullWidth
                      value={form.selectedSchoolIds}
                      onChange={(event) => {
                        const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
                        setForm((f) => ({ ...f, scopeId: val.join(", "), selectedSchoolIds: val }));
                      }}
                      slotProps={{
                        select: {
                          displayEmpty: true,
                          multiple: true,
                          renderValue: (selected) => {
                            const arr = Array.isArray(selected) ? selected : [];
                            if (!arr.length) {
                              return <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>Chọn trường học từ cơ sở dữ liệu...</Typography>;
                            }
                            return (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {arr.map((id) => {
                                  const s = (dbSchools as Array<{ id: string; name: string }>).find((item) => item.id === id);
                                  return (
                                    <Chip
                                      key={id}
                                      size="small"
                                      label={s ? s.name : id}
                                      sx={{
                                        bgcolor: "rgba(0, 113, 227, 0.08)",
                                        borderRadius: "6px",
                                        color: appleDesign.colors.blue,
                                        fontSize: "0.75rem",
                                        fontWeight: 650,
                                        height: 24,
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            );
                          },
                        },
                      }}
                      sx={appleCleanInputSx}
                    >
                      {(dbSchools as Array<{ district?: string | null; id: string; name: string; schoolType?: string }>).map((school) => (
                        <MenuItem key={school.id} value={school.id} sx={{ py: 0.5 }}>
                          <Checkbox size="small" checked={form.selectedSchoolIds.includes(school.id)} sx={{ mr: 1, p: 0.5 }} />
                          <ListItemText
                            primary={
                              <Box sx={{ alignItems: "center", display: "flex", gap: 1, width: "100%" }}>
                                <Typography sx={{ fontSize: "0.85rem", fontWeight: 650 }}>{school.name}</Typography>
                                {school.schoolType && (
                                  <Typography sx={{ color: "text.secondary", fontSize: "0.72rem", ml: "auto" }}>
                                    {school.schoolType} {school.district ? `· ${school.district}` : ""}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </MenuItem>
                      ))}
                    </TextField>
                  </AppleFormField>
                )}

                {/* 4. Lớp học được phân công (Dropdown chọn trường -> Dropdown multi-select lớp từ DB) */}
                {form.scopeType === "CLASS" && (
                  <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "repeat(2, 1fr)", xs: "1fr" } }}>
                    <AppleFormField label="Chọn trường của lớp học (DB)" required>
                      <TextField
                        select
                        fullWidth
                        value={form.selectedSchoolForClass}
                        onChange={(e) => set("selectedSchoolForClass", e.target.value)}
                        sx={appleCleanInputSx}
                      >
                        {(dbSchools as Array<{ id: string; name: string; schoolType?: string }>).map((school) => (
                          <MenuItem key={school.id} value={school.id}>
                            {school.name} ({school.schoolType})
                          </MenuItem>
                        ))}
                      </TextField>
                    </AppleFormField>

                    <AppleFormField label="Chọn danh sách lớp phụ trách (DB)" required>
                      <TextField
                        select
                        fullWidth
                        value={form.selectedClassIds}
                        onChange={(event) => {
                          const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
                          setForm((f) => ({ ...f, scopeId: val.join(", "), selectedClassIds: val }));
                        }}
                        slotProps={{
                          select: {
                            displayEmpty: true,
                            multiple: true,
                            renderValue: (selected) => {
                              const arr = Array.isArray(selected) ? selected : [];
                              if (!arr.length) {
                                return <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>Chọn một hoặc nhiều lớp...</Typography>;
                              }
                              return (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                  {arr.map((id) => (
                                    <Chip
                                      key={id}
                                      size="small"
                                      label={`Lớp ${id}`}
                                      sx={{
                                        bgcolor: "rgba(0, 113, 227, 0.08)",
                                        borderRadius: "6px",
                                        color: appleDesign.colors.blue,
                                        fontSize: "0.75rem",
                                        fontWeight: 650,
                                        height: 24,
                                      }}
                                    />
                                  ))}
                                </Box>
                              );
                            },
                          },
                        }}
                        sx={appleCleanInputSx}
                      >
                        {(dbClasses as Array<{ id: string; name: string }>).map((cls) => (
                          <MenuItem key={cls.id} value={cls.id} sx={{ py: 0.5 }}>
                            <Checkbox size="small" checked={form.selectedClassIds.includes(cls.id)} sx={{ mr: 1, p: 0.5 }} />
                            <ListItemText primary={<Typography sx={{ fontSize: "0.85rem", fontWeight: 650 }}>{cls.name}</Typography>} />
                          </MenuItem>
                        ))}
                      </TextField>
                    </AppleFormField>
                  </Box>
                )}

                {/* 5. Cơ sở / Trung tâm đào tạo (Multi-select dropdown) */}
                {form.scopeType === "CENTER" && (
                  <AppleFormField label="Cơ sở / Trung tâm đào tạo (Chọn một hoặc nhiều cơ sở)" required>
                    <TextField
                      select
                      fullWidth
                      value={form.selectedCenterIds}
                      onChange={(event) => {
                        const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
                        setForm((f) => ({ ...f, scopeId: val.join(", "), selectedCenterIds: val }));
                      }}
                      slotProps={{
                        select: {
                          displayEmpty: true,
                          multiple: true,
                          renderValue: (selected) => {
                            const arr = Array.isArray(selected) ? selected : [];
                            if (!arr.length) {
                              return <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>Chọn cơ sở đào tạo...</Typography>;
                            }
                            return (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {arr.map((id) => {
                                  const c = DEFAULT_CENTER_OPTIONS.find((item) => item.id === id);
                                  return (
                                    <Chip
                                      key={id}
                                      size="small"
                                      label={c ? c.name : id}
                                      sx={{
                                        bgcolor: "rgba(0, 113, 227, 0.08)",
                                        borderRadius: "6px",
                                        color: appleDesign.colors.blue,
                                        fontSize: "0.75rem",
                                        fontWeight: 650,
                                        height: 24,
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            );
                          },
                        },
                      }}
                      sx={appleCleanInputSx}
                    >
                      {DEFAULT_CENTER_OPTIONS.map((center) => (
                        <MenuItem key={center.id} value={center.id} sx={{ py: 0.5 }}>
                          <Checkbox size="small" checked={form.selectedCenterIds.includes(center.id)} sx={{ mr: 1, p: 0.5 }} />
                          <ListItemText primary={<Typography sx={{ fontSize: "0.85rem", fontWeight: 650 }}>{center.name}</Typography>} />
                        </MenuItem>
                      ))}
                    </TextField>
                  </AppleFormField>
                )}

                {/* 6. Toàn tổ chức hoặc Toàn hệ thống Notice */}
                {["SYSTEM", "TENANT"].includes(form.scopeType) && (
                  <Box
                    sx={{
                      alignItems: "flex-start",
                      bgcolor: "rgba(0, 113, 227, 0.04)",
                      border: "1px solid rgba(0, 113, 227, 0.15)",
                      borderRadius: "12px",
                      display: "flex",
                      gap: 1.5,
                      p: 1.75,
                    }}
                  >
                    <CheckCircleRoundedIcon sx={{ color: appleDesign.colors.blue, fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ color: appleDesign.colors.blue, fontSize: "0.825rem", fontWeight: 700 }}>
                        {form.scopeType === "SYSTEM" ? "Toàn bộ hệ thống ERG" : `Toàn tổ chức (${tenantId})`}
                      </Typography>
                      <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.76rem", lineHeight: 1.45, mt: 0.25 }}>
                        Tài khoản sẽ được tự động kích hoạt quyền hạn trên tất cả các trường học và cơ sở thuộc tổ chức.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : null}

            {step === 3 ? (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Typography
                  sx={{
                    color: appleDesign.colors.textPrimary,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Chọn phương thức cấp thông tin đăng nhập
                </Typography>
                <Box
                  onClick={() => set("credentialDelivery", "EMAIL_INVITE")}
                  sx={{
                    alignItems: "center",
                    bgcolor: form.credentialDelivery === "EMAIL_INVITE" ? "rgba(0, 113, 227, 0.04)" : "#FFFFFF",
                    border: `1.5px solid ${
                      form.credentialDelivery === "EMAIL_INVITE" ? appleDesign.colors.blue : appleDesign.colors.borderMedium
                    }`,
                    borderRadius: "14px",
                    cursor: "pointer",
                    display: "flex",
                    gap: 1.5,
                    p: 2,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: appleDesign.colors.blue,
                    },
                  }}
                >
                  <Box
                    sx={{
                      alignItems: "center",
                      bgcolor: form.credentialDelivery === "EMAIL_INVITE" ? appleDesign.colors.blueSoft : "rgba(0, 0, 0, 0.04)",
                      borderRadius: "10px",
                      color: form.credentialDelivery === "EMAIL_INVITE" ? appleDesign.colors.blue : appleDesign.colors.textSecondary,
                      display: "flex",
                      height: 40,
                      justifyContent: "center",
                      width: 40,
                    }}
                  >
                    <MailOutlineRoundedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 700 }}>
                      Gửi thư mời qua Email
                    </Typography>
                    <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.78rem", mt: 0.25 }}>
                      Hệ thống tự động gửi thư mời và thông tin tài khoản đăng nhập trực tiếp tới email nhân sự.
                    </Typography>
                  </Box>
                </Box>

                <Box
                  onClick={() => set("credentialDelivery", "ONE_TIME_PASSWORD")}
                  sx={{
                    alignItems: "center",
                    bgcolor: form.credentialDelivery === "ONE_TIME_PASSWORD" ? "rgba(0, 113, 227, 0.04)" : "#FFFFFF",
                    border: `1.5px solid ${
                      form.credentialDelivery === "ONE_TIME_PASSWORD" ? appleDesign.colors.blue : appleDesign.colors.borderMedium
                    }`,
                    borderRadius: "14px",
                    cursor: "pointer",
                    display: "flex",
                    gap: 1.5,
                    p: 2,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: appleDesign.colors.blue,
                    },
                  }}
                >
                  <Box
                    sx={{
                      alignItems: "center",
                      bgcolor: form.credentialDelivery === "ONE_TIME_PASSWORD" ? appleDesign.colors.blueSoft : "rgba(0, 0, 0, 0.04)",
                      borderRadius: "10px",
                      color: form.credentialDelivery === "ONE_TIME_PASSWORD" ? appleDesign.colors.blue : appleDesign.colors.textSecondary,
                      display: "flex",
                      height: 40,
                      justifyContent: "center",
                      width: 40,
                    }}
                  >
                    <KeyRoundedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 700 }}>
                      Tạo Temporary Credential (Mật khẩu tạm thời)
                    </Typography>
                    <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.78rem", mt: 0.25 }}>
                      Hiển thị mật khẩu trên màn hình để bàn giao ngay, đồng thời hệ thống gửi thông tin đăng nhập qua email.
                    </Typography>
                  </Box>
                </Box>

                <Alert
                  severity="info"
                  sx={{
                    bgcolor: "rgba(0, 113, 227, 0.04)",
                    border: "1px solid rgba(0, 113, 227, 0.15)",
                    borderRadius: "10px",
                    color: appleDesign.colors.blue,
                    mt: 1,
                  }}
                >
                  Dù chọn phương thức nào, hệ thống đều gửi email chứa thông tin tài khoản và hướng dẫn đăng nhập đến email nhân sự.
                </Alert>
              </Box>
            ) : null}

            {step === 4 ? (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Review label="Nhân sự" value={`${form.fullName} · ${form.employeeCode}`} />
                <Review label="Liên hệ" value={`${form.email}${form.phone ? ` · ${form.phone}` : ""}`} />
                <Review label="Nghề nghiệp" value={`${form.jobTitle}${form.departmentId ? ` · ${form.departmentId}` : ""}`} />
                <Review
                  label="Nhóm quyền đã cấp"
                  value={chosenRoles.map((r) => getRoleMeta(r).label).join(", ") || "Chưa chọn quyền"}
                />
                <Review
                  label="Phạm vi áp dụng"
                  value={`${getScopeMeta(form.scopeType).label}: ${effectiveScopeId || "Toàn tổ chức"}`}
                />
                <Review
                  label="Phương thức cấp mật khẩu"
                  value={form.credentialDelivery === "EMAIL_INVITE" ? "Gửi thư mời qua Email" : "Tạo Temporary Credential một lần"}
                />
              </Box>
            ) : null}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${appleDesign.colors.border}`,
          px: { sm: 3, xs: 2.5 },
          py: 2,
        }}
      >
        {oneTimePassword ? (
          <Button
            variant="contained"
            onClick={close}
            sx={{
              bgcolor: `${appleDesign.colors.blue} !important`,
              borderRadius: "10px",
              boxShadow: appleDesign.shadows.button,
              fontWeight: 650,
              textTransform: "none",
              "&:hover": { bgcolor: `${appleDesign.colors.blueHover} !important` },
            }}
          >
            Đã lưu credential an toàn
          </Button>
        ) : (
          <>
            <Button
              variant="text"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              sx={{
                borderRadius: "10px",
                color: `${appleDesign.colors.textSecondary} !important`,
                fontWeight: 650,
                px: 2,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04) !important",
                  color: `${appleDesign.colors.textPrimary} !important`,
                },
                "&.Mui-disabled": {
                  color: "rgba(0, 0, 0, 0.25) !important",
                },
              }}
            >
              Quay lại
            </Button>
            {step < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setStep((value) => value + 1)}
                disabled={!valid}
                sx={{
                  bgcolor: `${appleDesign.colors.blue} !important`,
                  borderRadius: "10px",
                  boxShadow: appleDesign.shadows.button,
                  color: "#FFFFFF !important",
                  fontWeight: 650,
                  px: 2.5,
                  textTransform: "none",
                  "&:hover": { bgcolor: `${appleDesign.colors.blueHover} !important` },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(0, 0, 0, 0.12) !important",
                    boxShadow: "none",
                    color: "rgba(0, 0, 0, 0.35) !important",
                  },
                }}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => void submit()}
                disabled={commands.create.isPending || !valid}
                startIcon={commands.create.isPending ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : undefined}
                sx={{
                  bgcolor: `${appleDesign.colors.blue} !important`,
                  borderRadius: "10px",
                  boxShadow: appleDesign.shadows.button,
                  color: "#FFFFFF !important",
                  fontWeight: 650,
                  px: 2.5,
                  textTransform: "none",
                  "&:hover": { bgcolor: `${appleDesign.colors.blueHover} !important` },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(0, 0, 0, 0.12) !important",
                    boxShadow: "none",
                    color: "rgba(0, 0, 0, 0.35) !important",
                  },
                }}
              >
                {commands.create.isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { sm: "1fr 1fr", xs: "1fr" },
        pt: 0.5,
      }}
    >
      {children}
    </Box>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        bgcolor: appleDesign.colors.surfaceSubtle,
        border: `1px solid ${appleDesign.colors.border}`,
        borderRadius: "12px",
        p: 1.75,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: appleDesign.colors.textTertiary,
          fontWeight: 650,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: appleDesign.colors.textPrimary,
          fontWeight: 750,
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
