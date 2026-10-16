import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { UserAccessControlWorkspace } from "@/features/lcms/admin-operations/components/user-access-control-workspace";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import type { ManagementScope } from "@/types/scope-types";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { AdminOverview } from "./admin-operations-overview";
import { CenterManagement } from "./admin-operations-center-management";
import { InternalDocsWorkspace, SheetImportWorkspace, getScopeDescription, getScopedCenters } from "./admin-operations-support";

export type AdminOperationsWorkspaceProps = {
  activeLeaf: DashboardLeaf;
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
  managementScope: ManagementScope;
  onOpenLeaf: (leafId: string) => void;
};

export function AdminOperationsWorkspace({
  activeLeaf,
  centers,
  classes,
  managementScope,
  onOpenLeaf,
}: AdminOperationsWorkspaceProps) {
  const scopedCenters = getScopedCenters(managementScope, centers);
  const scopedCenterIds = scopedCenters.map((center) => center.id);
  const scopedClasses = classes.filter((snapshot) => scopedCenterIds.includes(snapshot.schoolId));
  const scopedStudentCount = scopedCenters.reduce((total, center) => total + center.activeStudents, 0);
  const scopeDescription = getScopeDescription(managementScope, scopedCenters);

  if (activeLeaf.variant === "admin-members") {
    return (
      <main className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--background)] p-4 pb-24 scroll-pb-24">
        <UserAccessControlWorkspace defaultSection="profile" scopeDescription={scopeDescription} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-permissions") {
    return (
      <main className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--background)] p-4 pb-24 scroll-pb-24">
        <UserAccessControlWorkspace defaultSection="access" scopeDescription={scopeDescription} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-internal-docs") {
    return (
      <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--background)]">
        <InternalDocsWorkspace activeLeaf={activeLeaf} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-centers") {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-[var(--background)] p-3 lg:p-4">
        <CenterManagement
          centers={scopedCenters}
          classes={scopedClasses}
          managementScope={managementScope}
          onCreateUnit={() => onOpenLeaf("admin-create-unit")}
          scopeDescription={scopeDescription}
        />
      </main>
    );
  }

  return (
    <DashboardPageShell
      badge="Admin ERG"
      title={activeLeaf.title}
      description={activeLeaf.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={getAdminActions(activeLeaf, onOpenLeaf)}
      headerContent={
        <div className="flex flex-col gap-2 rounded-lg border border-[#d9e2ef] bg-[#f8fbff] px-3 py-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400">Phạm vi đang xem</p>
            <p className="truncate text-xs font-bold text-slate-800">{scopeDescription}</p>
          </div>
          <Chip label="Quyền ERG" size="small" color="secondary" className="min-h-6 text-[11px]" />
        </div>
      }
    >
      {activeLeaf.variant === "admin-overview" ? (
        <AdminOverview
          centers={scopedCenters}
          classCount={scopedClasses.length}
          onOpenLeaf={onOpenLeaf}
          studentCount={scopedStudentCount}
        />
      ) : null}
      {activeLeaf.variant === "admin-sheet-import" ? (
        <SheetImportWorkspace managementScope={managementScope} centers={scopedCenters} classes={scopedClasses} />
      ) : null}
    </DashboardPageShell>
  );
}

export function getAdminActions(activeLeaf: DashboardLeaf, onOpenLeaf: (leafId: string) => void) {
  if (activeLeaf.variant === "admin-overview") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button disabled title="Chưa có contract báo cáo tổng hợp cho workspace này." variant="outlined" size="small">Xuất báo cáo</Button>
        <Button variant="outlined" size="small" onClick={() => onOpenLeaf("resources")}>Tài nguyên</Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => onOpenLeaf("admin-create-unit")}
        >
          Tạo trường/trung tâm
        </Button>
      </div>
    );
  }

  if (activeLeaf.variant === "admin-centers") {
    return null;
  }

  if (activeLeaf.variant === "admin-members") {
    return <Button disabled title="Mở User Access Control để tạo thành viên theo contract." variant="contained" size="small">Thêm thành viên</Button>;
  }

  return <Button disabled title="Chưa có contract báo cáo cho workspace này." variant="outlined" size="small">Xuất báo cáo</Button>;
}
