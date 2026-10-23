import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { useEmployeeCommands, useEmployeeRoleOptions } from "@/features/employee-management/hooks/use-employee-management";
import type { CreateEmployeeRequest } from "@/features/employee-management/types/employee-management";

const steps = ["Định danh", "Thông tin nhân sự", "Role & scope", "Credential", "Review"];
const initialForm = {
  fullName: "", email: "", phone: "", recoveryEmail: "", employeeCode: "", departmentId: "",
  jobTitle: "", employmentType: "FULL_TIME", joinedAt: "", experienceYears: "", experienceSummary: "",
  managerId: "", workLocation: "", emergencyName: "", emergencyPhone: "", roleName: "",
  scopeType: "TENANT", scopeId: "", credentialDelivery: "EMAIL_INVITE" as CreateEmployeeRequest["credentialDelivery"],
};

export function CreateEmployeeWizard({ tenantId, open, onClose }: { tenantId: string; open: boolean; onClose: () => void }) {
  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useEmployeeRoleOptions(tenantId);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [oneTimePassword, setOneTimePassword] = useState<string>();
  const set = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const effectiveScopeId = form.scopeType === "SYSTEM" || form.scopeType === "TENANT" ? tenantId : form.scopeId.trim();
  const valid = [
    Boolean(form.fullName.trim() && form.email.trim()),
    Boolean(form.employeeCode.trim() && form.jobTitle.trim()),
    Boolean(form.roleName && effectiveScopeId),
    Boolean(form.credentialDelivery),
    true,
  ][step];
  const close = () => { setStep(0); setForm(initialForm); setOneTimePassword(undefined); onClose(); };
  const submit = async () => {
    const result = await commands.create.mutateAsync({
      primaryEmail: form.email.trim(), fullName: form.fullName.trim(), phone: form.phone.trim() || undefined,
      recoveryEmail: form.recoveryEmail.trim() || undefined, roleGroupIds: [form.roleName],
      policies: [{ scopeType: form.scopeType, scopeId: effectiveScopeId, roleGroup: form.roleName }],
      credentialDelivery: form.credentialDelivery,
      profile: {
        employeeCode: form.employeeCode.trim(), departmentId: form.departmentId.trim() || undefined,
        jobTitle: form.jobTitle.trim(), employmentType: form.employmentType, joinedAt: form.joinedAt || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        experienceSummary: form.experienceSummary.trim() || undefined, managerId: form.managerId.trim() || undefined,
        workLocation: form.workLocation.trim() || undefined,
        emergencyContact: form.emergencyName || form.emergencyPhone ? { name: form.emergencyName.trim(), phone: form.emergencyPhone.trim() } : undefined,
      },
    });
    if (result.account.oneTimePassword) setOneTimePassword(result.account.oneTimePassword); else close();
  };

  return <Dialog open={open} onClose={close} fullWidth maxWidth="md">
    <DialogTitle sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>Tạo tài khoản nhân sự<IconButton aria-label="Đóng trình tạo nhân sự" onClick={close}><CloseRoundedIcon /></IconButton></DialogTitle>
    <DialogContent>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>{steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
      {oneTimePassword ? <Box sx={{ display: "grid", gap: 2 }}><Alert severity="warning">Temporary credential chỉ hiển thị trong lần này. Nhân sự bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.</Alert><Box sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 2, display: "flex", gap: 1.5, p: 2 }}><Typography sx={{ flex: 1, fontFamily: "JetBrains Mono, monospace", fontSize: 18, fontWeight: 800 }}>{oneTimePassword}</Typography><Button startIcon={<ContentCopyRoundedIcon />} onClick={() => void navigator.clipboard?.writeText(oneTimePassword)}>Sao chép</Button></Box></Box> : <>
        {step === 0 ? <FormGrid><TextField label="Họ và tên" value={form.fullName} onChange={(event) => set("fullName", event.target.value)} required /><TextField label="Email công việc" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} required /><TextField label="Điện thoại" value={form.phone} onChange={(event) => set("phone", event.target.value)} /><TextField label="Email khôi phục" type="email" value={form.recoveryEmail} onChange={(event) => set("recoveryEmail", event.target.value)} /></FormGrid> : null}
        {step === 1 ? <FormGrid><TextField label="Mã nhân viên" value={form.employeeCode} onChange={(event) => set("employeeCode", event.target.value)} required /><TextField label="Chức danh" value={form.jobTitle} onChange={(event) => set("jobTitle", event.target.value)} required /><TextField label="Phòng ban" value={form.departmentId} onChange={(event) => set("departmentId", event.target.value)} /><TextField select label="Loại hợp đồng" value={form.employmentType} onChange={(event) => set("employmentType", event.target.value)}><MenuItem value="FULL_TIME">Toàn thời gian</MenuItem><MenuItem value="PART_TIME">Bán thời gian</MenuItem><MenuItem value="CONTRACTOR">Cộng tác viên</MenuItem></TextField><TextField label="Ngày vào làm" type="date" value={form.joinedAt} onChange={(event) => set("joinedAt", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Số năm kinh nghiệm" type="number" value={form.experienceYears} onChange={(event) => set("experienceYears", event.target.value)} /><TextField label="Nơi làm việc" value={form.workLocation} onChange={(event) => set("workLocation", event.target.value)} /><TextField label="Quản lý trực tiếp (ID)" value={form.managerId} onChange={(event) => set("managerId", event.target.value)} /><TextField label="Tóm tắt kinh nghiệm" value={form.experienceSummary} onChange={(event) => set("experienceSummary", event.target.value)} multiline minRows={2} sx={{ gridColumn: { sm: "1 / -1" } }} /><TextField label="Người liên hệ khẩn cấp" value={form.emergencyName} onChange={(event) => set("emergencyName", event.target.value)} /><TextField label="SĐT khẩn cấp" value={form.emergencyPhone} onChange={(event) => set("emergencyPhone", event.target.value)} /></FormGrid> : null}
        {step === 2 ? <FormGrid><TextField select label="Nhóm quyền" value={form.roleName} onChange={(event) => set("roleName", event.target.value)} required>{(rolesQuery.data ?? []).map((role) => <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>)}</TextField><TextField select label="Phạm vi" value={form.scopeType} onChange={(event) => set("scopeType", event.target.value)}><MenuItem value="SYSTEM">Toàn hệ thống</MenuItem><MenuItem value="TENANT">Tenant</MenuItem><MenuItem value="CENTER">Trung tâm</MenuItem><MenuItem value="SCHOOL">Trường</MenuItem><MenuItem value="CLASS">Lớp</MenuItem></TextField>{!(["SYSTEM", "TENANT"].includes(form.scopeType)) ? <TextField label="ID phạm vi" value={form.scopeId} onChange={(event) => set("scopeId", event.target.value)} required /> : <Alert severity="info">Scope ID được khóa theo tenant hiện tại: {tenantId}</Alert>}</FormGrid> : null}
        {step === 3 ? <FormControl><FormLabel>Cách cấp credential</FormLabel><RadioGroup value={form.credentialDelivery} onChange={(event) => set("credentialDelivery", event.target.value)}><FormControlLabel value="EMAIL_INVITE" control={<Radio />} label="Gửi lời mời qua email" /><FormControlLabel value="ONE_TIME_PASSWORD" control={<Radio />} label="Tạo temporary credential hiển thị một lần" /></RadioGroup><Alert severity="info">Mọi session cũ sẽ bị thu hồi khi reset credential; tài khoản mới luôn phải đổi mật khẩu ở lần đăng nhập đầu.</Alert></FormControl> : null}
        {step === 4 ? <Box sx={{ display: "grid", gap: 1.25 }}><Review label="Nhân sự" value={`${form.fullName} · ${form.employeeCode}`} /><Review label="Liên hệ" value={`${form.email}${form.phone ? ` · ${form.phone}` : ""}`} /><Review label="Nghề nghiệp" value={`${form.jobTitle}${form.departmentId ? ` · ${form.departmentId}` : ""}`} /><Review label="Quyền & scope" value={`${form.roleName} · ${form.scopeType}:${effectiveScopeId}`} /><Review label="Credential" value={form.credentialDelivery === "EMAIL_INVITE" ? "Email invite" : "Temporary credential một lần"} /></Box> : null}
      </>}
    </DialogContent>
    <DialogActions>{oneTimePassword ? <Button variant="contained" onClick={close}>Đã lưu credential an toàn</Button> : <><Button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>Quay lại</Button>{step < steps.length - 1 ? <Button variant="contained" onClick={() => setStep((value) => value + 1)} disabled={!valid}>Tiếp tục</Button> : <Button variant="contained" onClick={() => void submit()} disabled={commands.create.isPending || !valid}>Tạo tài khoản</Button>}</>}</DialogActions>
  </Dialog>;
}

function FormGrid({ children }: { children: React.ReactNode }) { return <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>{children}</Box>; }
function Review({ label, value }: { label: string; value: string }) { return <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.5 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 750 }}>{value}</Typography></Box>; }
