import { AuditTrailWorkspace } from "@/features/audit/components/audit-trail-workspace";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolAuditScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  return <SchoolPageShell title="Nhật ký hoạt động" description="Theo dõi mọi thay đổi dữ liệu từ UI, API và các đợt nhập hàng loạt.">
    <AuditTrailWorkspace scopeId={selectedSchool?.id} />
  </SchoolPageShell>;
}
