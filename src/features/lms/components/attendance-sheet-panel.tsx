import { useMemo, useState, type ReactNode } from "react";
import { Download, LockKeyhole, RotateCcw, Save, Search, UserRound, X } from "lucide-react";

import { Button, Input } from "@/components/ui/dashboard-kit";
import type { ClassroomSnapshot, ClassroomStudent, StudentStatus } from "@/features/classroom/types/classroom-types";
import { StudentAttendanceContextMenu } from "@/features/lms/components/student-attendance-context-menu";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type SessionPart = "Tiáº¿t 1" | "Tiáº¿t 2";

type AttendanceColumn = {
  id: string;
  day: string;
  date: string;
  fullDate: string;
  isFocusDate: boolean;
  lessonIndex: number;
  session: SessionPart;
};

type AttendanceDayGroup = {
  id: string;
  day: string;
  date: string;
  isFocusDate: boolean;
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

const statusLabels: Record<StudentStatus, string> = {
  ahead: "VÆ°á»£t tiáº¿n Ä‘á»™",
  steady: "á»”n Ä‘á»‹nh",
  support: "Cáº§n há»— trá»£",
};

type CurriculumItem = {
  topic: string;
  period: number;
  title: string;
};

const curriculumProgram: CurriculumItem[] = [
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 1, title: "BÃ i 1: XÃ¡c Ä‘á»‹nh yÃªu cáº§u há»‡ thá»‘ng vÃ  yÃªu cáº§u pháº§n má»m" },
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 2, title: "BÃ i 1: XÃ¡c Ä‘á»‹nh yÃªu cáº§u há»‡ thá»‘ng vÃ  yÃªu cáº§u pháº§n má»m" },
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 3, title: "BÃ i 2: Kháº¯c phá»¥c sá»± cá»‘ mÃ¡y tÃ­nh" },
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 4, title: "BÃ i 2: Kháº¯c phá»¥c sá»± cá»‘ mÃ¡y tÃ­nh" },
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 5, title: "BÃ i 3: Cáº¥p phÃ©p pháº§n má»m" },
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 6, title: "BÃ i 4: CÃ i Ä‘áº·t máº·c Ä‘á»‹nh pháº§n má»m" },
  { topic: "CÄƒn báº£n vá» cÃ´ng nghá»‡", period: 7, title: "Ã”n táº­p 1" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 8, title: "BÃ i 5: BÃ¡o cÃ¡o hÃ nh vi gÃ¢y háº¡i (1)" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 9, title: "BÃ i 6: BÃ¡o cÃ¡o hÃ nh vi gÃ¢y háº¡i (2)" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 10, title: "BÃ i 7: Má»™t sá»‘ hÃ nh vi báº¥t há»£p phÃ¡p trÃªn mÃ´i trÆ°á»ng kÄ© thuáº­t sá»‘" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 11, title: "BÃ i 7: Má»™t sá»‘ hÃ nh vi báº¥t há»£p phÃ¡p trÃªn mÃ´i trÆ°á»ng kÄ© thuáº­t sá»‘" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 12, title: "BÃ i 8: Cáº­p nháº­t kiáº¿n thá»©c kÄ© thuáº­t sá»‘ (1)" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 13, title: "BÃ i 9: Cáº­p nháº­t kiáº¿n thá»©c kÄ© thuáº­t sá»‘ (2)" },
  { topic: "CÃ´ng dÃ¢n sá»‘", period: 14, title: "Ã”n táº­p 2" },
  { topic: "Quáº£n lÃ½ thÃ´ng tin", period: 15, title: "BÃ i 10: Thu háº¹p pháº¡m vi tÃ¬m kiáº¿m (1)" },
  { topic: "Quáº£n lÃ½ thÃ´ng tin", period: 16, title: "BÃ i 10: Thu háº¹p pháº¡m vi tÃ¬m kiáº¿m (1)" },
  { topic: "Quáº£n lÃ½ thÃ´ng tin", period: 17, title: "BÃ i 11: Thu háº¹p pháº¡m vi tÃ¬m kiáº¿m (2)" },
  { topic: "Quáº£n lÃ½ thÃ´ng tin", period: 18, title: "BÃ i 12: ÄÃ¡nh giÃ¡ thÃ´ng tin (1)" },
  { topic: "Quáº£n lÃ½ thÃ´ng tin", period: 19, title: "BÃ i 13: ÄÃ¡nh giÃ¡ thÃ´ng tin (2)" },
  { topic: "Quáº£n lÃ½ thÃ´ng tin", period: 20, title: "Ã”n táº­p 3" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 21, title: "BÃ i 14: LÃ m viá»‡c vá»›i phÆ°Æ¡ng tiá»‡n truyá»n thÃ´ng kÄ© thuáº­t sá»‘" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 22, title: "BÃ i 14: LÃ m viá»‡c vá»›i phÆ°Æ¡ng tiá»‡n truyá»n thÃ´ng kÄ© thuáº­t sá»‘" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 23, title: "BÃ i 15: Sá»­ dá»¥ng dá»¯ liá»‡u trá»±c quan (1)" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 24, title: "BÃ i 16: Sá»­ dá»¥ng dá»¯ liá»‡u trá»±c quan (2)" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 25, title: "BÃ i 17: Quáº£n lÃ­ thÃ´ng tin kÄ© thuáº­t sá»‘" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 26, title: "BÃ i 18: Kháº£ nÄƒng tiáº¿p cáº­n" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 27, title: "BÃ i 18: Kháº£ nÄƒng tiáº¿p cáº­n" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 28, title: "BÃ i 19: Hiá»ƒu vá» sá»Ÿ há»¯u trÃ­ tuá»‡" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 29, title: "BÃ i 20: Báº£o vá»‡ sá»Ÿ há»¯u trÃ­ tuá»‡ (1)" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 30, title: "BÃ i 21: Báº£o vá»‡ sá»Ÿ há»¯u trÃ­ tuá»‡ (2)" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 31, title: "BÃ i 22: Láº­p káº¿ hoáº¡ch cho má»™t dá»± Ã¡n kÄ© thuáº­t sá»‘" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 32, title: "BÃ i 22: Láº­p káº¿ hoáº¡ch cho má»™t dá»± Ã¡n kÄ© thuáº­t sá»‘" },
  { topic: "SÃ¡ng táº¡o ná»™i dung", period: 33, title: "Ã”n táº­p 4" },
  { topic: "Giao tiáº¿p ká»¹ thuáº­t sá»‘", period: 34, title: "BÃ i 23: Sá»± mÆ¡ há»“ (Ambiguity) trong giao tiáº¿p kÄ© thuáº­t sá»‘" },
  { topic: "Giao tiáº¿p ká»¹ thuáº­t sá»‘", period: 35, title: "BÃ i 24: Giao tiáº¿p kÄ© thuáº­t sá»‘ Ä‘á»ƒ giáº£i quyáº¿t váº¥n Ä‘á» (1)" },
  { topic: "Giao tiáº¿p ká»¹ thuáº­t sá»‘", period: 36, title: "BÃ i 25: Giao tiáº¿p kÄ© thuáº­t sá»‘ Ä‘á»ƒ giáº£i quyáº¿t váº¥n Ä‘á» (2)" },
  { topic: "Giao tiáº¿p ká»¹ thuáº­t sá»‘", period: 37, title: "BÃ i 26: TÆ°Æ¡ng tÃ¡c phÃ¹ há»£p khi giao tiáº¿p trÃªn mÃ´i trÆ°á»ng kÄ© thuáº­t sá»‘" },
  { topic: "Cá»™ng tÃ¡c", period: 38, title: "BÃ i 27: Cá»™ng tÃ¡c Ä‘á»ƒ giáº£i quyáº¿t váº¥n Ä‘á»" },
  { topic: "Cá»™ng tÃ¡c", period: 39, title: "BÃ i 27: Cá»™ng tÃ¡c Ä‘á»ƒ giáº£i quyáº¿t váº¥n Ä‘á»" },
  { topic: "Cá»™ng tÃ¡c", period: 40, title: "BÃ i 28: ÄÃ³ng gÃ³p vÃ o cÃ¡c dá»± Ã¡n (1)" },
  { topic: "Cá»™ng tÃ¡c", period: 41, title: "BÃ i 29: ÄÃ³ng gÃ³p vÃ o cÃ¡c dá»± Ã¡n (2)" },
  { topic: "Cá»™ng tÃ¡c", period: 42, title: "Ã”n táº­p 5" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 43, title: "BÃ i 30: Báº£o máº­t thiáº¿t bá»‹ cá»§a báº¡n" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 44, title: "BÃ i 30: Báº£o máº­t thiáº¿t bá»‹ cá»§a báº¡n" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 45, title: "BÃ i 31: Dáº¥u hiá»‡u nháº­n biáº¿t vÃ  cÃ¡c pháº§n má»m chá»‘ng Virus (1)" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 46, title: "BÃ i 32: Dáº¥u hiá»‡u nháº­n biáº¿t vÃ  cÃ¡c pháº§n má»m chá»‘ng Virus (2)" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 47, title: "BÃ i 33: Äáº·t láº¡i thiáº¿t bá»‹" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 48, title: "BÃ i 34: TÃ¡c Ä‘á»™ng cá»§a cÃ¡c cÃ´ng cá»¥ vÃ  cÃ´ng nghá»‡ kÄ© thuáº­t sá»‘ (1)" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 49, title: "BÃ i 35: TÃ¡c Ä‘á»™ng cá»§a cÃ¡c cÃ´ng cá»¥ vÃ  cÃ´ng nghá»‡ kÄ© thuáº­t sá»‘ (2)" },
  { topic: "An toÃ n vÃ  báº£o máº­t", period: 50, title: "Ã”n táº­p 6" },
  { topic: "TÄƒng cÆ°á»ng", period: 51, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 52, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 53, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 54, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 55, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 56, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 57, title: "Ã”n táº­p" },
  { topic: "TÄƒng cÆ°á»ng", period: 58, title: "Luyá»‡n thi" },
  { topic: "TÄƒng cÆ°á»ng", period: 59, title: "Luyá»‡n thi" },
  { topic: "TÄƒng cÆ°á»ng", period: 60, title: "Luyá»‡n thi" },
];

export function AttendanceSheetPanel({ selectedClass, students }: AttendanceSheetPanelProps) {
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatInputDate(new Date()));
  const [sessionFilter, setSessionFilter] = useState<"Táº¥t cáº£ tiáº¿t" | SessionPart>("Táº¥t cáº£ tiáº¿t");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; student: ClassroomStudent } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentDraft>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const dateColumns = useMemo(() => buildAttendanceColumns(selectedDate), [selectedDate]);
  const visibleColumns = dateColumns.filter((column) => sessionFilter === "Táº¥t cáº£ tiáº¿t" || column.session === sessionFilter);
  const visibleDayGroups = useMemo(() => groupAttendanceColumnsByDate(visibleColumns), [visibleColumns]);
  const dateRangeLabel = `${dateColumns[0]?.date ?? ""} - ${dateColumns[dateColumns.length - 1]?.date ?? ""}`;
  const taughtLessonCount = countLessonsThroughDate(selectedDate);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return students;
    return students.filter((student) => student.name.toLowerCase().includes(normalizedQuery));
  }, [searchQuery, students]);

  function statusFor(studentId: string, studentIndex: number, columnId: string, columnIndex: number) {
    return attendanceOverrides[attendanceKey(studentId, columnId)] ?? getMockAttendanceStatus(studentIndex, columnIndex);
  }

  function updateAttendance(studentId: string, studentIndex: number, columnId: string, columnIndex: number) {
    const key = attendanceKey(studentId, columnId);
    const currentStatus = attendanceOverrides[key] ?? getMockAttendanceStatus(studentIndex, columnIndex);
    setAttendanceOverrides((current) => ({
      ...current,
      [key]: nextAttendanceStatus(currentStatus),
    }));
    setSavedAt(null);
  }

  function resetVisibleAttendance() {
    const visibleKeys = new Set<string>();
    filteredStudents.forEach((student) => {
      visibleColumns.forEach((column) => visibleKeys.add(attendanceKey(student.id, column.id)));
    });
    setAttendanceOverrides((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !visibleKeys.has(key))));
    setSavedAt(null);
  }

  function saveAttendance() {
    const storageKey = `lms-attendance:${selectedClass?.id ?? "all"}:${selectedDate}`;
    window.localStorage.setItem(storageKey, JSON.stringify({ overrides: attendanceOverrides, studentDrafts, savedAt: new Date().toISOString() }));
    setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
  }

  function exportCsv() {
    const header = ["STT", "Há»c sinh", "Tá»•ng váº¯ng", ...visibleColumns.map((column) => `${column.day} ${column.date} ${column.session}`)];
    const rows = filteredStudents.map((student, studentIndex) => {
      const statuses = visibleColumns.map((column, columnIndex) => statusFor(student.id, studentIndex, column.id, columnIndex));
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
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <section className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[220px] border-b border-slate-900 pb-1 pr-6 text-[12px] italic leading-5 text-[#001d63]">
            <div>Gv phá»¥ trÃ¡ch: <span className="font-semibold">{selectedClass?.homeroomTeacher ?? ""}</span></div>
            <div className="flex items-center gap-10">
              <span>Sá»‘ tiáº¿t Ä‘Ã£ dáº¡y:</span>
              <span className="font-black not-italic text-red-600">{taughtLessonCount}</span>
            </div>
          </div>
          {notice ? <span className="rounded bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">{notice}</span> : null}
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="TÃ¬m há»c sinh"
              className="h-8 border-slate-200 bg-slate-50 pl-8 text-xs shadow-none focus:bg-white"
            />
          </div>
          <label className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700">
            <span className="text-slate-500">NgÃ y</span>
            <span className="min-w-[74px] text-slate-800">{formatFullDate(parseDateInput(selectedDate))}</span>
            <input
              type="date"
              aria-label="Chá»n ngÃ y trá»ng tÃ¢m"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSavedAt(null);
              }}
              className="h-7 w-8 cursor-pointer rounded bg-transparent text-transparent outline-none"
            />
          </label>
          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value as "Táº¥t cáº£ tiáº¿t" | SessionPart)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option>Táº¥t cáº£ tiáº¿t</option>
            <option>Tiáº¿t 1</option>
            <option>Tiáº¿t 2</option>
          </select>
          <Button type="button" variant="outline" onClick={resetVisibleAttendance} className="h-8 rounded-md px-2.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Äáº·t láº¡i
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv} className="h-8 rounded-md px-2.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Xuáº¥t CSV
          </Button>
          <Button type="button" onClick={saveAttendance} className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-black text-white">
            <Save className="h-3.5 w-3.5" />
            LÆ°u
          </Button>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
            <h2 className="text-sm font-black text-slate-950">Äiá»ƒm danh {dateRangeLabel}</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              {savedAt ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">ÄÃ£ lÆ°u {savedAt}</span> : null}
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">CÃ³ máº·t</span>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Äi muá»™n</span>
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">Váº¯ng</span>
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">CÃ³ phÃ©p</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-[790px] border-separate border-spacing-0 text-[11px]">
              <thead>
                <tr className="bg-[#f8fbff] text-[10px] font-black uppercase text-[#1d4ed8]">
                  <AttendanceHeaderCell rowSpan={2} className="sticky left-0 top-0 z-40 w-9">STT</AttendanceHeaderCell>
                  <AttendanceHeaderCell rowSpan={2} className="sticky left-9 top-0 z-40 w-40 text-left">Há»c sinh</AttendanceHeaderCell>
                  <AttendanceHeaderCell rowSpan={2} className="sticky left-[196px] top-0 z-40 w-[62px]">Tá»•ng váº¯ng</AttendanceHeaderCell>
                  {visibleDayGroups.map((group) => (
                    <AttendanceHeaderCell key={group.id} colSpan={group.columns.length} className={cn("sticky top-0 z-30 w-[76px]", group.isFocusDate && "border-x-2 border-t-2 border-blue-300 bg-blue-100 text-blue-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]")}>
                      <span className="block">{group.day}</span>
                      <span className="mt-0.5 block text-[10px] font-bold normal-case text-slate-500">{group.date}</span>
                    </AttendanceHeaderCell>
                  ))}
                </tr>
                <tr className="bg-[#f8fbff] text-[10px] font-black uppercase text-[#1d4ed8]">
                  {visibleDayGroups.map((group) => (
                    <AttendanceHeaderCell key={`${group.id}-lessons`} colSpan={group.columns.length} className={cn("sticky top-8 z-30 w-[76px]", group.isFocusDate && "border-x-2 border-blue-300 bg-blue-100 text-blue-800")}>
                      {group.columns.length}
                    </AttendanceHeaderCell>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, studentIndex) => {
                  const statuses = visibleColumns.map((column, columnIndex) => statusFor(student.id, studentIndex, column.id, columnIndex));
                  const summary = attendanceSummary(statuses);
                  return (
                    <tr key={student.id} className="group">
                      <AttendanceStickyCell className="left-0 z-20 w-9 text-center text-slate-500">{studentIndex + 1}</AttendanceStickyCell>
                      <AttendanceStickyCell className="left-9 z-20 w-40">
                        <button
                          type="button"
                          className="max-w-[136px] truncate text-left font-bold text-[#2563eb] hover:underline"
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
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black", summary.absent ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
                          {summary.absent}
                        </span>
                      </AttendanceStickyCell>
                      {visibleColumns.map((column, columnIndex) => {
                        const status = statuses[columnIndex];
                        return (
                          <td key={column.id} className={cn("h-7 border-b border-r border-blue-100 px-1 text-center group-hover:!bg-blue-50", attendanceSubColumnWidthClass(column, visibleDayGroups), attendanceCellClass(status), column.isFocusDate && focusAttendanceCellClass(status))}>
                            <button
                              type="button"
                              onClick={() => updateAttendance(student.id, studentIndex, column.id, columnIndex)}
                              className="h-6 w-full rounded text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-200"
                              aria-label={`${student.name} ${column.day} ${column.session}`}
                              title="Báº¥m Ä‘á»ƒ Ä‘á»•i tráº¡ng thÃ¡i"
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

        <CurriculumDistributionPanel selectedDate={selectedDate} taughtLessonCount={taughtLessonCount} />
      </div>

      <StudentAttendanceContextMenu
        menu={contextMenu}
        onAddStudent={() => showAction("ÄÃ£ má»Ÿ thao tÃ¡c thÃªm há»c sinh má»›i")}
        onAddNote={(student) => showAction(`ÄÃ£ thÃªm note nhanh cho ${student.name}`)}
        onChangeStatus={(student) => {
          updateStudentDraft(student.id, { status: nextStudentStatus(studentDrafts[student.id]?.status ?? student.status) });
          showAction(`ÄÃ£ Ä‘á»•i tráº¡ng thÃ¡i ${student.name}`);
        }}
        onClose={() => setContextMenu(null)}
        onOpenNote={(student) => {
          openStudentDetail(student);
          showAction(`Äang ghi chÃº cho ${student.name}`);
        }}
      />

      {selectedStudent ? (
        <StudentDetailDrawer
          draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent)}
          onClose={() => setSelectedStudentId(null)}
          onUpdate={(patch) => updateStudentDraft(selectedStudent.id, patch)}
          student={selectedStudent}
        />
      ) : null}
    </div>
  );
}

function CurriculumDistributionPanel({ selectedDate, taughtLessonCount }: { selectedDate: string; taughtLessonCount: number }) {
  const topicSpans = getCurriculumTopicSpans(curriculumProgram);
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black uppercase text-[#001d63]">Khung chÆ°Æ¡ng trÃ¬nh tin há»c quá»‘c táº¿</h2>
            <p className="mt-0.5 text-xs font-black text-[#001d63]">IC3 GS6 Level 3 - Tin há»c 8</p>
          </div>
          <span className="rounded bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{taughtLessonCount} tiáº¿t Ä‘Ã£ Ä‘iá»ƒm danh</span>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-slate-500">NgÃ y trá»ng tÃ¢m {formatFullDate(parseDateInput(selectedDate))}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-white p-2">
        <table className="w-full min-w-[560px] border-collapse text-[12px] text-[#001d63]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="border border-slate-900 bg-slate-100 px-2 py-1 text-center font-bold">Chá»§ Ä‘á»</th>
              <th className="w-12 border border-slate-900 bg-slate-100 px-2 py-1 text-center font-bold">Tiáº¿t</th>
              <th className="border border-slate-900 bg-slate-100 px-2 py-1 text-center font-bold">TÃªn bÃ i há»c</th>
            </tr>
          </thead>
          <tbody>
            {curriculumProgram.map((item, index) => {
              const isCurrent = item.period === taughtLessonCount;
              const isDone = item.period < taughtLessonCount;
              return (
                <tr key={item.period} className={cn(isCurrent && "bg-blue-50", isDone && !isCurrent && "bg-emerald-50/30")}>
                  {topicSpans.firstRows.get(item.topic) === index ? (
                    <td rowSpan={topicSpans.counts.get(item.topic)} className="w-32 border border-slate-900 px-2 py-1 text-center align-middle font-semibold">
                      {item.topic}
                    </td>
                  ) : null}
                  <td className="border border-slate-900 px-2 py-1 text-center italic">{item.period}</td>
                  <td className={cn("border border-slate-900 px-2 py-1 font-normal", isCurrent && "font-bold ring-2 ring-inset ring-emerald-500")}>
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

function StudentDetailDrawer({
  draft,
  onClose,
  onUpdate,
  student,
}: {
  draft: StudentDraft;
  onClose: () => void;
  onUpdate: (patch: Partial<StudentDraft>) => void;
  student: ClassroomStudent;
}) {
  return (
    <>
      <button type="button" aria-label="ÄÃ³ng chi tiáº¿t há»c sinh" className="fixed inset-0 z-[90] bg-slate-950/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-[100] flex h-screen w-[420px] max-w-[calc(100vw-20px)] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-lg font-black text-slate-950">Chi tiáº¿t há»c sinh</h2>
            <p className="text-xs font-semibold text-slate-500">{student.className} Â· {student.schoolName}</p>
          </div>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="grid gap-3">
            <Field label="Há» tÃªn">
              <input value={draft.name} onChange={(event) => onUpdate({ name: event.target.value })} className={detailInputClass} />
            </Field>
            <Field label="Username">
              <input value={draft.username} onChange={(event) => onUpdate({ username: event.target.value })} className={detailInputClass} />
            </Field>
            <Field label="Password">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={draft.password} onChange={(event) => onUpdate({ password: event.target.value })} className={cn(detailInputClass, "pl-8")} />
              </div>
            </Field>
            <Field label="Tráº¡ng thÃ¡i">
              <select value={draft.status} onChange={(event) => onUpdate({ status: event.target.value as StudentStatus })} className={detailInputClass}>
                <option value="ahead">VÆ°á»£t tiáº¿n Ä‘á»™</option>
                <option value="steady">á»”n Ä‘á»‹nh</option>
                <option value="support">Cáº§n há»— trá»£</option>
              </select>
            </Field>
            <Field label="Ghi chÃº">
              <textarea value={draft.note} onChange={(event) => onUpdate({ note: event.target.value })} className={cn(detailInputClass, "min-h-28 py-2 leading-5")} />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Tiáº¿n Ä‘á»™" value={`${student.progressRate}%`} />
            <MiniMetric label="Äiá»ƒm TB" value={`${student.averageScore}`} />
            <MiniMetric label="BÃ i hoÃ n thÃ nh" value={`${student.completedAssignments}`} />
            <MiniMetric label="Streak" value={`${student.streakDays} ngÃ y`} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
          <span className="text-xs font-bold text-slate-500">{statusLabels[draft.status]}</span>
          <Button type="button" onClick={onClose} className="h-9 rounded-md px-3 text-xs">
            LÆ°u thÃ´ng tin
          </Button>
        </div>
      </aside>
    </>
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
    <th colSpan={colSpan} rowSpan={rowSpan} className={cn("h-8 border-b border-r border-blue-200 bg-[#f8fbff] px-1.5 text-center align-middle", className)}>
      {children}
    </th>
  );
}

function AttendanceStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("sticky h-7 border-b border-r border-blue-100 bg-white px-1.5 align-middle group-hover:bg-blue-50", className)}>{children}</td>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
      <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-xs font-black text-slate-900">{value}</div>
    </div>
  );
}

const detailInputClass = "h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

function attendanceKey(studentId: string, columnId: string) {
  return `${studentId}:${columnId}`;
}

function buildAttendanceColumns(focusDateValue: string): AttendanceColumn[] {
  const focusDate = parseDateInput(focusDateValue);
  return Array.from({ length: 7 }).flatMap((_, index) => {
    const dayOffset = index - 3;
    const currentDate = addDays(focusDate, dayOffset);
    const id = formatInputDate(currentDate);
    const lessons = lessonsForDate(currentDate);
    return lessons.map((session, lessonIndex) => ({
      id: `${id}-${lessonIndex + 1}`,
      day: weekdayLabel(currentDate),
      date: formatShortDate(currentDate),
      fullDate: formatFullDate(currentDate),
      isFocusDate: dayOffset === 0,
      lessonIndex: lessonIndex + 1,
      session,
    }));
  });
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
  if (day === 0) return ["Tiáº¿t 1"];
  if (day === 2 || day === 4 || day === 6) return ["Tiáº¿t 1", "Tiáº¿t 2"];
  return ["Tiáº¿t 1"];
}

function countLessonsThroughDate(selectedDateValue: string) {
  const startDate = parseDateInput(COURSE_START_DATE);
  const endDate = parseDateInput(selectedDateValue);
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
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "âœ“";
}

function attendanceText(status: AttendanceStatus) {
  if (status === "absent") return "Váº¯ng";
  if (status === "late") return "Äi muá»™n";
  if (status === "excused") return "CÃ³ phÃ©p";
  return "CÃ³ máº·t";
}

function attendanceCellClass(status: AttendanceStatus) {
  if (status === "absent") return "bg-rose-50 text-rose-700";
  if (status === "late") return "bg-amber-50 text-amber-700";
  if (status === "excused") return "bg-sky-50 text-sky-700";
  return "bg-emerald-50 text-emerald-700";
}

function focusAttendanceCellClass(status: AttendanceStatus) {
  const edge = "border-x-2 border-x-blue-300";
  if (status === "absent") return cn(edge, "bg-rose-100/80");
  if (status === "late") return cn(edge, "bg-amber-100/80");
  if (status === "excused") return cn(edge, "bg-sky-100/80");
  return cn(edge, "bg-blue-50");
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
  const labels = ["Chá»§ Nháº­t", "Thá»© Hai", "Thá»© Ba", "Thá»© TÆ°", "Thá»© NÄƒm", "Thá»© SÃ¡u", "Thá»© Báº£y"];
  return labels[date.getDay()];
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D");
}
