import { useState, memo, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LmsSelect } from "@/components/ui/lms-select";
import { cn } from "@/lib/utils";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "";

interface AttendancePanelProps {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
}

export function AttendancePanel({
  selectedClass,
  selectedSchoolName,
  students,
}: AttendancePanelProps) {
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState("Tất cả buổi");

  const attendanceColumns = [
    { id: "mon-am", day: "Thứ Hai", date: "18/05", session: "Sáng" },
    { id: "mon-pm", day: "Thứ Hai", date: "18/05", session: "Chiều" },
    { id: "tue-am", day: "Thứ Ba", date: "19/05", session: "Sáng" },
    { id: "wed-am", day: "Thứ Tư", date: "20/05", session: "Sáng" },
    { id: "thu-am", day: "Thứ Năm", date: "21/05", session: "Sáng" },
    { id: "fri-am", day: "Thứ Sáu", date: "22/05", session: "Sáng" },
    { id: "fri-pm", day: "Thứ Sáu", date: "22/05", session: "Chiều" },
    { id: "sat-am", day: "Thứ Bảy", date: "23/05", session: "Sáng" },
  ];

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const visibleColumns = attendanceColumns.filter(
    (column) => sessionFilter === "Tất cả buổi" || column.session === sessionFilter
  );

  function updateAttendance(studentId: string, columnId: string) {
    const key = `${studentId}:${columnId}`;
    setAttendanceOverrides((current) => ({
      ...current,
      [key]: nextAttendanceStatus(current[key] ?? ""),
    }));
  }

  return (
    <div className="flex min-h-full flex-col gap-2 px-2 py-2 xl:px-3">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[190px]">
            <div className="text-sm font-semibold leading-5 text-[var(--foreground)]">
              {selectedClass?.className ?? "Lớp học"}
            </div>
            <div className="text-[13px] font-semibold text-[var(--muted-foreground)]">
              {selectedSchoolName} · {students.length} học sinh · {visibleColumns.length} cột điểm danh
            </div>
          </div>
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm học sinh"
              className="h-10 rounded-lg border-[#d7e0ec] bg-white pl-9 text-[14px] font-semibold shadow-none focus:bg-[var(--card)]"
            />
          </div>
          <LmsSelect className="h-9 min-w-[150px] text-[13px]">
            <option>Tuần 12 (18/05 - 24/05)</option>
            <option>Tuần 13 (25/05 - 31/05)</option>
          </LmsSelect>
          <LmsSelect
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className="h-9 min-w-[132px] text-[13px]"
          >
            <option>Tất cả buổi</option>
            <option>Sáng</option>
            <option>Chiều</option>
          </LmsSelect>
          <Button variant="outline">Xuất dữ liệu</Button>
          <Button className="h-10 rounded-[10px] px-3 text-[14px] font-bold bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white border-0">
            Lưu điểm danh
          </Button>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-2.5 py-1.5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Bảng điểm danh theo tuần</h2>
          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Có mặt</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Đi muộn</span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">Vắng</span>
            <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[var(--primary)]">Có phép</span>
          </div>
        </div>
        <div className="max-h-[620px] overflow-auto">
          <table className="erg-data-table min-w-[1500px] border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="bg-[#eef4fb] text-[13px] font-bold text-slate-700">
                <AttendanceHeaderCell className="sticky left-0 top-0 z-40 w-[44px]">STT</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[44px] top-0 z-40 w-[190px] text-left">Học sinh</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[234px] top-0 z-40 w-[66px]">Lớp</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[300px] top-0 z-40 w-[76px]">Tổng</AttendanceHeaderCell>
                {visibleColumns.map((column) => (
                  <AttendanceHeaderCell key={column.id} className="sticky top-0 z-30 w-[136px]">
                    <span className="block">{column.day}</span>
                    <span className="mt-1 block text-[12px] font-semibold normal-case text-slate-600">
                      {column.date} · {column.session}
                    </span>
                  </AttendanceHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const summary = attendanceSummary(student.id, visibleColumns.map((column) => column.id), attendanceOverrides, index);
                return (
                  <tr key={student.id} className="group">
                    <AttendanceStickyCell className="left-0 z-20 w-[44px] text-center text-[var(--muted-foreground)]">{index + 1}</AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[44px] z-20 w-[190px]">
                      <button type="button" className="max-w-[166px] truncate text-left font-medium text-[var(--primary)] hover:underline">
                        {student.name}
                      </button>
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[234px] z-20 w-[66px] text-center font-semibold text-[var(--muted-foreground)]">
                      {student.className.replace("Lớp ", "")}
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[300px] z-20 w-[76px] text-center">
                      <span className={cn(
                        "rounded-lg border px-2 py-1 text-[13px] font-bold",
                        summary.absent ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}>
                        {summary.present}/{summary.total}
                      </span>
                    </AttendanceStickyCell>
                    {visibleColumns.map((column, columnIndex) => {
                      const status = attendanceOverrides[`${student.id}:${column.id}`] ?? getMockAttendanceStatus(index, columnIndex);
                      return (
                        <td key={column.id} className={cn("h-9 border-b border-r border-[#cbd7e6] px-1.5 text-center group-hover:!bg-[var(--accent-soft)]", attendanceCellClass(status))}>
                          <button
                            type="button"
                            onClick={() => updateAttendance(student.id, column.id)}
                            className="h-8 w-full rounded-lg text-[13px] font-bold outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            aria-label={`${student.name} ${column.day} ${column.session}`}
                          >
                            {attendanceLabel(status)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const AttendanceHeaderCell = memo(function AttendanceHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("h-8 border-b border-r border-[var(--border)] bg-[var(--muted)]/70 px-1.5 text-center align-middle", className)}>
      {children}
    </th>
  );
});

const AttendanceStickyCell = memo(function AttendanceStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("sticky h-7 border-b border-r border-[var(--border)] bg-[var(--card)] px-1.5 align-middle group-hover:bg-[var(--accent-soft)]", className)}>
      {children}
    </td>
  );
});

function getMockAttendanceStatus(studentIndex: number, columnIndex: number): AttendanceStatus {
  if ((studentIndex + columnIndex) % 17 === 0) return "late";
  if ((studentIndex * 3 + columnIndex) % 23 === 0) return "absent";
  if ((studentIndex + columnIndex * 2) % 29 === 0) return "excused";
  return "present";
}

function nextAttendanceStatus(status: AttendanceStatus): AttendanceStatus {
  if (status === "present" || status === "") return "late";
  if (status === "late") return "absent";
  if (status === "absent") return "excused";
  return "present";
}

function attendanceLabel(status: AttendanceStatus) {
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "✓";
}

function attendanceCellClass(status: AttendanceStatus) {
  if (status === "absent") return "bg-rose-50 text-rose-700";
  if (status === "late") return "bg-amber-50 text-amber-700";
  if (status === "excused") return "bg-[var(--accent-soft)] text-[var(--primary)]";
  return "bg-emerald-50 text-emerald-700";
}

function attendanceSummary(studentId: string, columnIds: string[], overrides: Record<string, AttendanceStatus>, studentIndex: number) {
  const statuses = columnIds.map((columnId, columnIndex) => overrides[`${studentId}:${columnId}`] ?? getMockAttendanceStatus(studentIndex, columnIndex));
  const absent = statuses.filter((status) => status === "absent").length;
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  return { absent, present, total: statuses.length };
}
