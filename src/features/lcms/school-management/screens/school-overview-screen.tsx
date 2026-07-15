import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Button from "@mui/material/Button";
import { SchoolOverviewPanel } from "@/features/lcms/school-management/components/school-overview-panel";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { useNavigate } from "@/routes/router-compat";

export default function SchoolOverviewScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  const navigate = useNavigate();
  if (!selectedSchool) return null;
  return <SchoolPageShell title="Tổng quan vận hành" description="Tình trạng học sinh, lớp học, môn đăng ký và các việc cần xử lý của trường." action={<Button onClick={() => navigate(`/schools/imports?schoolId=${selectedSchool.id}`)} startIcon={<FileUploadRoundedIcon />} variant="contained">Nhập dữ liệu</Button>}><SchoolOverviewPanel school={selectedSchool} /></SchoolPageShell>;
}
