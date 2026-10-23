import { type ReactNode } from "react";
import Button from "@mui/material/Button";
import { type LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";
import { LcmsStatusChip } from "@/features/lcms/components/lcms-ui";

export function UnitInsightRail({
  isSchool,
  onImport,
  studentTotal,
  unit,
  unitClasses,
}: {
  isSchool: boolean;
  onImport: () => void;
  studentTotal: number;
  unit: LmsEducationUnitDTO;
  unitClasses: number;
}) {
  return (
    <aside className="space-y-4">
      <div className="overflow-hidden rounded-[18px] border border-[#dfdcff] bg-[#f6f4ff] shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
        <div className="border-b border-[#e3dfff] px-4 py-3">
          <p className="text-[11px] font-bold uppercase text-[#7068c9]">Admin → Teacher</p>
          <h4 className="mt-1 text-sm font-bold text-slate-950">Dữ liệu đẩy sang LMS</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          <DetailStat label="Lớp" value={unitClasses} tone="blue" />
          <DetailStat label="Học sinh" value={studentTotal.toLocaleString("vi-VN")} tone="emerald" />
          <DetailStat label="Mã" value={unit.code || "NO-CODE"} tone="violet" wide />
        </div>
        {isSchool ? (
          <div className="border-t border-[#e3dfff] p-3">
            <Button
              type="button"
              variant="contained"
              size="small"
              className="w-full justify-center text-white shadow-[0_14px_35px_-20px_rgba(91,92,246,0.8)]"
              style={{ backgroundColor: "#5b5cf6", borderColor: "#5b5cf6", color: "#fff" }}
              onClick={onImport}
            >
              Import danh sách lớp
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-[18px] border border-[#dfe7f2] bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-slate-950">Lịch sử hoạt động</h4>
          <LcmsStatusChip tone="blue">Backend</LcmsStatusChip>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Không hiển thị sự kiện giả trong panel này. Mở Nhật ký hoạt động để xem audit event thực tế theo scope backend.</p>
      </div>
    </aside>
  );
}

export function ClassPreviewPanel({ classes, isSchool }: { classes: ClassroomSnapshot[]; isSchool: boolean }) {
  return (
    <div className="rounded-[18px] border border-[#dfe7f2] bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">Danh sách lớp</p>
          <h4 className="mt-1 text-sm font-bold text-slate-950">{isSchool ? "Lớp thuộc trường này" : "Chọn trường để xem lớp"}</h4>
        </div>
        {isSchool ? <LcmsStatusChip tone={classes.length ? "emerald" : "amber"}>{classes.length ? `${classes.length} lớp` : "Chưa có lớp"}</LcmsStatusChip> : null}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {isSchool && classes.length ? (
          classes.slice(0, 3).map((classroom) => (
            <div key={classroom.id} className="rounded-[16px] border border-[#dfe7f2] bg-[#fbfdff] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{classroom.className}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{classroom.gradeLabel}</p>
                </div>
                <LcmsStatusChip tone="blue">{classroom.studentCount} HS</LcmsStatusChip>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 p-2">
                  <p className="font-bold text-emerald-700">{classroom.completionRate}%</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-emerald-600/70">Hoàn thành</p>
                </div>
                <div className="rounded-[12px] border border-amber-100 bg-amber-50 p-2">
                  <p className="font-bold text-amber-700">{classroom.riskStudents}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-amber-600/70">Cần hỗ trợ</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="xl:col-span-3 rounded-[16px] border border-dashed border-[#cfd9e8] bg-[#f8fbff] px-4 py-8 text-center">
            <p className="text-sm font-bold text-slate-800">{isSchool ? "Chưa có lớp trong trường này" : "Chọn một trường học"}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {isSchool ? "Dùng import danh sách lớp để tạo dữ liệu lớp và học sinh." : "Chi tiết lớp và học sinh sẽ hiển thị tại đây."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DetailStat({
  label,
  tone,
  value,
  wide = false,
}: {
  label: string;
  tone: "blue" | "emerald" | "violet";
  value: ReactNode;
  wide?: boolean;
}) {
  const colorClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "violet"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={cn("rounded-[14px] border bg-white p-3", colorClass, wide && "col-span-2")}>
      <p className="text-[10px] font-bold uppercase opacity-75">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

export function TimelineItem({
  detail,
  icon,
  title,
  tone,
}: {
  detail: string;
  icon: ReactNode;
  title: string;
  tone: "blue" | "emerald" | "amber";
}) {
  const colorClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className="flex gap-3">
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border", colorClass)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export function UnitAvatar({ size = "md", unit }: { size?: "sm" | "md" | "lg"; unit: LmsEducationUnitDTO }) {
  const initials = unit.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizeClass = size === "lg" ? "h-14 w-14 text-sm" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  if (unit.avatarUrl) {
    return <img src={unit.avatarUrl} alt={unit.name} className={cn(sizeClass, "shrink-0 rounded-lg border border-[#e0e4ea] object-cover shadow-sm")} />;
  }

  const bgClass =
    unit.type === "system"
      ? "bg-rose-50 text-rose-600 border-rose-100"
      : unit.type === "center"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-blue-50 text-blue-600 border-blue-100";

  return (
    <span className={cn(sizeClass, "grid shrink-0 place-items-center rounded-lg border font-bold shadow-inner", bgClass)}>
      {initials || "ERG"}
    </span>
  );
}

export function UnitTypeBadge({ type }: { type?: string }) {
  const label = type === "system" ? "Hệ thống" : type === "center" ? "Trung tâm" : "Trường học";
  const badgeClass =
    type === "system"
      ? "bg-rose-50 text-rose-600 border-rose-200/60"
      : type === "center"
      ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
      : "bg-blue-50 text-blue-600 border-blue-200/60";

  return <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", badgeClass)}>{label}</span>;
}

export function unitRank(type?: string) {
  if (type === "system") return 0;
  if (type === "center") return 1;
  return 2;
}

export function sortEducationUnits(units: LmsEducationUnitDTO[]) {
  return [...units].sort((a, b) => unitRank(a.type) - unitRank(b.type) || a.name.localeCompare(b.name, "vi"));
}
