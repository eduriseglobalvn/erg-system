import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolAnalyticsWorkspace } from "@/features/lcms/school-management/components/school-analytics-workspace";

export default function SchoolReportsScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  if (!selectedSchool) return null;
  return <SchoolPageShell title="Giám sát & đánh giá đào tạo"><SchoolAnalyticsWorkspace school={selectedSchool} /></SchoolPageShell>;
}
