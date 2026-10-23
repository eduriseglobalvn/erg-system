import { AssessmentGovernanceWorkspace } from "@/features/lcms/school-management/components/assessment/assessment-governance-workspace";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";

export default function SchoolAssessmentsScreen() {
  return <SchoolPageShell title="Kiểm tra & quản trị câu hỏi" description="Kiểm soát nguồn đề, quyền bổ sung câu hỏi, khung giờ sử dụng và chính sách xóa dữ liệu tạm."><AssessmentGovernanceWorkspace /></SchoolPageShell>;
}
