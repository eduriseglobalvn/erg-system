import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { AcademicYearFields } from "@/features/lcms/school-management/components/academic-year-fields";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import type { SchoolDraft } from "@/features/lcms/school-management/types/school-management-types";

export default function SchoolProfileScreen() {
  const { saveSchool, selectedSchool } = useSchoolManagementContext();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<SchoolDraft | null>(() => selectedSchool ? toDraft(selectedSchool) : null);
  useEffect(() => {
    if (selectedSchool) setDraft(toDraft(selectedSchool));
  }, [selectedSchool]);
  if (!selectedSchool || !draft) return null;
  function field<K extends keyof SchoolDraft>(key: K, value: SchoolDraft[K]) { setSaved(false); setDraft((current) => current ? { ...current, [key]: value } : current); }
  async function save() { if (!draft || !selectedSchool) return; await saveSchool(draft, selectedSchool.id); setSaved(true); }
  return <SchoolPageShell title="Hồ sơ trường" description="Thông tin pháp lý, đầu mối vận hành và trạng thái liên kết với ERG." action={<Button color={saved ? "success" : "primary"} onClick={() => void save()} startIcon={<SaveRoundedIcon />} variant="contained">{saved ? "Đã lưu" : "Lưu thay đổi"}</Button>}>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 320px" } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}><Typography sx={{ fontWeight: 850 }} variant="h6">Thông tin nhận diện</Typography><Typography color="text.secondary" variant="body2">Dữ liệu này được dùng xuyên suốt các phân hệ LMS và báo cáo.</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mt: 3 }}><TextField label="Tên trường" required value={draft.name} onChange={(e) => field("name", e.target.value)} /><TextField helperText="ID do hệ thống tự động cấp" label="ID trường" slotProps={{ input: { readOnly: true } }} value={selectedSchool.id} /><TextField label="Địa chỉ" value={draft.address} onChange={(e) => field("address", e.target.value)} sx={{ gridColumn: { sm: "1/-1" } }} /><TextField label="Quận / Huyện" value={draft.district} onChange={(e) => field("district", e.target.value)} /><Box sx={{ display: "grid", gap: 2, gridColumn: { sm: "1 / -1" }, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}><AcademicYearFields onChange={(value) => field("academicYear", value)} value={draft.academicYear} /></Box></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: "fit-content", p: 2.5 }}><Typography sx={{ fontWeight: 850 }}>Đầu mối & liên kết</Typography><Box sx={{ display: "grid", gap: 2, mt: 2 }}><TextField label="Hiệu trưởng / đầu mối" value={draft.principal} onChange={(e) => field("principal", e.target.value)} /><TextField label="Điện thoại" value={draft.contactPhone} onChange={(e) => field("contactPhone", e.target.value)} /><TextField label="Email" type="email" value={draft.contactEmail} onChange={(e) => field("contactEmail", e.target.value)} /><TextField label="Trạng thái" select value={draft.status} onChange={(e) => field("status", e.target.value as SchoolDraft["status"])}><MenuItem value="onboarding">Đang triển khai</MenuItem><MenuItem value="active">Đang vận hành</MenuItem><MenuItem value="paused">Tạm dừng</MenuItem></TextField></Box></Paper>
    </Box>
  </SchoolPageShell>;
}

function toDraft(school: NonNullable<ReturnType<typeof useSchoolManagementContext>["selectedSchool"]>): SchoolDraft { return { name: school.name, address: school.address, district: school.district, principal: school.principal, contactPhone: school.contactPhone, contactEmail: school.contactEmail, academicYear: school.academicYear, schoolType: school.schoolType, status: school.status }; }
