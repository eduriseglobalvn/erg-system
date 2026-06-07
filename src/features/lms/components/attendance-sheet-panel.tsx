import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button, Input } from "@/components/ui/dashboard-kit";
import { StudentProfileDetailDrawer } from "@/features/lms/classroom/components/student-profile-detail-drawer";
import type { ClassroomSnapshot, ClassroomStudent, StudentStatus } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { StudentAttendanceContextMenu } from "@/features/lms/components/student-attendance-context-menu";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "";
type SessionPart = "Tiết 1" | "Tiết 2";

type AttendanceColumn = {
  id: string;
  day: string;
  date: string;
  fullDate: string;
  isFocusDate: boolean;
  isFutureDate: boolean;
  lessonIndex: number;
  session: SessionPart;
};

type AttendanceDayGroup = {
  id: string;
  day: string;
  date: string;
  isFocusDate: boolean;
  isFutureDate: boolean;
  columns: AttendanceColumn[];
};

type StudentDraft = {
  name: string;
  username: string;
  password: string;
  status: StudentStatus;
  note: string;
};

type AttendanceSheetPanelProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const COURSE_START_DATE = "2026-05-29";

type CurriculumItem = {
  topic: string;
  period: number;
  title: string;
};

const curriculumProgram: CurriculumItem[] = [
  { topic: "Căn bản về công nghệ", period: 1, title: "Bài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm" },
  { topic: "Căn bản về công nghệ", period: 2, title: "Bài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm" },
  { topic: "Căn bản về công nghệ", period: 3, title: "Bài 2: Khắc phục sự cố máy tính" },
  { topic: "Căn bản về công nghệ", period: 4, title: "Bài 2: Khắc phục sự cố máy tính" },
  { topic: "Căn bản về công nghệ", period: 5, title: "Bài 3: Cấp phép phần mềm" },
  { topic: "Căn bản về công nghệ", period: 6, title: "Bài 4: Cài đặt mặc định phần mềm" },
  { topic: "Căn bản về công nghệ", period: 7, title: "Ôn tập 1" },
  { topic: "Công dân số", period: 8, title: "Bài 5: Báo cáo hành vi gây hại (1)" },
  { topic: "Công dân số", period: 9, title: "Bài 6: Báo cáo hành vi gây hại (2)" },
  { topic: "Công dân số", period: 10, title: "Bài 7: Một số hành vi bất hợp pháp trên môi trường kĩ thuật số" },
  { topic: "Công dân số", period: 11, title: "Bài 7: Một số hành vi bất hợp pháp trên môi trường kĩ thuật số" },
  { topic: "Công dân số", period: 12, title: "Bài 8: Cập nhật kiến thức kĩ thuật số (1)" },
  { topic: "Công dân số", period: 13, title: "Bài 9: Cập nhật kiến thức kĩ thuật số (2)" },
  { topic: "Công dân số", period: 14, title: "Ôn tập 2" },
  { topic: "Quản lý thông tin", period: 15, title: "Bài 10: Thu hẹp phạm vi tìm kiếm (1)" },
  { topic: "Quản lý thông tin", period: 16, title: "Bài 10: Thu hẹp phạm vi tìm kiếm (1)" },
  { topic: "Quản lý thông tin", period: 17, title: "Bài 11: Thu hẹp phạm vi tìm kiếm (2)" },
  { topic: "Quản lý thông tin", period: 18, title: "Bài 12: Đánh giá thông tin (1)" },
  { topic: "Quản lý thông tin", period: 19, title: "Bài 13: Đánh giá thông tin (2)" },
  { topic: "Quản lý thông tin", period: 20, title: "Ôn tập 3" },
  { topic: "Sáng tạo nội dung", period: 21, title: "Bài 14: Làm việc với phương tiện truyền thông kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 22, title: "Bài 14: Làm việc với phương tiện truyền thông kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 23, title: "Bài 15: Sử dụng dữ liệu trực quan (1)" },
  { topic: "Sáng tạo nội dung", period: 24, title: "Bài 16: Sử dụng dữ liệu trực quan (2)" },
  { topic: "Sáng tạo nội dung", period: 25, title: "Bài 17: Quản lí thông tin kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 26, title: "Bài 18: Khả năng tiếp cận" },
  { topic: "Sáng tạo nội dung", period: 27, title: "Bài 18: Khả năng tiếp cận" },
  { topic: "Sáng tạo nội dung", period: 28, title: "Bài 19: Hiểu về sở hữu trí tuệ" },
  { topic: "Sáng tạo nội dung", period: 29, title: "Bài 20: Bảo vệ sở hữu trí tuệ (1)" },
  { topic: "Sáng tạo nội dung", period: 30, title: "Bài 21: Bảo vệ sở hữu trí tuệ (2)" },
  { topic: "Sáng tạo nội dung", period: 31, title: "Bài 22: Lập kế hoạch cho một dự án kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 32, title: "Bài 22: Lập kế hoạch cho một dự án kĩ thuật số" },
  { topic: "Sáng tạo nội dung", period: 33, title: "Ôn tập 4" },
  { topic: "Giao tiếp kỹ thuật số", period: 34, title: "Bài 23: Sự mơ hồ (Ambiguity) trong giao tiếp kĩ thuật số" },
  { topic: "Giao tiếp kỹ thuật số", period: 35, title: "Bài 24: Giao tiếp kĩ thuật số để giải quyết vấn đề (1)" },
  { topic: "Giao tiếp kỹ thuật số", period: 36, title: "Bài 25: Giao tiếp kĩ thuật số để giải quyết vấn đề (2)" },
  { topic: "Giao tiếp kỹ thuật số", period: 37, title: "Bài 26: Tương tác phù hợp khi giao tiếp trên môi trường kĩ thuật số" },
  { topic: "Cộng tác", period: 38, title: "Bài 27: Cộng tác để giải quyết vấn đề" },
  { topic: "Cộng tác", period: 39, title: "Bài 27: Cộng tác để giải quyết vấn đề" },
  { topic: "Cộng tác", period: 40, title: "Bài 28: Đóng góp vào các dự án (1)" },
  { topic: "Cộng tác", period: 41, title: "Bài 29: Đóng góp vào các dự án (2)" },
  { topic: "Cộng tác", period: 42, title: "Ôn tập 5" },
  { topic: "An toàn và bảo mật", period: 43, title: "Bài 30: Bảo mật thiết bị của bạn" },
  { topic: "An toàn và bảo mật", period: 44, title: "Bài 30: Bảo mật thiết bị của bạn" },
  { topic: "An toàn và bảo mật", period: 45, title: "Bài 31: Dấu hiệu nhận biết và các phần mềm chống Virus (1)" },
  { topic: "An toàn và bảo mật", period: 46, title: "Bài 32: Dấu hiệu nhận biết và các phần mềm chống Virus (2)" },
  { topic: "An toàn và bảo mật", period: 47, title: "Bài 33: Đặt lại thiết bị" },
  { topic: "An toàn và bảo mật", period: 48, title: "Bài 34: Tác động của các công cụ và công nghệ kĩ thuật số (1)" },
  { topic: "An toàn và bảo mật", period: 49, title: "Bài 35: Tác động của các công cụ và công nghệ kĩ thuật số (2)" },
  { topic: "An toàn và bảo mật", period: 50, title: "Ôn tập 6" },
  { topic: "Tăng cường", period: 51, title: "Ôn tập" },
  { topic: "Tăng cường", period: 52, title: "Ôn tập" },
  { topic: "Tăng cường", period: 53, title: "Ôn tập" },
  { topic: "Tăng cường", period: 54, title: "Ôn tập" },
  { topic: "Tăng cường", period: 55, title: "Ôn tập" },
  { topic: "Tăng cường", period: 56, title: "Ôn tập" },
  { topic: "Tăng cường", period: 57, title: "Ôn tập" },
  { topic: "Tăng cường", period: 58, title: "Luyện thi" },
  { topic: "Tăng cường", period: 59, title: "Luyện thi" },
  { topic: "Tăng cường", period: 60, title: "Luyện thi" },
];

export function AttendanceSheetPanel({ selectedClass, students }: AttendanceSheetPanelProps) {
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate());
  const [attendancePaneWidth, setAttendancePaneWidth] = useState(68);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; student: ClassroomStudent } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentDraft>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery);

  const todayInputDate = getTodayInputDate();
  const dateColumns = useMemo(() => buildAttendanceColumns(selectedDate), [selectedDate]);
  const visibleColumns = dateColumns;
  const visibleDayGroups = useMemo(() => groupAttendanceColumnsByDate(visibleColumns), [visibleColumns]);
  const dateRangeLabel = `${dateColumns[0]?.date ?? ""} - ${dateColumns[dateColumns.length - 1]?.date ?? ""}`;
  const taughtLessonCount = countLessonsThroughDate(selectedDate);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const attendanceTableColumns = useMemo<ColumnDef<ClassroomStudent>[]>(
    () => [
      {
        accessorFn: (student) => student.name,
        id: "student",
      },
    ],
    [],
  );
  const attendanceTable = useReactTable({
    columns: attendanceTableColumns,
    data: students,
    enableGlobalFilter: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const normalizedQuery = String(filterValue ?? "").trim().toLowerCase();
      return !normalizedQuery || row.original.name.toLowerCase().includes(normalizedQuery);
    },
    state: {
      globalFilter: debouncedSearchQuery,
    },
  });
  const filteredStudentRows = attendanceTable.getRowModel().rows;
  const filteredStudents = filteredStudentRows.map((row) => row.original);
  const rowVirtualizer = useVirtualList({
    count: filteredStudents.length,
    estimateSize: 28,
    overscan: 10,
    scrollRef: tableScrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();
  const virtualRows = measuredVirtualRows.length
    ? measuredVirtualRows
    : Array.from({ length: Math.min(filteredStudents.length, 20) }, (_, index) => ({
        end: (index + 1) * 28,
        index,
        start: index * 28,
      }));
  const virtualTotalSize = Math.max(rowVirtualizer.getTotalSize(), filteredStudents.length * 28);
  const tableColumnCount = 3 + visibleColumns.length;

  function statusFor(studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) {
    if (column.isFutureDate) return "";
    return attendanceOverrides[attendanceKey(studentId, column.id)] ?? getMockAttendanceStatus(studentIndex, columnIndex);
  }

  function updateAttendance(studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) {
    if (column.isFutureDate) return;

    const key = attendanceKey(studentId, column.id);
    const currentStatus = attendanceOverrides[key] ?? getMockAttendanceStatus(studentIndex, columnIndex);
    setAttendanceOverrides((current) => ({
      ...current,
      [key]: nextAttendanceStatus(currentStatus),
    }));
  }

  function exportCsv() {
    const header = ["STT", "Học sinh", "Tổng vắng", ...visibleColumns.map((column) => `${column.day} ${column.date} ${column.session}`)];
    const rows = filteredStudentRows.map((row, studentIndex) => {
      const student = row.original;
      const statuses = visibleColumns.map((column, columnIndex) => statusFor(student.id, row.index, column, columnIndex));
      const summary = attendanceSummary(statuses);
      return [String(studentIndex + 1), student.name, String(summary.absent), ...statuses.map((status) => attendanceText(status))];
    });
    const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diem-danh-${selectedClass?.className ?? "lop"}-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openStudentDetail(student: ClassroomStudent) {
    setSelectedStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createStudentDraft(student),
    }));
  }

  function updateStudentDraft(studentId: string, patch: Partial<StudentDraft>) {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    setStudentDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? createStudentDraft(student)), ...patch },
    }));
  }

  function showAction(message: string) {
    setNotice(message);
    toast.info(message);
  }

  function startPaneResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const container = splitPaneRef.current;
    if (!container) return;

    event.preventDefault();
    const rect = container.getBoundingClientRect();

    function updatePaneWidth(clientX: number) {
      const nextWidth = ((clientX - rect.left) / rect.width) * 100;
      setAttendancePaneWidth(Math.min(82, Math.max(30, nextWidth)));
    }

    function handlePointerMove(pointerEvent: PointerEvent) {
      updatePaneWidth(pointerEvent.clientX);
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    updatePaneWidth(event.clientX);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <section className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[220px] border-b border-slate-900 pb-1 pr-6 text-[12px] italic leading-5 text-[var(--erg-blue)]">
            <div>Gv phụ trách: <span className="font-semibold">{selectedClass?.homeroomTeacher ?? ""}</span></div>
            <div className="flex items-center gap-10">
              <span>Số tiết đã dạy:</span>
              <span className="font-semibold not-italic text-red-600">{taughtLessonCount}</span>
            </div>
          </div>
          {notice ? <span className="rounded bg-[var(--erg-blue-light)] px-2 py-1 text-[11px] font-medium text-[var(--erg-blue)]">{notice}</span> : null}
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm học sinh"
              className="h-8 border-slate-200 bg-slate-50 pl-8 text-xs shadow-none focus:bg-white"
            />
          </div>
          <label className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700">
            <span className="text-slate-500">Ngày</span>
            <span className="min-w-[74px] text-slate-800">{formatFullDate(parseDateInput(selectedDate))}</span>
            <input
              type="date"
              aria-label="Chọn ngày trọng tâm"
              value={selectedDate}
              max={todayInputDate}
              onChange={(event) => setSelectedDate(clampInputDateToToday(event.target.value))}
              className="h-7 w-8 cursor-pointer rounded bg-transparent text-transparent outline-none"
            />
          </label>
          <Button type="button" variant="outline" onClick={exportCsv} className="h-8 rounded-md px-2.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Xuất CSV
          </Button>
          <label className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700">
            <span className="text-slate-500">Môn</span>
            <AppSelect
              aria-label="Chọn môn học"
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="h-7 bg-transparent font-medium text-slate-800 outline-none"
            >
              {lmsSubjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </AppSelect>
          </label>
        </div>
      </section>

      <div ref={splitPaneRef} className="grid min-h-0 flex-1 gap-2 xl:flex xl:gap-0">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white xl:flex-none" style={{ flexBasis: `${attendancePaneWidth}%` }}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
            <h2 className="text-sm font-semibold text-slate-950">Điểm danh {dateRangeLabel}</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Có mặt</span>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Đi muộn</span>
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">Vắng</span>
              <span className="rounded bg-[var(--erg-blue-light)] px-1.5 py-0.5 text-[var(--erg-blue)]">Có phép</span>
            </div>
          </div>
          <div ref={tableScrollRef} className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[790px] border-separate border-spacing-0 text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500">
                  <AttendanceHeaderCell rowSpan={2} className="sticky left-0 top-0 z-40 w-9">STT</AttendanceHeaderCell>
                  <AttendanceHeaderCell rowSpan={2} className="sticky left-9 top-0 z-40 w-40 text-left">Học sinh</AttendanceHeaderCell>
                  <AttendanceHeaderCell rowSpan={2} className="sticky left-[196px] top-0 z-40 w-[62px]">Tổng vắng</AttendanceHeaderCell>
                  {visibleDayGroups.map((group) => (
                    <AttendanceHeaderCell key={group.id} colSpan={group.columns.length} className={cn("sticky top-0 z-30 w-[76px]", group.isFocusDate && "border-x-2 border-t-2 border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)] shadow-sm")}>
                      <span className="block">{group.day}</span>
                      <span className="mt-0.5 block text-[10px] font-medium normal-case text-slate-500">{group.date}</span>
                    </AttendanceHeaderCell>
                  ))}
                </tr>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500">
                  {visibleDayGroups.map((group) => (
                    <AttendanceHeaderCell key={`${group.id}-lessons`} colSpan={group.columns.length} className={cn("sticky top-8 z-30 w-[76px]", group.isFocusDate && "border-x-2 border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]")}>
                      {group.columns.length}
                    </AttendanceHeaderCell>
                  ))}
                </tr>
              </thead>
              <tbody>
                {virtualRows[0]?.start ? (
                  <tr aria-hidden="true">
                    <td colSpan={tableColumnCount} style={{ height: virtualRows[0].start }} />
                  </tr>
                ) : null}
                {virtualRows.map((virtualRow) => {
                  const studentIndex = virtualRow.index;
                  const studentRow = filteredStudentRows[studentIndex];
                  const student = studentRow?.original;
                  if (!student) return null;
                  const sourceStudentIndex = studentRow.index;
                  const statuses = visibleColumns.map((column, columnIndex) => statusFor(student.id, sourceStudentIndex, column, columnIndex));
                  const summary = attendanceSummary(statuses);
                  return (
                    <tr key={student.id} className="group">
                      <AttendanceStickyCell className="left-0 z-20 w-9 text-center text-slate-500">{studentIndex + 1}</AttendanceStickyCell>
                      <AttendanceStickyCell className="left-9 z-20 w-40">
                        <button
                          type="button"
                          className="max-w-[136px] truncate text-left font-medium text-[var(--erg-blue)] hover:underline"
                          onClick={() => openStudentDetail(student)}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            setContextMenu({ x: event.clientX, y: event.clientY, student });
                          }}
                        >
                          {studentDrafts[student.id]?.name ?? student.name}
                        </button>
                      </AttendanceStickyCell>
                      <AttendanceStickyCell className="left-[196px] z-20 w-[62px] text-center">
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", summary.absent ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
                          {summary.absent}
                        </span>
                      </AttendanceStickyCell>
                      {visibleColumns.map((column, columnIndex) => {
                        const status = statuses[columnIndex];
                        return (
                          <td key={column.id} className={cn("h-7 border-b border-r border-slate-100 px-1 text-center group-hover:!bg-[var(--erg-blue-light)]", attendanceSubColumnWidthClass(column, visibleDayGroups), attendanceCellClass(status), column.isFocusDate && focusAttendanceCellClass(status), column.isFutureDate && "bg-slate-100 text-slate-400")}>
                            <button
                              type="button"
                              onClick={() => updateAttendance(student.id, sourceStudentIndex, column, columnIndex)}
                              disabled={column.isFutureDate}
                              className="h-6 w-full rounded text-[11px] font-semibold outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)] disabled:cursor-not-allowed"
                              aria-label={`${student.name} ${column.day} ${column.session}`}
                              title={column.isFutureDate ? "Ngày chưa tới, chưa thể điểm danh" : "Bấm để đổi trạng thái"}
                            >
                              {attendanceLabel(status)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {virtualTotalSize - (virtualRows.at(-1)?.end ?? 0) > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={tableColumnCount} style={{ height: virtualTotalSize - (virtualRows.at(-1)?.end ?? 0) }} />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <button
          type="button"
          aria-label="Kéo để điều chỉnh kích thước hai bảng"
          onPointerDown={startPaneResize}
          className="group hidden w-3 shrink-0 cursor-col-resize items-center justify-center xl:flex"
        >
          <span className="h-16 w-1 rounded-full bg-[#b8d6fa] transition group-hover:bg-slate-500" />
        </button>

        <div className="min-h-0 min-w-[260px] xl:flex xl:flex-1">
          <CurriculumDistributionPanel taughtLessonCount={taughtLessonCount} />
        </div>
      </div>

      <StudentAttendanceContextMenu
        menu={contextMenu}
        onAddStudent={() => showAction("Đã mở thao tác thêm học sinh mới")}
        onAddNote={(student) => showAction(`Đã thêm note nhanh cho ${student.name}`)}
        onChangeStatus={(student) => {
          updateStudentDraft(student.id, { status: nextStudentStatus(studentDrafts[student.id]?.status ?? student.status) });
          showAction(`Đã đổi trạng thái ${student.name}`);
        }}
        onClose={() => setContextMenu(null)}
        onOpenNote={(student) => {
          openStudentDetail(student);
          showAction(`Đang ghi chú cho ${student.name}`);
        }}
      />

      {selectedStudent ? (
        <StudentProfileDetailDrawer
          draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)}
          onClose={() => setSelectedStudentId(null)}
          onUpdate={(patch) => updateStudentDraft(selectedStudent.id, patch)}
          onStatusChange={(status) => updateStudentDraft(selectedStudent.id, { status })}
          statusOptions={[
            { label: "Vượt tiến độ", value: "ahead" },
            { label: "Ổn định", value: "steady" },
            { label: "Cần hỗ trợ", value: "support" },
          ]}
          statusValue={(studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)).status}
          student={selectedStudent}
        />
      ) : null}
    </div>
  );
}

function CurriculumDistributionPanel({ taughtLessonCount }: { taughtLessonCount: number }) {
  const topicSpans = getCurriculumTopicSpans(curriculumProgram);
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--erg-blue)]">Khung chương trình tin học quốc tế</h2>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-white p-2">
        <table className="w-full table-fixed border-collapse text-[12px] text-[var(--erg-blue)]">
          <colgroup>
            <col className="w-32" />
            <col className="w-12" />
            <col />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="border border-slate-900 bg-slate-100 px-2 py-1 text-center font-medium">Chủ đề</th>
              <th className="w-12 border border-slate-900 bg-slate-100 px-2 py-1 text-center font-medium">Tiết</th>
              <th className="border border-slate-900 bg-slate-100 px-2 py-1 text-center font-medium">Tên bài học</th>
            </tr>
          </thead>
          <tbody>
            {curriculumProgram.map((item, index) => {
              const isCurrent = item.period === taughtLessonCount;
              const isDone = item.period < taughtLessonCount;
              return (
                <tr key={item.period} className={cn(isCurrent && "bg-[var(--erg-blue-light)]", isDone && !isCurrent && "bg-emerald-50/30")}>
                  {topicSpans.firstRows.get(item.topic) === index ? (
                    <td rowSpan={topicSpans.counts.get(item.topic)} className="w-32 break-words border border-slate-900 px-2 py-1 text-center align-middle font-semibold leading-5">
                      {item.topic}
                    </td>
                  ) : null}
                  <td className="border border-slate-900 px-2 py-1 text-center italic">{item.period}</td>
                  <td className={cn("break-words border border-slate-900 px-2 py-1 font-normal leading-5 whitespace-normal", isCurrent && "font-medium ring-2 ring-inset ring-emerald-500")}>
                    {item.title}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendanceHeaderCell({
  children,
  className,
  colSpan,
  rowSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th colSpan={colSpan} rowSpan={rowSpan} className={cn("h-8 border-b border-r border-slate-200 bg-slate-50 px-1.5 text-center align-middle", className)}>
      {children}
    </th>
  );
}

function AttendanceStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("sticky h-7 border-b border-r border-slate-100 bg-white px-1.5 align-middle group-hover:bg-slate-50", className)}>{children}</td>;
}

function attendanceKey(studentId: string, columnId: string) {
  return `${studentId}:${columnId}`;
}

function buildAttendanceColumns(focusDateValue: string): AttendanceColumn[] {
  const focusDate = minDate(parseDateInput(focusDateValue), todayStart());
  const startDate = addDays(focusDate, -3);
  const attendedDayCount = daysBetween(startDate, focusDate) + 1;
  const attendedColumns = Array.from({ length: attendedDayCount }).flatMap((_, index) =>
    buildAttendanceColumnsForDate(addDays(startDate, index), focusDate),
  );
  const futureColumns: AttendanceColumn[] = [];

  for (let futureOffset = 1; futureColumns.length < 5; futureOffset += 1) {
    const currentDate = addDays(focusDate, futureOffset);
    const nextColumns = buildAttendanceColumnsForDate(currentDate, focusDate);
    const availableSlots = 5 - futureColumns.length;
    futureColumns.push(...nextColumns.slice(0, availableSlots));
  }

  return [...attendedColumns, ...futureColumns];
}

function buildAttendanceColumnsForDate(currentDate: Date, focusDate: Date): AttendanceColumn[] {
  const id = formatInputDate(currentDate);
  return lessonsForDate(currentDate).map((session, lessonIndex) => ({
    id: `${id}-${lessonIndex + 1}`,
    day: weekdayLabel(currentDate),
    date: formatShortDate(currentDate),
    fullDate: formatFullDate(currentDate),
    isFocusDate: isSameDate(currentDate, focusDate),
    isFutureDate: currentDate > todayStart(),
    lessonIndex: lessonIndex + 1,
    session,
  }));
}

function groupAttendanceColumnsByDate(columns: AttendanceColumn[]): AttendanceDayGroup[] {
  return columns.reduce<AttendanceDayGroup[]>((groups, column) => {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.id === column.fullDate) {
      currentGroup.columns.push(column);
      return groups;
    }

    groups.push({
      id: column.fullDate,
      day: column.day,
      date: column.date,
      isFocusDate: column.isFocusDate,
      isFutureDate: column.isFutureDate,
      columns: [column],
    });
    return groups;
  }, []);
}

function attendanceSubColumnWidthClass(column: AttendanceColumn, groups: AttendanceDayGroup[]) {
  const group = groups.find((item) => item.id === column.fullDate);
  return group && group.columns.length > 1 ? "w-[38px]" : "w-[76px]";
}

function lessonsForDate(date: Date): SessionPart[] {
  const day = date.getDay();
  if (day === 0) return ["Tiết 1"];
  if (day === 2 || day === 4 || day === 6) return ["Tiết 1", "Tiết 2"];
  return ["Tiết 1"];
}

function countLessonsThroughDate(selectedDateValue: string) {
  const startDate = parseDateInput(COURSE_START_DATE);
  const endDate = minDate(parseDateInput(selectedDateValue), todayStart());
  if (endDate < startDate) return 0;

  let total = 0;
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate = addDays(currentDate, 1)) {
    total += lessonsForDate(currentDate).length;
  }
  return total;
}

function getMockAttendanceStatus(studentIndex: number, columnIndex: number): AttendanceStatus {
  if ((studentIndex + columnIndex) % 17 === 0) return "late";
  if ((studentIndex * 3 + columnIndex) % 23 === 0) return "absent";
  if ((studentIndex + columnIndex * 2) % 29 === 0) return "excused";
  return "present";
}

function nextAttendanceStatus(status: AttendanceStatus): AttendanceStatus {
  if (status === "present") return "late";
  if (status === "late") return "absent";
  if (status === "absent") return "excused";
  return "present";
}

function nextStudentStatus(status: StudentStatus): StudentStatus {
  if (status === "steady") return "support";
  if (status === "support") return "ahead";
  return "steady";
}

function attendanceLabel(status: AttendanceStatus) {
  if (!status) return "—";
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "✓";
}

function attendanceText(status: AttendanceStatus) {
  if (!status) return "Chưa điểm danh";
  if (status === "absent") return "Vắng";
  if (status === "late") return "Đi muộn";
  if (status === "excused") return "Có phép";
  return "Có mặt";
}

function attendanceCellClass(status: AttendanceStatus) {
  if (!status) return "bg-slate-100 text-slate-400";
  if (status === "absent") return "bg-rose-50 text-rose-700";
  if (status === "late") return "bg-amber-50 text-amber-700";
  if (status === "excused") return "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]";
  return "bg-emerald-50 text-emerald-700";
}

function focusAttendanceCellClass(status: AttendanceStatus) {
  const edge = "border-x-2 border-x-[#b8d6fa]";
  if (!status) return cn(edge, "bg-slate-100");
  if (status === "absent") return cn(edge, "bg-rose-100/80");
  if (status === "late") return cn(edge, "bg-amber-100/80");
  if (status === "excused") return cn(edge, "bg-[var(--erg-blue-light)]");
  return cn(edge, "bg-[var(--erg-blue-light)]");
}

function attendanceSummary(statuses: AttendanceStatus[]) {
  const absent = statuses.filter((status) => status === "absent").length;
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  return { absent, present, total: statuses.length };
}

function createStudentDraft(student: ClassroomStudent): StudentDraft {
  const baseUsername = removeVietnameseMarks(student.name).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return {
    name: student.name,
    username: baseUsername || student.id,
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    status: student.status,
    note: student.mentorNote,
  };
}

function getCurriculumTopicSpans(items: CurriculumItem[]) {
  const counts = new Map<string, number>();
  const firstRows = new Map<string, number>();
  items.forEach((item, index) => {
    counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1);
    if (!firstRows.has(item.topic)) firstRows.set(item.topic, index);
  });
  return { counts, firstRows };
}

function parseDateInput(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date();
}

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTodayInputDate() {
  return formatInputDate(todayStart());
}

function clampInputDateToToday(value: string) {
  return formatInputDate(minDate(parseDateInput(value), todayStart()));
}

function minDate(firstDate: Date, secondDate: Date) {
  return firstDate <= secondDate ? firstDate : secondDate;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return formatInputDate(firstDate) === formatInputDate(secondDate);
}

function daysBetween(startDate: Date, endDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay));
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function formatFullDate(date: Date) {
  return `${formatShortDate(date)}/${date.getFullYear()}`;
}

function weekdayLabel(date: Date) {
  const labels = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return labels[date.getDay()];
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
