import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { AcademicYearFields } from "@/features/lcms/school-management/components/academic-year-fields";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { schoolTypeMeta, schoolTypeOrder } from "@/features/lcms/school-management/types/school-type-config";
import type { PartnerSchool, SchoolDraft } from "@/features/lcms/school-management/types/school-management-types";

/** Called before the flow leaves this step; it runs `go` itself once the changes are saved or undone. */
export type SchoolStepLeaveGuard = (go: () => void) => void;

export function SchoolInformationStep({ onLeaveGuard }: { onLeaveGuard?: (guard: SchoolStepLeaveGuard | null) => void }) {
  const { saveSchool, selectedSchool } = useSchoolManagementContext();
  if (!selectedSchool) return null;
  return <SchoolInformationForm key={`${selectedSchool.id}-${selectedSchool.version ?? 0}`} onLeaveGuard={onLeaveGuard} saveSchool={saveSchool} school={selectedSchool} />;
}

function SchoolInformationForm({ onLeaveGuard, saveSchool, school }: { onLeaveGuard?: (guard: SchoolStepLeaveGuard | null) => void; saveSchool: (draft: SchoolDraft, schoolId?: string) => Promise<string>; school: PartnerSchool }) {
  const [draft, setDraft] = useState<SchoolDraft>(() => toDraft(school));
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);
  const hasOperationalData = school.classes.length > 0 || (school.studentCount ?? 0) > 0;
  const nameMissing = draft.name.trim() === "";
  const typeChanged = draft.schoolType !== school.schoolType;
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(school));

  useEffect(() => {
    if (!onLeaveGuard) return;
    onLeaveGuard(dirty ? (go) => setPendingLeave(() => go) : null);
    return () => onLeaveGuard(null);
  }, [dirty, onLeaveGuard]);

  function field<K extends keyof SchoolDraft>(key: K, value: SchoolDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function confirmSave() {
    if (nameMissing || !pendingLeave) return;
    setSaving(true);
    try {
      await saveSchool(draft, school.id);
      pendingLeave();
    } finally {
      setSaving(false);
      setPendingLeave(null);
    }
  }

  function discard() {
    setDraft(toDraft(school));
    pendingLeave?.();
    setPendingLeave(null);
  }

  return <>
    <SchoolStepSurface
      description="Loại hình trường là dữ liệu gốc, quyết định cấu trúc khối và cách nhập lớp ở bước sau."
      eyebrow="Bước 1"
      title="Thông tin & loại hình"
    >
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Loại hình đơn vị</Typography>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, mb: 2.5 }}>
        {schoolTypeOrder.map((type) => {
          const meta = schoolTypeMeta[type];
          const selected = draft.schoolType === type;
          return <Paper
            component="button"
            key={type}
            onClick={() => field("schoolType", type)}
            type="button"
            variant="outlined"
            sx={{ bgcolor: selected ? "primary.50" : "background.paper", borderColor: selected ? "primary.main" : "divider", color: "text.primary", cursor: "pointer", minHeight: 104, p: 1.5, textAlign: "left", transition: "border-color 120ms ease, background-color 120ms ease", "&:hover": { borderColor: "primary.main" } }}
          >
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><Typography sx={{ fontWeight: 600 }} variant="body2">{meta.shortLabel}</Typography>{selected ? <CheckRoundedIcon color="primary" fontSize="small" /> : null}</Box>
            <Typography color="text.secondary" sx={{ display: "block", mt: 0.75, lineHeight: 1.4 }} variant="caption">{meta.description}</Typography>
          </Paper>;
        })}
      </Box>
      {typeChanged ? <Alert severity="info" sx={{ mb: 2 }}>Sau khi lưu, hệ thống sẽ chuyển cơ cấu sang <strong>{schoolTypeMeta[draft.schoolType].label}</strong>.</Alert> : null}
      <Paper variant="outlined" sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, p: 2 }}>
        <TextField error={nameMissing} helperText={nameMissing ? "Tên trường không được trống" : undefined} label="Tên trường / trung tâm" required value={draft.name} onChange={(event) => field("name", event.target.value)} />
        <TextField helperText="ID do hệ thống tự động cấp" label="ID trường" slotProps={{ input: { readOnly: true } }} value={school.id} />
        <TextField label="Địa chỉ" value={draft.address} onChange={(event) => field("address", event.target.value)} sx={{ gridColumn: { md: "1 / -1" } }} />
        <TextField label="Quận / Huyện" value={draft.district} onChange={(event) => field("district", event.target.value)} />
        <Box sx={{ display: "grid", gap: 2, gridColumn: { md: "1 / -1" }, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}><AcademicYearFields onChange={(value) => field("academicYear", value)} value={draft.academicYear} /></Box>
        <TextField label="Hiệu trưởng / đầu mối" value={draft.principal} onChange={(event) => field("principal", event.target.value)} />
        <TextField label="Điện thoại" value={draft.contactPhone} onChange={(event) => field("contactPhone", event.target.value)} />
        <TextField label="Email liên hệ" type="email" value={draft.contactEmail} onChange={(event) => field("contactEmail", event.target.value)} />
        <TextField label="Trạng thái" select value={draft.status} onChange={(event) => field("status", event.target.value as SchoolDraft["status"])}>{draft.status === "onboarding" ? <MenuItem disabled value="onboarding">Đang triển khai</MenuItem> : null}<MenuItem value="active">Đang vận hành</MenuItem><MenuItem value="paused">Tạm dừng</MenuItem><MenuItem disabled value="archived">Đã lưu trữ</MenuItem></TextField>
      </Paper>
    </SchoolStepSurface>
    <Dialog maxWidth="sm" onClose={() => { if (!saving) setPendingLeave(null); }} open={pendingLeave !== null}>
      <DialogTitle sx={{ alignItems: "center", display: "flex", gap: 1 }}>{typeChanged && hasOperationalData ? <WarningAmberRoundedIcon color="warning" /> : null}Lưu thay đổi thông tin trường?</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5 }}>
        <Typography color="text.secondary" variant="body2">Bạn đã sửa thông tin ở bước này. Xác nhận để lưu, hoặc hủy bỏ để trả lại thông tin cũ.</Typography>
        {typeChanged && hasOperationalData ? <Alert severity="warning">Đổi loại hình sẽ tạo lại dải khối chuẩn. Lớp và người học vẫn được giữ, nhưng các liên kết khối không còn phù hợp sẽ chuyển về trạng thái chưa gán để bạn rà soát.</Alert> : null}
        {nameMissing ? <Alert severity="error">Tên trường không được trống. Hủy bỏ hoặc đóng hộp này để nhập tên.</Alert> : null}
      </DialogContent>
      <DialogActions><Button disabled={saving} onClick={discard} variant="text">Hủy bỏ</Button><Button disabled={nameMissing || saving} onClick={() => void confirmSave()} variant="contained">Xác nhận lưu</Button></DialogActions>
    </Dialog>
  </>;
}

function toDraft(school: NonNullable<ReturnType<typeof useSchoolManagementContext>["selectedSchool"]>): SchoolDraft {
  return { name: school.name, address: school.address, district: school.district, principal: school.principal, contactPhone: school.contactPhone, contactEmail: school.contactEmail, academicYear: school.academicYear, schoolType: school.schoolType, status: school.status };
}
