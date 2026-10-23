import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolStepSurface } from "@/features/lcms/school-management/components/setup/school-step-surface";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";

export function SchoolReviewStep() {
  const { selectedSchool } = useSchoolManagementContext();
  if (!selectedSchool) return null;
  const meta = schoolTypeMeta[selectedSchool.schoolType];
  const usesGrades = schoolTypeUsesGrades(selectedSchool.schoolType);
  const structureValid = selectedSchool.classes.length > 0 && (!usesGrades || selectedSchool.classes.every((classroom) => selectedSchool.grades.includes(classroom.grade)));
  const checks = [
    { label: "Thông tin & loại hình", detail: `${meta.label} · ID ${selectedSchool.id}`, done: Boolean(selectedSchool.name && selectedSchool.id && selectedSchool.schoolType) },
    { label: "Cơ cấu đào tạo", detail: usesGrades ? `${selectedSchool.grades.length} khối · ${selectedSchool.classes.length} lớp` : `${selectedSchool.classes.length} ${meta.classLabel.toLowerCase()} · không dùng khối`, done: structureValid },
    { label: `Danh sách ${meta.learnerLabel.toLowerCase()}`, detail: `${selectedSchool.students.length} bản ghi`, done: selectedSchool.students.length > 0 },
    { label: `${meta.subjectLabel} & ghi danh`, detail: `${selectedSchool.subjects.length} ${meta.subjectLabel.toLowerCase()} đã đăng ký`, done: selectedSchool.subjects.length > 0 },
  ];
  const complete = checks.filter((item) => item.done).length;
  const percent = Math.round((complete / checks.length) * 100);

  return <SchoolStepSurface description="Kiểm tra toàn bộ dữ liệu đầu vào trước khi chuyển đơn vị sang vận hành chính thức." eyebrow="Bước 5" title="Rà soát & hoàn tất">
    <Paper variant="outlined" sx={{ mb: 2, p: 2.25 }}><Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}><Box><Typography sx={{ fontWeight: 900 }}>Mức độ sẵn sàng</Typography><Typography color="text.secondary" variant="body2">{complete}/{checks.length} hạng mục đã hoàn thành</Typography></Box><Typography color={percent === 100 ? "success.main" : "primary.main"} sx={{ fontSize: 26, fontWeight: 900 }}>{percent}%</Typography></Box><LinearProgress color={percent === 100 ? "success" : "primary"} value={percent} variant="determinate" /></Paper>
    <Box sx={{ display: "grid", gap: 1 }}>{checks.map((item) => <Paper key={item.label} variant="outlined" sx={{ alignItems: "center", borderColor: item.done ? "success.200" : "divider", display: "flex", gap: 1.5, p: 1.75 }}>
      {item.done ? <CheckCircleRoundedIcon color="success" /> : <RadioButtonUncheckedRoundedIcon color="disabled" />}
      <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{item.label}</Typography><Typography color="text.secondary" variant="body2">{item.detail}</Typography></Box>
      <Chip color={item.done ? "success" : "default"} label={item.done ? "Hoàn tất" : "Cần bổ sung"} size="small" />
    </Paper>)}</Box>
    <Paper sx={{ bgcolor: percent === 100 ? "success.50" : "background.default", borderColor: percent === 100 ? "success.200" : "divider", mt: 2, p: 2 }} variant="outlined"><Typography sx={{ fontWeight: 850 }}>{percent === 100 ? "Đơn vị đã sẵn sàng vận hành" : "Chưa nên kích hoạt chính thức"}</Typography><Typography color="text.secondary" variant="body2">{percent === 100 ? "Tất cả dữ liệu nền đã đầy đủ. Bạn vẫn có thể quay lại từng bước để chỉnh sửa." : "Hoàn thiện các hạng mục còn thiếu; hệ thống giữ nguyên dữ liệu đã nhập khi chuyển bước."}</Typography></Paper>
  </SchoolStepSurface>;
}
