import { ErgContentBand } from "@/components/erg-mui/erg-layout";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { AuditTrailWorkspace } from "@/features/audit/components/audit-trail-workspace";

/** Admin "Nhật ký hệ thống": who changed what, when, with what result. Needs `audit.read` (route matrix). */
export function AuditLogPage() {
  return (
    <ErgContentBand>
      <ErgPageHeader description="Mọi thao tác thêm, sửa, xoá, lọc theo người, thời gian, chức năng và kết quả." title="Nhật ký hệ thống" />
      <AuditTrailWorkspace />
    </ErgContentBand>
  );
}
