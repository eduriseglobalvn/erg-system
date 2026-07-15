import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { useNavigate } from "@/routes/router-compat";

export default function SchoolSubjectsScreen() {
  const { selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  const navigate = useNavigate();
  if (!selectedSchool) return null;
  return <SchoolPageShell title="Môn học đăng ký" description="Danh mục môn trường sử dụng, quy mô ghi danh và giáo viên phụ trách." action={<Button disabled startIcon={<AddRoundedIcon />} variant="contained">Đăng ký môn</Button>}>
    <Alert severity="info" sx={{ mb: 2 }}>{unsupportedApiMessage}</Alert>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))" } }}>{selectedSchool.subjects.map((subject) => { const percent = Math.min(100, Math.round(subject.studentCount / Math.max(selectedSchool.students.length, 1) * 100)); return <Paper key={subject.id} variant="outlined" sx={{ p: 2.5 }}><Box sx={{ alignItems: "flex-start", display: "flex", justifyContent: "space-between" }}><Box><Typography color="text.secondary" sx={{ fontFamily: "var(--font-mono)" }} variant="caption">{subject.code}</Typography><Typography sx={{ fontSize: 19, fontWeight: 900 }}>{subject.name}</Typography></Box><Chip color="success" label="Đang triển khai" size="small" /></Box><Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr", my: 2 }}><Box><Typography color="text.secondary" variant="caption">Học sinh ghi danh</Typography><Typography sx={{ fontWeight: 850 }}>{subject.studentCount}</Typography></Box><Box><Typography color="text.secondary" variant="caption">Giáo viên</Typography><Typography sx={{ fontWeight: 850 }}>{subject.teacherCount}</Typography></Box></Box><LinearProgress value={percent} variant="determinate" sx={{ borderRadius: 4, height: 7 }} /><Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}><Button onClick={() => navigate(`/schools/subject-enrollments?schoolId=${selectedSchool.id}&subjectId=${subject.id}`)} startIcon={<GroupAddRoundedIcon />} size="small">Quản lý ghi danh</Button></Box></Paper>; })}</Box>
  </SchoolPageShell>;
}
