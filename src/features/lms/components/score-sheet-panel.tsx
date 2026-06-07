import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, Filter, History, LockKeyhole, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button, Input } from "@/components/ui/dashboard-kit";
import { StudentProfileDetailDrawer } from "@/features/lms/classroom/components/student-profile-detail-drawer";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type ScoreColumn = {
  id: string;
  label: string;
  maxScore: number;
  kind: "topic" | "quiz" | "offline";
};

type ScoreAttempt = {
  id: string;
  score: number;
  duration: string;
  takenAt: string;
};

type Classification = "A" | "B" | "C" | "D" | "E";
type ClassificationSort = "asc" | "desc" | null;
type StudentState = "active" | "disabled";

type ClassificationLog = {
  id: string;
  at: string;
  by: string;
  from: Classification;
  to: Classification;
  comment: string;
};

type StudentDraft = {
  name: string;
  username: string;
  password: string;
  state: StudentState;
  note: string;
};

type ScoreSheetPanelProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const baseScoreColumns: ScoreColumn[] = [
  { id: "topic-tech", label: "Căn bản công nghệ", maxScore: 1000, kind: "topic" },
  { id: "topic-citizen", label: "Công dân số", maxScore: 1000, kind: "topic" },
  { id: "topic-info", label: "Quản lý thông tin", maxScore: 1000, kind: "topic" },
  { id: "topic-content", label: "Sáng tạo nội dung", maxScore: 1000, kind: "topic" },
  { id: "topic-communication", label: "Giao tiếp kỹ thuật số", maxScore: 1000, kind: "topic" },
  { id: "topic-collab", label: "Cộng tác", maxScore: 1000, kind: "topic" },
  { id: "topic-security", label: "An toàn bảo mật", maxScore: 1000, kind: "topic" },
  { id: "review-01", label: "Ôn thi IC3 1", maxScore: 1000, kind: "quiz" },
];

const classificationOptions: Classification[] = ["A", "B", "C", "D", "E"];

export function ScoreSheetPanel({ selectedClass, selectedSchoolName, students }: ScoreSheetPanelProps) {
  const [offlineColumns, setOfflineColumns] = useState<ScoreColumn[]>([]);
  const [offlineColumnName, setOfflineColumnName] = useState("");
  const [manualScores, setManualScores] = useState<Record<string, string>>({});
  const [bonusScores, setBonusScores] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const [classificationFilter, setClassificationFilter] = useState<Classification[]>(classificationOptions);
  const [classificationSort, setClassificationSort] = useState<ClassificationSort>(null);
  const [manualClassifications, setManualClassifications] = useState<Record<string, Classification>>({});
  const [classificationLogs, setClassificationLogs] = useState<Record<string, ClassificationLog[]>>({});
  const [logStudentId, setLogStudentId] = useState<string | null>(null);
  const [pendingClassification, setPendingClassification] = useState<{ student: ClassroomStudent; from: Classification; to: Classification } | null>(null);
  const [classificationComment, setClassificationComment] = useState("");
  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>({});
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentDraft>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; student: ClassroomStudent } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery);

  const scoreColumns = [...baseScoreColumns, ...offlineColumns];
  const scoreColumnWidth = `clamp(108px, calc((100vw - 470px) / ${scoreColumns.length}), 160px)`;
  const scoreTableWidth = `max(100%, ${428 + scoreColumns.length * 108}px)`;
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const scoreTableColumns = useMemo<ColumnDef<ClassroomStudent>[]>(
    () => [
      {
        accessorFn: (student) => studentStates[student.id] ?? "active",
        id: "state",
        sortingFn: (rowA, rowB, columnId) => {
          const stateA = rowA.getValue<StudentState>(columnId);
          const stateB = rowB.getValue<StudentState>(columnId);
          if (stateA === stateB) return 0;
          return stateA === "disabled" ? 1 : -1;
        },
      },
      {
        accessorFn: (student) => getStudentClassification(student, manualClassifications),
        filterFn: (row, columnId, filterValue) => {
          const selected = filterValue as Classification[];
          return selected.includes(row.getValue<Classification>(columnId));
        },
        id: "classification",
        sortingFn: (rowA, rowB, columnId) => {
          const rankA = classificationOptions.indexOf(rowA.getValue<Classification>(columnId));
          const rankB = classificationOptions.indexOf(rowB.getValue<Classification>(columnId));
          return rankA - rankB;
        },
      },
      {
        accessorFn: (student) => student.name,
        filterFn: (row, columnId, filterValue) => {
          const normalizedQuery = String(filterValue ?? "").trim().toLowerCase();
          return !normalizedQuery || row.getValue<string>(columnId).toLowerCase().includes(normalizedQuery);
        },
        id: "student",
        sortingFn: (rowA, rowB, columnId) => rowA.getValue<string>(columnId).localeCompare(rowB.getValue<string>(columnId), "vi"),
      },
    ],
    [manualClassifications, studentStates],
  );
  const scoreColumnFilters = useMemo<ColumnFiltersState>(
    () => [
      { id: "classification", value: classificationFilter },
      { id: "student", value: debouncedSearchQuery },
    ],
    [classificationFilter, debouncedSearchQuery],
  );
  const scoreSorting = useMemo<SortingState>(
    () => [
      { desc: false, id: "state" },
      ...(classificationSort ? [{ desc: classificationSort === "desc", id: "classification" } as const] : []),
      { desc: false, id: "student" },
    ],
    [classificationSort],
  );
  const scoreTable = useReactTable({
    columns: scoreTableColumns,
    data: students,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters: scoreColumnFilters,
      sorting: scoreSorting,
    },
  });
  const sortedStudentRows = scoreTable.getRowModel().rows;
  const sortedStudents = sortedStudentRows.map((row) => row.original);
  const rowVirtualizer = useVirtualList({
    count: sortedStudents.length,
    estimateSize: 28,
    overscan: 10,
    scrollRef: tableScrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();
  const virtualRows = measuredVirtualRows.length
    ? measuredVirtualRows
    : Array.from({ length: Math.min(sortedStudents.length, 20) }, (_, index) => ({
        end: (index + 1) * 28,
        index,
        start: index * 28,
      }));
  const virtualTotalSize = Math.max(rowVirtualizer.getTotalSize(), sortedStudents.length * 28);
  const tableColumnCount = 4 + scoreColumns.length;

  function addOfflineColumn() {
    const label = offlineColumnName.trim() || `Bài offline ${offlineColumns.length + 1}`;
    setOfflineColumns((columns) => [
      ...columns,
      { id: `offline-${Date.now()}-${columns.length}`, label, maxScore: 10, kind: "offline" },
    ]);
    setOfflineColumnName("");
  }

  function updateManualScore(columnId: string, studentId: string, score: string) {
    if (!/^\d*([.,]\d*)?$/.test(score)) return;
    setManualScores((current) => ({ ...current, [`${columnId}:${studentId}`]: score.replace(",", ".") }));
  }

  function updateBonusScore(studentId: string, score: string) {
    if (!/^-?\d*([.,]\d*)?$/.test(score)) return;
    setBonusScores((current) => ({ ...current, [studentId]: score.replace(",", ".") }));
  }

  function commitScoreInputOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  function requestClassificationChange(student: ClassroomStudent, next: Classification) {
    const previous = getStudentClassification(student, manualClassifications);
    if (previous === next) return;
    setPendingClassification({ student, from: previous, to: next });
    setClassificationComment("");
  }

  function saveClassificationChange() {
    if (!pendingClassification || !classificationComment.trim()) return;
    const { student, from, to } = pendingClassification;
    setManualClassifications((current) => ({ ...current, [student.id]: to }));
    setClassificationLogs((current) => ({
      ...current,
      [student.id]: [
        {
          id: `log-${Date.now()}`,
          at: new Date().toLocaleString("vi-VN"),
          by: "Giáo viên phụ trách",
          from,
          to,
          comment: classificationComment.trim(),
        },
        ...(current[student.id] ?? []),
      ],
    }));
    setPendingClassification(null);
    setClassificationComment("");
    toast.success("Da cap nhat xep loai");
  }

  function openStudentDetail(student: ClassroomStudent) {
    setSelectedStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createStudentDraft(student, studentStates[student.id] ?? "active"),
    }));
  }

  function updateStudentDraft(studentId: string, patch: Partial<StudentDraft>) {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    setStudentDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? createStudentDraft(student, studentStates[studentId] ?? "active")), ...patch },
    }));
    if (patch.state) {
      setStudentStates((current) => ({ ...current, [studentId]: patch.state ?? "active" }));
    }
  }

  function disableStudent(student: ClassroomStudent) {
    setStudentStates((current) => ({ ...current, [student.id]: "disabled" }));
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: { ...(current[student.id] ?? createStudentDraft(student, "disabled")), state: "disabled" },
    }));
    setNotice(`Đã khóa elearning và đưa ${student.name} xuống cuối danh sách`);
    toast.success("Da khoa tai khoan elearning");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2 py-2 xl:px-3">
      <section className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[220px]">
            <div className="text-sm font-semibold leading-5 text-slate-950">{selectedClass?.className ?? "Lớp học"}</div>
            <div className="text-[11px] font-semibold text-slate-500">
              {selectedSchoolName} · {students.length} học sinh · {scoreColumns.length} cột điểm
            </div>
          </div>
          {notice ? <span className="rounded bg-[var(--erg-blue-light)] px-2 py-1 text-[11px] font-medium text-[var(--erg-blue)]">{notice}</span> : null}
          <AppSelect
            aria-label="Chọn môn học"
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-[#b8d6fa]"
          >
            {lmsSubjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </AppSelect>
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm học sinh"
              className="h-8 border-slate-200 bg-slate-50 pl-8 text-xs shadow-none focus:bg-white"
            />
          </div>
          <input
            value={offlineColumnName}
            onChange={(event) => setOfflineColumnName(event.target.value)}
            placeholder="Tên cột offline"
            className="h-8 w-36 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium outline-none focus:border-[#b8d6fa]"
          />
          <Button type="button" onClick={addOfflineColumn} className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" />
            Cột offline
          </Button>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
          <h2 className="text-sm font-semibold text-slate-950">Bảng điểm theo chủ đề</h2>
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Điểm mới nhất</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Hover xem lịch sử</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">- là chưa làm</span>
          </div>
        </div>
        <div ref={tableScrollRef} className="min-h-0 flex-1 overflow-auto">
          <table style={{ width: scoreTableWidth }} className="table-fixed border-separate border-spacing-0 text-[11px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500">
                <ScoreHeaderCell className="sticky left-0 top-0 z-40 w-[44px]">STT</ScoreHeaderCell>
                <ScoreHeaderCell className="sticky left-[44px] top-0 z-40 w-[190px] text-left">Học sinh</ScoreHeaderCell>
                <ScoreHeaderCell className="sticky left-[234px] top-0 z-40 w-[82px]">Điểm +/-</ScoreHeaderCell>
                <ScoreHeaderCell className="sticky left-[316px] top-0 z-40 w-[112px]">
                  <ClassificationFilterMenu
                    selected={classificationFilter}
                    sort={classificationSort}
                    onApply={(nextSelected, nextSort) => {
                      setClassificationFilter(nextSelected);
                      setClassificationSort(nextSort);
                    }}
                  />
                </ScoreHeaderCell>
                {scoreColumns.map((column) => (
                  <ScoreHeaderCell key={column.id} style={{ width: scoreColumnWidth }} className={cn("sticky top-0 z-30", column.kind === "offline" && "bg-amber-50 text-amber-700")}>
                    <span title={`Điểm tối đa: ${column.maxScore}`} className="block cursor-help leading-4">
                      {column.label}
                    </span>
                  </ScoreHeaderCell>
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
                const index = virtualRow.index;
                const studentRow = sortedStudentRows[index];
                const student = studentRow?.original;
                if (!student) return null;
                const sourceStudentIndex = studentRow.index;
                const studentState = studentStates[student.id] ?? "active";
                const classification = getStudentClassification(student, manualClassifications);
                return (
                  <tr key={student.id} className={cn("group", studentState === "disabled" && "text-slate-400")}>
                    <ScoreStickyCell className={cn("left-0 z-20 w-[44px] text-center text-slate-500", studentState === "disabled" && "bg-slate-100")}>{index + 1}</ScoreStickyCell>
                    <ScoreStickyCell className={cn("left-[44px] z-20 w-[190px]", studentState === "disabled" && "bg-slate-100")}>
                      <button
                        type="button"
                        className={cn("max-w-[166px] truncate text-left font-medium text-[var(--erg-blue)] hover:underline", studentState === "disabled" && "text-slate-400")}
                        onClick={() => openStudentDetail(student)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          setContextMenu({ x: event.clientX, y: event.clientY, student });
                        }}
                      >
                        {studentDrafts[student.id]?.name ?? student.name}
                      </button>
                    </ScoreStickyCell>
                    <ScoreStickyCell className={cn("left-[234px] z-20 w-[82px] text-center", studentState === "disabled" && "bg-slate-100")}>
                      <input
                        value={bonusScores[student.id] ?? ""}
                        onChange={(event) => updateBonusScore(student.id, event.target.value)}
                        onKeyDown={commitScoreInputOnEnter}
                        className="h-6 w-full rounded border border-transparent bg-transparent text-center font-semibold text-slate-700 outline-none focus:border-[#b8d6fa] focus:bg-white"
                        placeholder="0"
                      />
                    </ScoreStickyCell>
                    <ScoreStickyCell className={cn("left-[316px] z-20 w-[112px]", studentState === "disabled" && "bg-slate-100")}>
                      <div className="group/log relative">
                        <AppSelect
                          data-classification-select="true"
                          data-classification={classification}
                          value={classification}
                          onChange={(event) => requestClassificationChange(student, event.target.value as Classification)}
                          className={cn("h-8 w-full rounded-lg border text-center text-xs font-semibold outline-none transition", classificationClass(classification))}
                          style={{ textAlignLast: "center" }}
                        >
                          {classificationOptions.map((option) => <option key={option}>{option}</option>)}
                        </AppSelect>
                        {(classificationLogs[student.id]?.length ?? 0) > 0 ? (
                          <button
                            type="button"
                            className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white/90 text-[var(--erg-blue)] shadow-sm ring-1 ring-[#b8d6fa] hover:bg-slate-50"
                            onClick={() => setLogStudentId((current) => (current === student.id ? null : student.id))}
                            aria-label={`Xem log xếp loại của ${student.name}`}
                          >
                            <History className="h-3 w-3" />
                          </button>
                        ) : null}
                        {logStudentId === student.id ? <ClassificationLogPopup logs={classificationLogs[student.id] ?? []} onClose={() => setLogStudentId(null)} /> : null}
                      </div>
                    </ScoreStickyCell>
                    {scoreColumns.map((column, columnIndex) => {
                      if (column.kind === "offline") {
                        return (
                          <td key={column.id} style={{ width: scoreColumnWidth }} className="h-7 border-b border-r border-slate-100 bg-amber-50/40 px-1 text-center group-hover:!bg-[var(--erg-blue-light)]">
                            <input
                              value={manualScores[`${column.id}:${student.id}`] ?? ""}
                              onChange={(event) => updateManualScore(column.id, student.id, event.target.value)}
                              onKeyDown={commitScoreInputOnEnter}
                              className="h-6 w-full rounded border border-transparent bg-transparent text-center font-semibold text-slate-800 outline-none focus:border-amber-300 focus:bg-white"
                              inputMode="decimal"
                              placeholder="-"
                              aria-label={`${student.name} ${column.label}`}
                            />
                          </td>
                        );
                      }

                      const attempts = getMockAttempts(student, column, sourceStudentIndex, columnIndex);
                      const latest = attempts[0];
                      return (
                        <td key={column.id} style={{ width: scoreColumnWidth }} className={cn("group/score relative h-7 border-b border-r border-slate-100 px-1.5 text-center font-semibold group-hover:!bg-[var(--erg-blue-light)]", scoreCellClass(latest?.score, column.maxScore))}>
                          {latest ? formatScore(latest.score) : "-"}
                          {latest ? <ScoreAttemptPopup attempts={attempts} maxScore={column.maxScore} /> : null}
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

      <ScoreStudentContextMenu
        menu={contextMenu}
        onAddTransferStudent={() => {
          setNotice("Đã mở thao tác thêm học sinh chuyển lớp vào");
          setContextMenu(null);
        }}
        onDisableStudent={(student) => {
          disableStudent(student);
          setContextMenu(null);
        }}
        onClose={() => setContextMenu(null)}
      />

      {selectedStudent ? (
        <StudentProfileDetailDrawer
          draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent, studentStates[selectedStudent.id] ?? "active")}
          onClose={() => setSelectedStudentId(null)}
          onUpdate={(patch) => updateStudentDraft(selectedStudent.id, patch)}
          onStatusChange={(state) => updateStudentDraft(selectedStudent.id, { state })}
          statusLabel="Tr?ng th?i t?i kho?n"
          statusOptions={[
            { label: "?ang h?c", value: "active" },
            { label: "Ngh? h?c / kh?a t?i kho?n", value: "disabled" },
          ]}
          statusValue={(studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent, studentStates[selectedStudent.id] ?? "active")).state}
          student={selectedStudent}
        />
      ) : null}

      {pendingClassification ? (
        <ClassificationChangeDialog
          comment={classificationComment}
          pending={pendingClassification}
          onCancel={() => {
            setPendingClassification(null);
            setClassificationComment("");
          }}
          onCommentChange={setClassificationComment}
          onSave={saveClassificationChange}
        />
      ) : null}
    </div>
  );
}

function ClassificationFilterMenu({
  onApply,
  selected,
  sort,
}: {
  onApply: (selected: Classification[], sort: ClassificationSort) => void;
  selected: Classification[];
  sort: ClassificationSort;
}) {
  const [open, setOpen] = useState(false);
  const [draftSelected, setDraftSelected] = useState<Classification[]>(selected);
  const [draftSort, setDraftSort] = useState<ClassificationSort>(sort);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const visibleOptions = classificationOptions.filter((option) => option.toLowerCase().includes(debouncedQuery.trim().toLowerCase()));
  const allChecked = draftSelected.length === classificationOptions.length;
  const isFiltered = selected.length !== classificationOptions.length || Boolean(sort);

  function openMenu() {
    setDraftSelected(selected);
    setDraftSort(sort);
    setQuery("");
    setOpen(true);
  }

  function toggleOption(option: Classification) {
    setDraftSelected((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]));
  }

  function toggleAll() {
    setDraftSelected(allChecked ? [] : classificationOptions);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openMenu}
        className={cn(
          "mx-auto grid h-7 w-full grid-cols-[18px_1fr_18px] items-center gap-1 rounded border bg-white px-1.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:border-[#b8d6fa]",
          isFiltered ? "border-[#b8d6fa] text-[var(--erg-blue)]" : "border-slate-200",
        )}
        aria-expanded={open}
      >
        <span />
        <span className="text-center">Xếp loại</span>
        <span className="flex items-center justify-end gap-0.5">
          <Filter className="h-3 w-3" />
          <ChevronDown className="h-3 w-3" />
        </span>
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Đóng bộ lọc xếp loại" className="fixed inset-0 z-[55] cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-[60] w-64 rounded-md border border-slate-200 bg-white p-2 text-left normal-case text-slate-800 shadow-sm shadow-slate-900/20">
            <button
              type="button"
              className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold hover:bg-slate-50", draftSort === "asc" && "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]")}
              onClick={() => setDraftSort("asc")}
            >
              <ArrowDownAZ className="h-4 w-4" />
              Sort A to Z
            </button>
            <button
              type="button"
              className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold hover:bg-slate-50", draftSort === "desc" && "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]")}
              onClick={() => setDraftSort("desc")}
            >
              <ArrowUpAZ className="h-4 w-4" />
              Sort Z to A
            </button>
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600"
              onClick={() => {
                onApply(classificationOptions, null);
                setOpen(false);
              }}
            >
              <X className="h-4 w-4" />
              Clear filter
            </button>
            <div className="my-2 border-t border-slate-100" />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-8 w-full rounded border border-slate-200 pl-7 pr-2 text-xs font-semibold outline-none focus:border-[#b8d6fa]"
              />
            </div>
            <div className="mt-2 max-h-44 overflow-auto rounded border border-slate-100 p-1">
              <CheckRow checked={allChecked} label="(Select All)" onToggle={toggleAll} />
              {visibleOptions.map((option) => (
                <CheckRow key={option} checked={draftSelected.includes(option)} label={option} onToggle={() => toggleOption(option)} />
              ))}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="h-7 rounded border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="h-7 rounded bg-[var(--erg-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--erg-blue-hover)]"
                onClick={() => {
                  onApply(draftSelected, draftSort);
                  setOpen(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CheckRow({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs font-semibold hover:bg-slate-50" onClick={onToggle}>
      <span className={cn("grid h-4 w-4 place-items-center rounded-sm border", checked ? "border-[var(--erg-blue)] bg-[var(--erg-blue-light)]0 text-white" : "border-slate-300 bg-white")}>
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}

function ScoreAttemptPopup({ attempts, maxScore }: { attempts: ScoreAttempt[]; maxScore: number }) {
  const best = attempts.reduce((currentBest, attempt) => (attempt.score > currentBest.score ? attempt : currentBest), attempts[0]);
  return (
    <div className="pointer-events-none absolute left-1/2 top-7 z-50 hidden w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm shadow-slate-900/15 group-hover/score:block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold text-slate-400">Điểm cao nhất</div>
          <div className="mt-1 text-xl font-semibold text-emerald-700">{formatScore(best.score)}/{maxScore}</div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">{best.duration} · {best.takenAt}</div>
        </div>
        <span className="rounded bg-[var(--erg-blue-light)] px-2 py-1 text-[11px] font-semibold text-[var(--erg-blue)]">{attempts.length} lần</span>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-2">
        <div className="mb-1 text-[10px] font-semibold text-slate-400">3 lần gần đây</div>
        {attempts.slice(0, 3).map((attempt) => (
          <div key={attempt.id} className="ml-3 flex items-center justify-between gap-2 py-1 text-[11px] font-semibold">
            <span className="text-slate-700">{formatScore(attempt.score)}/{maxScore}</span>
            <span className="text-slate-400">{attempt.duration} · {attempt.takenAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassificationLogPopup({ logs, onClose }: { logs: ClassificationLog[]; onClose: () => void }) {
  return (
    <>
      <button type="button" aria-label="Đóng log xếp loại" className="fixed inset-0 z-[55] cursor-default" onClick={onClose} />
      <div className="absolute left-full top-0 z-[60] ml-2 w-96 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm shadow-slate-900/20">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <div className="text-[10px] font-semibold text-slate-400">Log xếp loại</div>
            <div className="mt-0.5 text-xs font-medium text-slate-800">{logs.length} lần chỉnh tay có ghi chú</div>
          </div>
          <button type="button" className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 grid max-h-72 gap-2 overflow-auto">
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">{log.from} → {log.to}</div>
                <div className="text-slate-400">{log.at}</div>
              </div>
              <div className="mt-0.5 text-slate-500">{log.by}</div>
              <div className="mt-2 rounded border border-white bg-white px-2 py-1.5 font-semibold leading-5 text-slate-700">{log.comment}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ClassificationChangeDialog({
  comment,
  onCancel,
  onCommentChange,
  onSave,
  pending,
}: {
  comment: string;
  onCancel: () => void;
  onCommentChange: (value: string) => void;
  onSave: () => void;
  pending: { student: ClassroomStudent; from: Classification; to: Classification };
}) {
  const canSave = comment.trim().length > 0;
  return (
    <>
      <button type="button" aria-label="Đóng đổi xếp loại" className="fixed inset-0 z-[110] bg-slate-950/30" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-[120] w-[460px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="text-sm font-semibold text-slate-950">Đổi xếp loại học sinh</div>
          <div className="mt-1 text-xs font-semibold text-slate-500">{pending.student.name}</div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className={cn("rounded border px-2 py-1", classificationClass(pending.from))}>{pending.from}</span>
            <span className="text-slate-400">→</span>
            <span className={cn("rounded border px-2 py-1", classificationClass(pending.to))}>{pending.to}</span>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">Comment bắt buộc</span>
            <textarea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              className="min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              placeholder="Nhập lý do đổi xếp loại để giáo viên sau theo dõi được lịch sử."
              autoFocus
            />
          </label>
          <div className="mt-2 text-[11px] font-semibold text-slate-500">Chỉ khi bấm Lưu thì hệ thống mới ghi log và comment.</div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-3">
          <button type="button" className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50" onClick={onCancel}>
            Hủy
          </button>
          <button
            type="button"
            className={cn("h-9 rounded-md px-3 text-xs font-semibold text-white", canSave ? "bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]" : "cursor-not-allowed bg-slate-300")}
            disabled={!canSave}
            onClick={onSave}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </>
  );
}

function ScoreStudentContextMenu({
  menu,
  onAddTransferStudent,
  onClose,
  onDisableStudent,
}: {
  menu: { x: number; y: number; student: ClassroomStudent } | null;
  onAddTransferStudent: () => void;
  onClose: () => void;
  onDisableStudent: (student: ClassroomStudent) => void;
}) {
  if (!menu) return null;
  return (
    <>
      <button type="button" aria-label="Đóng menu học sinh" className="fixed inset-0 z-[70] cursor-default" onClick={onClose} />
      <div className="fixed z-[80] w-60 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-sm shadow-slate-900/15" style={{ left: menu.x, top: menu.y }}>
        <div className="border-b border-slate-100 px-3 py-2">
          <div className="truncate text-xs font-semibold text-slate-950">{menu.student.name}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-slate-500">{menu.student.className}</div>
        </div>
        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[var(--erg-blue)]" onClick={onAddTransferStudent}>
          <Plus className="h-3.5 w-3.5" />
          Thêm HS chuyển lớp vào
        </button>
        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-700 hover:bg-rose-50" onClick={() => onDisableStudent(menu.student)}>
          <LockKeyhole className="h-3.5 w-3.5" />
          Nghỉ học / khóa tài khoản
        </button>
      </div>
    </>
  );
}

function ScoreHeaderCell({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <th style={style} className={cn("h-8 border-b border-r border-slate-200 bg-slate-50 px-1.5 text-center align-middle", className)}>{children}</th>;
}

function ScoreStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("sticky h-7 border-b border-r border-slate-100 bg-white px-1.5 align-middle group-hover:bg-slate-50", className)}>{children}</td>;
}


function getMockAttempts(student: ClassroomStudent, column: ScoreColumn, studentIndex: number, columnIndex: number): ScoreAttempt[] {
  if ((studentIndex + columnIndex) % 6 === 0) return [];
  const count = ((studentIndex + columnIndex) % 4) + 1;
  return Array.from({ length: count }, (_, attemptIndex) => {
    const base = student.averageScore / 10 + ((columnIndex % 3) - 1) * 0.55 - attemptIndex * 0.25;
    const rawScore = (base / 10) * column.maxScore;
    const score = Math.max(0, Math.min(column.maxScore, column.maxScore >= 100 ? Math.round(rawScore) : Math.round(rawScore * 10) / 10));
    return {
      id: `${student.id}-${column.id}-${attemptIndex}`,
      score,
      duration: `${18 + ((studentIndex + attemptIndex * 7) % 32)} phút`,
      takenAt: `${String(18 + attemptIndex).padStart(2, "0")}/05/2026`,
    };
  });
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getStudentClassification(student: ClassroomStudent, manual: Record<string, Classification>): Classification {
  if (manual[student.id]) return manual[student.id];
  if (student.averageScore >= 90) return "A";
  if (student.averageScore >= 80) return "B";
  if (student.averageScore >= 70) return "C";
  if (student.averageScore >= 60) return student.status === "support" ? "E" : "D";
  return "E";
}

function classificationClass(classification: Classification) {
  if (classification === "A") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (classification === "B") return "border-sky-200 bg-sky-50 text-[var(--erg-blue)]";
  if (classification === "C") return "border-slate-200 bg-slate-50 text-slate-600";
  if (classification === "D") return "border-amber-200 bg-amber-50 text-amber-700";
  if (classification === "E") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function scoreCellClass(score: number | undefined, maxScore: number) {
  if (score === undefined) return "bg-white text-slate-300";
  const rate = score / maxScore;
  if (rate < 0.5) return "bg-rose-50 text-rose-700";
  if (rate >= 0.8) return "bg-emerald-50 text-emerald-700";
  return "bg-white text-slate-700";
}

function createStudentDraft(student: ClassroomStudent, state: StudentState): StudentDraft {
  const baseUsername = removeVietnameseMarks(student.name).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return {
    name: student.name,
    username: baseUsername || student.id,
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    state,
    note: student.mentorNote,
  };
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
