import AlertTriangle from "@mui/icons-material/WarningAmberOutlined";
import CheckCircle from "@mui/icons-material/CheckCircleOutlined";
import RefreshCw from "@mui/icons-material/Refresh";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { StudentSheetImportWorkspace } from "@/features/lcms/admin-operations/components/student-sheet-import-workspace";
import { LearningResourceAuthoringWorkspace } from "@/features/lcms/admin-operations/components/learning-resource-authoring-workspace";
import { LearningResourceLibraryPage } from "@/features/lms/learning-resources/components/learning-resource-library-page";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";

export function OperationalErrorState({
  className,
  message,
  onRetry,
  title,
}: {
  className?: string;
  message: string;
  onRetry: () => void;
  title: string;
}) {
  return (
    <div className={cn("rounded-xl border border-rose-200 bg-rose-50/75 p-3", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-rose-800">{title}</div>
          <p className="mt-1 break-words text-xs leading-5 text-rose-700">{message}</p>
        </div>
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={onRetry}
          className="h-8 shrink-0 border-rose-200 bg-white px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tải lại
        </Button>
      </div>
    </div>
  );
}

export function SheetImportWorkspace({
  managementScope,
  centers,
  classes,
}: {
  managementScope: ManagementScope;
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
}) {
  return <StudentSheetImportWorkspace managementScope={managementScope} centers={centers} classes={classes} />;
}

export function InternalDocsWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf }) {
  if (activeLeaf.id === "resources" || activeLeaf.id === "admin-learning-resources" || activeLeaf.id === "admin-learning-resource-list") {
    return (
      <div className="h-full min-h-0">
        <LearningResourceLibraryPage />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 p-4">
      <LearningResourceAuthoringWorkspace activeLeaf={activeLeaf} />
    </div>
  );
}

export function CenterRow({ center }: { center: ClassroomSchool }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{center.name}</h3>
          <p className="mt-0.5 text-xs text-slate-400 font-semibold">
            {center.activeClasses} lớp đang chạy · {center.activeStudents.toLocaleString("vi-VN")} học sinh
          </p>
        </div>
        <Chip
          size="small"
          color={center.flaggedStudents > 25 ? "warning" : "success"}
          label={center.flaggedStudents > 25 ? "Cần rà soát" : "Vận hành ổn định"}
        />
      </div>
      <div className="mt-4 grid gap-3 grid-cols-3 border-t border-slate-100 pt-3">
        <FieldValue label="Hoàn thành" value={`${center.completionRate}%`} />
        <FieldValue label="Điểm TB" value={`${center.averageScore}`} />
        <FieldValue label="Hỗ trợ" value={`${center.flaggedStudents} em`} />
      </div>
    </article>
  );
}

export function ActionItem({ detail, title, urgent }: { detail: string; title: string; urgent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 transition duration-200 shadow-sm flex items-start gap-3",
      urgent 
        ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50" 
        : "border-slate-200 bg-white hover:bg-slate-50/30"
    )}>
      {urgent ? (
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
      )}
      <div>
        <h3 className="font-bold text-slate-800 text-xs">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{label}</span>
      <span className="break-words text-xs font-bold text-slate-700 mt-0.5 block">{value}</span>
    </div>
  );
}

export function getScopedCenters(managementScope: ManagementScope, centers: ClassroomSchool[]) {
  if (managementScope.level === "global" && managementScope.centerId) {
    return centers.filter((center) => center.id === managementScope.centerId);
  }

  if (managementScope.level !== "global") {
    return centers.filter((center) => center.id === managementScope.centerId);
  }

  return centers;
}

export function getScopeDescription(managementScope: ManagementScope, centers: ClassroomSchool[]) {
  if (managementScope.level === "global" && !managementScope.centerId) {
    return "ERG toàn hệ thống · tất cả trung tâm";
  }

  const centerNames = centers.map((center) => center.name).join(", ");
  return cn("ERG toàn hệ thống", centerNames ? `· ${centerNames}` : "");
}
