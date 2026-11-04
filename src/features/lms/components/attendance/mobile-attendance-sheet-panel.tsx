import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import TextField from "@mui/material/TextField";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import {
  attendanceLabel,
  attendanceText,
  bulkPresentTargets,
  nextAttendanceStatus,
  type AttendanceColumn,
  type AttendanceStatus,
  type CurriculumItem,
} from "@/features/lms/components/attendance/attendance-sheet-model";
import { cn } from "@/lib/utils";
import { formatDateVi } from "@/lib/format-date";
import { AttendanceDateField } from "./attendance-date-field";

type MobileAttendanceMode = "today" | "week" | "program";

type MobileAttendanceSheetPanelProps = {
  attendanceSummary: (statuses: AttendanceStatus[]) => { absent: number; present: number; total: number };
  curriculumProgram: CurriculumItem[];
  exportXlsx: () => void;
  filteredStudents: ClassroomStudent[];
  getStatus: (studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) => AttendanceStatus;
  onOpenStudentDetail: (student: ClassroomStudent) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedDateChange: (value: string) => void;
  onSetAttendanceStatus: (studentId: string, columnId: string, status: AttendanceStatus) => void;
  offlinePending?: boolean;
  searchQuery: string;
  selectedClass?: ClassroomSnapshot;
  selectedDate: string;
  todayInputDate: string;
  taughtLessonCount: number;
  visibleColumns: AttendanceColumn[];
};


export function MobileAttendanceSheetPanel({
  attendanceSummary,
  curriculumProgram,
  exportXlsx,
  filteredStudents,
  getStatus,
  onOpenStudentDetail,
  onSearchQueryChange,
  onSelectedDateChange,
  onSetAttendanceStatus,
  offlinePending,
  searchQuery,
  selectedClass,
  selectedDate,
  taughtLessonCount,
  todayInputDate,
  visibleColumns,
}: MobileAttendanceSheetPanelProps) {
  const [mode, setMode] = useState<MobileAttendanceMode>("today");
  const focusColumns = useMemo(() => visibleColumns.filter((column) => column.isFocusDate && !column.isFutureDate), [visibleColumns]);
  const todayColumns = focusColumns.length ? focusColumns : visibleColumns.filter((column) => !column.isFutureDate).slice(-1);
  const primaryColumn = todayColumns[0] ?? visibleColumns[0];
  const weekColumns = visibleColumns.slice(0, 7);
  const currentProgramItems = curriculumProgram.filter((item) => item.period >= Math.max(1, taughtLessonCount - 2) && item.period <= taughtLessonCount + 5);

  function markAllPresent() {
    // Fill only students without a status so exceptions already marked are kept.
    bulkPresentTargets(filteredStudents, todayColumns, getStatus).forEach((target) => onSetAttendanceStatus(target.studentId, target.columnId, "present"));
  }

  function setStatusForToday(student: ClassroomStudent, status: AttendanceStatus) {
    todayColumns.forEach((column) => onSetAttendanceStatus(student.id, column.id, status));
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f3f6fb]">
      <section className="shrink-0 border-b border-white bg-white px-3 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-extrabold text-slate-950">{selectedClass?.className ?? "Lớp học"}</div>
            <div className="mt-0.5 truncate text-[12px] font-semibold text-slate-500">
              {filteredStudents.length} học sinh · {formatDateVi(selectedDate)} · {primaryColumn?.session ?? "Tiết"}
            </div>
          </div>
          <button
            type="button"
            onClick={exportXlsx}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[var(--erg-blue)] text-white shadow-[0_8px_18px_rgba(15,108,189,0.24)]"
            aria-label="Xuất Excel điểm danh"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_160px] gap-2">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
            <TextField
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Tìm học sinh"
              size="small"
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  height: 44,
                  bgcolor: "white",
                  borderRadius: "14px",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d9e2ef" },
                "& .MuiInputBase-input": { pl: "36px", fontSize: "15px", fontWeight: 600 },
              }}
            />
          </label>
          <AttendanceDateField maxDate={todayInputDate} minHeight={44} onChange={onSelectedDateChange} value={selectedDate} />
        </div>

        {offlinePending ? <div className="mt-2 rounded-[12px] bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">Đang chờ đồng bộ</div> : null}

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-[16px] bg-[#e9f0fb] p-1.5">
          {[
            ["today", "Hôm nay"],
            ["week", "Tuần"],
            ["program", "CT"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn("min-h-11 rounded-[12px] px-2 text-[13px] font-bold text-slate-600 transition", mode === value && "bg-white text-[var(--erg-blue)] shadow-[0_1px_2px_rgba(15,23,42,0.08)]")}
              onClick={() => setMode(value as MobileAttendanceMode)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {mode === "today" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button type="button" className="min-h-11 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-bold text-emerald-700 shadow-[0_1px_2px_rgba(16,185,129,0.08)]" onClick={markAllPresent}>
              Tất cả có mặt
            </button>
            <button type="button" className="min-h-11 rounded-[14px] border border-[#d9e2ef] bg-white px-3 text-[13px] font-bold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" onClick={exportXlsx}>
              Xuất Excel
            </button>
          </div>
          <div className="grid gap-3">
            {filteredStudents.map((student, studentIndex) => {
              const statuses = todayColumns.map((column, columnIndex) => getStatus(student.id, studentIndex, column, columnIndex));
              const summary = attendanceSummary(statuses);
              const currentStatus = statuses[0] ?? "";
              return (
                <article key={student.id} className="flex min-h-14 items-center gap-2 rounded-[16px] border border-white bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <button type="button" className="min-h-11 min-w-0 flex-1 px-1 text-left" onClick={() => onOpenStudentDetail(student)} aria-label={`Mở hồ sơ ${student.name}`}>
                    <span className="block truncate text-[15px] font-bold text-slate-950">{student.name}</span>
                    <span className="mt-0.5 block text-[12px] font-semibold text-slate-500">Có mặt {summary.present}/{summary.total} · Vắng {summary.absent}</span>
                  </button>
                  <button
                    type="button"
                    className={cn("min-h-11 w-28 shrink-0 rounded-[12px] border px-2 text-[13px] font-bold transition", attendanceActiveClass(currentStatus))}
                    onClick={() => setStatusForToday(student, nextAttendanceStatus(currentStatus))}
                    aria-label={`${student.name}: ${attendanceText(currentStatus)}. Chạm để đổi trạng thái`}
                  >
                    {attendanceLabel(currentStatus)} {attendanceText(currentStatus)}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === "week" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          <div className="grid min-w-max" style={{ gridTemplateColumns: `150px repeat(${weekColumns.length}, 56px)` }}>
            <div className="sticky left-0 top-0 z-20 border-b border-r border-[#d9e2ef] bg-[#f5f8fc] px-2 py-2 text-[12px] font-bold text-slate-600">Học sinh</div>
            {weekColumns.map((column) => (
              <div key={column.id} className={cn("sticky top-0 z-10 border-b border-r border-[#d9e2ef] bg-[#f5f8fc] px-1 py-2 text-center text-[11px] font-bold leading-4 text-slate-700", column.isFocusDate && "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]")}>
                <span className="block">{column.date}</span>
                <span className="block">{column.session.replace("Tiết ", "T")}</span>
              </div>
            ))}
            {filteredStudents.map((student, studentIndex) => (
              <div key={student.id} className="contents">
                <button type="button" className="sticky left-0 z-10 min-h-12 border-b border-r border-[#d9e2ef] bg-white px-2 text-left text-[12px] font-bold text-[var(--erg-blue)]" onClick={() => onOpenStudentDetail(student)}>
                  <span className="line-clamp-2">{student.name}</span>
                </button>
                {weekColumns.map((column, columnIndex) => {
                  const status = getStatus(student.id, studentIndex, column, columnIndex);
                  return (
                    <button
                      key={`${student.id}-${column.id}`}
                      type="button"
                      disabled={column.isFutureDate}
                      className={cn("min-h-12 border-b border-r border-[#d9e2ef] text-[13px] font-bold disabled:bg-slate-100 disabled:text-slate-400", attendanceActiveClass(status))}
                      onClick={() => onSetAttendanceStatus(student.id, column.id, nextAttendanceStatus(status))}
                      aria-label={`${student.name} ${column.fullDate} ${column.session}`}
                    >
                      {attendanceLabel(status)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "program" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
          <div className="mb-3 rounded-[16px] border border-white bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="text-[13px] font-bold text-slate-500">Số tiết đã dạy</div>
            <div className="mt-1 text-2xl font-bold text-[var(--erg-blue)]">{taughtLessonCount}</div>
          </div>
          <div className="grid gap-2">
            {currentProgramItems.map((item) => (
              <article key={item.period} className={cn("rounded-[16px] border border-white bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]", item.period === taughtLessonCount && "border-[#b8d6fa] bg-[var(--erg-blue-light)]")}>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white text-[14px] font-bold text-[var(--erg-blue)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">{item.period}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold text-slate-500">{item.topic}</div>
                    <div className="mt-1 text-[14px] font-bold leading-5 text-slate-950">{item.title}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function attendanceActiveClass(status: AttendanceStatus) {
  if (status === "absent") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "late") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "excused") return "border-blue-200 bg-[var(--erg-blue-light)] text-[var(--erg-blue)]";
  if (status === "present") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-white text-slate-400";
}

