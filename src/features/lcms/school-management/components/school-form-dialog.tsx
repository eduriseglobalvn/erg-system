import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { AcademicYearFields } from "@/features/lcms/school-management/components/academic-year-fields";
import type { PartnerSchool, SchoolDraft } from "@/features/lcms/school-management/types/school-management-types";
import { schoolTypeMeta, schoolTypeOrder } from "@/features/lcms/school-management/types/school-type-config";

const emptyDraft: SchoolDraft = { name: "", address: "", district: "", principal: "", contactPhone: "", contactEmail: "", academicYear: "2026–2027", schoolType: "primary", status: "onboarding" };

export function SchoolFormDialog({ onClose, onSave, school }: { onClose: () => void; onSave: (draft: SchoolDraft) => void | Promise<void>; school?: PartnerSchool | null }) {
  const [draft, setDraft] = useState<SchoolDraft>(() => school ? { name: school.name, address: school.address, district: school.district, principal: school.principal, contactPhone: school.contactPhone, contactEmail: school.contactEmail, academicYear: school.academicYear, schoolType: school.schoolType, status: school.status } : emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function field<K extends keyof SchoolDraft>(key: K, value: SchoolDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  return <Dialog fullWidth maxWidth="md" onClose={onClose} open><DialogTitle>{school ? "Chỉnh sửa trường liên kết" : "Tạo trường mới"}<Typography color="text.secondary" variant="body2">Chỉ cần thông tin khởi tạo. Hồ sơ chi tiết sẽ được hoàn thiện trong flow tiếp theo.</Typography></DialogTitle><DialogContent sx={{ display: "grid", gap: 2.5, pt: "12px !important" }}>
    <FormControl><Typography component="legend" sx={{ fontSize: 13, fontWeight: 800, mb: 1 }}>Loại hình trường</Typography><RadioGroup onChange={(event) => field("schoolType", event.target.value as SchoolDraft["schoolType"])} value={draft.schoolType}><Paper variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, overflow: "hidden" }}>{schoolTypeOrder.map((type) => { const meta = schoolTypeMeta[type]; return <FormControlLabel key={type} control={<Radio size="small" />} label={<><Typography sx={{ fontWeight: 800 }} variant="body2">{meta.label}</Typography><Typography color="text.secondary" variant="caption">{meta.description}</Typography></>} sx={{ alignItems: "flex-start", borderBottom: "1px solid", borderColor: "divider", m: 0, minHeight: 72, px: 1.5, py: 1, "&:nth-of-type(odd)": { borderRight: { sm: "1px solid" } } }} value={type} />; })}</Paper></RadioGroup></FormControl>
    <Paper variant="outlined" sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, p: 2 }}><TextField label="Tên trường / trung tâm" required sx={{ gridColumn: { sm: "1 / -1" } }} value={draft.name} onChange={(event) => field("name", event.target.value)} /><AcademicYearFields onChange={(value) => field("academicYear", value)} value={draft.academicYear} /><TextField label="Trạng thái" select sx={{ gridColumn: { sm: "1 / -1" } }} value={draft.status} onChange={(event) => field("status", event.target.value as SchoolDraft["status"])}><MenuItem value="onboarding">Đang triển khai</MenuItem><MenuItem value="active">Đang vận hành</MenuItem><MenuItem value="paused">Tạm dừng</MenuItem></TextField></Paper>
    {error ? <Typography color="error" variant="body2">{error}</Typography> : null}
  </DialogContent><DialogActions sx={{ px: 3, py: 2 }}><Button disabled={saving} onClick={onClose}>Hủy</Button><Button disabled={!draft.name.trim() || saving} onClick={async () => { try { setSaving(true); setError(""); await onSave(draft); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu trường."); } finally { setSaving(false); } }} variant="contained">{saving ? "Đang lưu..." : school ? "Lưu thay đổi" : "Tạo & thiết lập trường"}</Button></DialogActions></Dialog>;
}
