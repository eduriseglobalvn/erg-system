import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Button from "@mui/material/Button";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { TrainingMonitoringWorkspace } from "@/features/lcms/school-management/components/training/training-monitoring-workspace";

export default function SchoolReportsScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  if (!selectedSchool) return null;
  return <SchoolPageShell title="Giám sát & đánh giá đào tạo" action={<Button startIcon={<DownloadRoundedIcon />} variant="outlined">Xuất báo cáo</Button>}><TrainingMonitoringWorkspace school={selectedSchool} /></SchoolPageShell>;
}
