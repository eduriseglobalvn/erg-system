import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { EmployeeSecurityTimeline } from "@/features/employee-management/components/employee-security-timeline";
import { useEmployeeCommands, useEmployeeDetail } from "@/features/employee-management/hooks/use-employee-management";

type ConfirmAction = "STATUS" | "RESET" | null;

export function EmployeeDetailDrawer({ tenantId, userId, onClose }: { tenantId: string; userId?: string; onClose: () => void }) {
  const query = useEmployeeDetail(tenantId, userId);
  const commands = useEmployeeCommands(tenantId);
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<string>();
  const [temporaryCredential, setTemporaryCredential] = useState<string>();
  const [form, setForm] = useState({ fullName: "", phone: "", employeeCode: "", departmentId: "", jobTitle: "", employmentType: "", experienceYears: "", experienceSummary: "", managerId: "", workLocation: "" });
  const employee = query.data;
  const account = employee?.account.user;
  const profile = employee?.profile;
  useEffect(() => {
    if (!employee) return;
    setForm({
      fullName: String(account?.fullName ?? ""), phone: String(account?.phone ?? ""), employeeCode: profile?.employeeCode ?? "",
      departmentId: profile?.departmentId ?? "", jobTitle: profile?.jobTitle ?? "", employmentType: profile?.employmentType ?? "",
      experienceYears: profile?.experienceYears == null ? "" : String(profile.experienceYears), experienceSummary: profile?.experienceSummary ?? "",
      managerId: profile?.managerId ?? "", workLocation: profile?.workLocation ?? "",
    });
  }, [account, employee, profile]);
  const set = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const save = async () => {
    if (!userId) return;
    await commands.update.mutateAsync({ userId, payload: {
      fullName: form.fullName.trim(), phone: form.phone.trim(),
      profile: {
        employeeCode: form.employeeCode.trim(), departmentId: form.departmentId.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined, employmentType: form.employmentType.trim() || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        experienceSummary: form.experienceSummary.trim() || undefined, managerId: form.managerId.trim() || undefined,
        workLocation: form.workLocation.trim() || undefined,
      },
    } });
    setEditing(false);
  };
  const confirm = async () => {
    if (!userId || !account) return;
    if (confirmAction === "STATUS") await commands.status.mutateAsync({ userId, status: account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
    if (confirmAction === "RESET") {
      const result = await commands.resetCredential.mutateAsync({ userId, delivery: "ONE_TIME_PASSWORD" });
      if (result.oneTimePassword) setTemporaryCredential(result.oneTimePassword);
    }
    setConfirmAction(null);
  };
  const revokeSession = async () => {
    if (!userId || !sessionToRevoke) return;
    await commands.revokeSession.mutateAsync({ userId, sessionId: sessionToRevoke });
    setSessionToRevoke(undefined);
  };

  return <>
    <Drawer anchor="right" open={Boolean(userId)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", md: 680 }, p: 3 } } }}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 2 }}><Box><Typography variant="overline" color="text.secondary">Hồ sơ nhân sự</Typography><Typography variant="h6" sx={{ fontWeight: 850 }}>{String(account?.fullName ?? "Chi tiết nhân sự")}</Typography></Box><IconButton aria-label="Đóng hồ sơ nhân sự" onClick={onClose}><CloseRoundedIcon /></IconButton></Box>
      {query.isPending ? <ErgLoadingSkeleton rows={7} /> : null}
      {query.isError ? <ErgErrorState title="Không tải được nhân sự" description="Tài khoản không tồn tại trong tenant hiện tại hoặc bạn không có quyền." /> : null}
      {employee && userId ? <>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}><ErgStatusChip label={String(account?.status)} tone={account?.status === "ACTIVE" ? "success" : "warning"} /><Button size="small" variant="outlined" onClick={() => setEditing(true)}>Chỉnh sửa hồ sơ</Button><Button size="small" variant="outlined" onClick={() => setConfirmAction("STATUS")}>{account?.status === "ACTIVE" ? "Deactive" : "Active"}</Button><Button size="small" color="warning" variant="outlined" onClick={() => setConfirmAction("RESET")}>Reset credential</Button></Box>
        {temporaryCredential ? <Box sx={{ bgcolor: "warning.light", borderRadius: 2, mb: 2, p: 1.5 }}><Typography variant="caption">Temporary credential — chỉ hiển thị lần này</Typography><Typography sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 800 }}>{temporaryCredential}</Typography></Box> : null}
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }}><Tab label="Thông tin" /><Tab label="Quyền & scope" /><Tab label="Sessions" /><Tab label="Security log" /></Tabs>
        {tab === 0 ? <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}><Field label="Mã nhân viên" value={profile?.employeeCode} /><Field label="Email" value={account?.email} /><Field label="Điện thoại" value={account?.phone} /><Field label="Phòng ban" value={profile?.departmentId} /><Field label="Chức danh" value={profile?.jobTitle} /><Field label="Kinh nghiệm" value={profile?.experienceYears == null ? undefined : `${profile.experienceYears} năm`} /><Field label="Nơi làm việc" value={profile?.workLocation} /><Field label="Quản lý trực tiếp" value={profile?.managerId} /></Box> : null}
        {tab === 1 ? <Box sx={{ display: "grid", gap: 1 }}><Field label="Nhóm quyền" value={account?.roles?.join(", ")} /><Field label="Tenant" value={profile?.tenantId} /><Typography color="text.secondary" variant="caption">Scoped assignments được quản lý từ thao tác nhanh ở danh sách nhân sự và audit theo authz version.</Typography></Box> : null}
        {tab === 2 ? <Box sx={{ display: "grid", gap: 1 }}>{employee.account.sessions.length ? employee.account.sessions.map((session) => <Box key={session.sessionId} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}><Typography sx={{ fontWeight: 800 }} variant="body2">{session.deviceName || session.deviceId || "Thiết bị không xác định"}</Typography><Typography color="text.secondary" variant="caption">{session.deviceType} · {session.portal} · {session.ipAddress}</Typography>{!session.revoked ? <Button size="small" color="warning" onClick={() => setSessionToRevoke(session.sessionId)}>Thu hồi phiên</Button> : null}</Box>) : <Typography color="text.secondary">Không có session.</Typography>}</Box> : null}
        {tab === 3 ? <EmployeeSecurityTimeline tenantId={tenantId} userId={userId} /> : null}
      </> : null}
    </Drawer>
    <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="sm"><DialogTitle>Chỉnh sửa hồ sơ nhân sự</DialogTitle><DialogContent><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, pt: 1 }}><TextField label="Họ và tên" value={form.fullName} onChange={(event) => set("fullName", event.target.value)} /><TextField label="Điện thoại" value={form.phone} onChange={(event) => set("phone", event.target.value)} /><TextField label="Mã nhân viên" value={form.employeeCode} onChange={(event) => set("employeeCode", event.target.value)} /><TextField label="Phòng ban" value={form.departmentId} onChange={(event) => set("departmentId", event.target.value)} /><TextField label="Chức danh" value={form.jobTitle} onChange={(event) => set("jobTitle", event.target.value)} /><TextField label="Loại hợp đồng" value={form.employmentType} onChange={(event) => set("employmentType", event.target.value)} /><TextField label="Số năm kinh nghiệm" type="number" value={form.experienceYears} onChange={(event) => set("experienceYears", event.target.value)} /><TextField label="Nơi làm việc" value={form.workLocation} onChange={(event) => set("workLocation", event.target.value)} /><TextField label="Quản lý trực tiếp" value={form.managerId} onChange={(event) => set("managerId", event.target.value)} /><TextField label="Tóm tắt kinh nghiệm" value={form.experienceSummary} onChange={(event) => set("experienceSummary", event.target.value)} multiline minRows={2} /></Box></DialogContent><DialogActions><Button color="inherit" onClick={() => setEditing(false)}>Hủy</Button><Button variant="contained" onClick={() => void save()} disabled={commands.update.isPending || !form.fullName.trim() || !form.employeeCode.trim()}>Lưu hồ sơ</Button></DialogActions></Dialog>
    <Dialog open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)}><DialogTitle>{confirmAction === "RESET" ? "Reset credential an toàn" : "Xác nhận đổi trạng thái"}</DialogTitle><DialogContent><DialogContentText>{confirmAction === "RESET" ? "Hệ thống sẽ tạo temporary credential một lần, thu hồi session cũ và bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp." : "Thay đổi trạng thái có thể thu hồi toàn bộ session của nhân sự."}</DialogContentText></DialogContent><DialogActions><Button color="inherit" onClick={() => setConfirmAction(null)}>Hủy</Button><Button color="warning" variant="contained" onClick={() => void confirm()}>Xác nhận</Button></DialogActions></Dialog>
    <Dialog open={Boolean(sessionToRevoke)} onClose={() => setSessionToRevoke(undefined)}><DialogTitle>Thu hồi session</DialogTitle><DialogContent><DialogContentText>Thiết bị sẽ bị đăng xuất ở request tiếp theo. Hành động được ghi audit.</DialogContentText></DialogContent><DialogActions><Button color="inherit" onClick={() => setSessionToRevoke(undefined)}>Hủy</Button><Button color="warning" variant="contained" onClick={() => void revokeSession()}>Thu hồi phiên</Button></DialogActions></Dialog>
  </>;
}

function Field({ label, value }: { label: string; value: unknown }) { return <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.25 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{String(value || "Chưa cập nhật")}</Typography></Box>; }
