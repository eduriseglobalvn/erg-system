import { useMemo, useState, type KeyboardEvent } from "react";
import { ChevronDown, Edit3, History, Plus, Search, UserRound } from "lucide-react";

import { AppSelect } from "@/components/ui/app-select";
import TextField from "@mui/material/TextField";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { Classification, ScoreColumn, StudentState } from "@/features/lms/components/score-sheet-panel";
import { cn } from "@/lib/utils";

type MobileScoreMode = "student" | "column" | "sheet";

type MobileScoreEditor = {
  column: ScoreColumn;
  student: ClassroomStudent;
  value: string;
} | null;

type MobileScoreSheetPanelProps = {
  addOfflineColumn: () => void;
  bonusScores: Record<string, string>;
  commitScoreInputOnEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
  getClassification: (student: ClassroomStudent) => Classification;
  getStudentState: (student: ClassroomStudent) => StudentState;
  manualScores: Record<string, string>;
  offlineColumnName: string;
  onOfflineColumnNameChange: (value: string) => void;
  onOpenStudentDetail: (student: ClassroomStudent) => void;
  onRequestClassificationChange: (student: ClassroomStudent, next: Classification) => void;
  onUpdateBonusScore: (studentId: string, score: string) => void;
  onUpdateManualScore: (columnId: string, studentId: string, score: string) => void;
  scoreColumns: ScoreColumn[];
  searchQuery: string;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  selectedSubject: string;
  sortedStudents: ClassroomStudent[];
  studentNameFor: (student: ClassroomStudent) => string;
  onSearchQueryChange: (value: string) => void;
  onSelectedSubjectChange: (value: string) => void;
  subjectOptions: string[];
};

export function MobileScoreSheetPanel({
  addOfflineColumn,
  bonusScores,
  commitScoreInputOnEnter,
  getClassification,
  getStudentState,
  manualScores,
  offlineColumnName,
  onOfflineColumnNameChange,
  onOpenStudentDetail,
  onRequestClassificationChange,
  onSearchQueryChange,
  onSelectedSubjectChange,
  onUpdateBonusScore,
  onUpdateManualScore,
  scoreColumns,
  searchQuery,
  selectedClass,
  selectedSchoolName,
  selectedSubject,
  sortedStudents,
  studentNameFor,
  subjectOptions,
}: MobileScoreSheetPanelProps) {
  const [mode, setMode] = useState<MobileScoreMode>("student");
  const [activeColumnId, setActiveColumnId] = useState(scoreColumns[0]?.id ?? "");
  const [editor, setEditor] = useState<MobileScoreEditor>(null);
  const activeColumn = scoreColumns.find((column) => column.id === activeColumnId) ?? scoreColumns[0];
  const visibleStudents = sortedStudents;

  const classSummary = useMemo(() => {
    const activeCount = visibleStudents.filter((student) => getStudentState(student) === "active").length;
    return `${selectedSchoolName} · ${visibleStudents.length} học sinh · ${activeCount} đang học`;
  }, [getStudentState, selectedSchoolName, visibleStudents]);

  function scoreValueFor(column: ScoreColumn, student: ClassroomStudent, studentIndex: number, columnIndex: number) {
    const manual = manualScores[`${column.id}:${student.id}`];
    if (manual !== undefined) return manual;
    if (column.kind === "offline") return "";
    return String(getDefaultScore(student, column, studentIndex, columnIndex));
  }

  function openEditor(column: ScoreColumn, student: ClassroomStudent, studentIndex: number, columnIndex: number) {
    setEditor({ column, student, value: scoreValueFor(column, student, studentIndex, columnIndex) });
  }

  function saveEditor() {
    if (!editor) return;
    onUpdateManualScore(editor.column.id, editor.student.id, editor.value);
    setEditor(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f3f6fb]">
      <section className="shrink-0 border-b border-white bg-white px-3 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold text-slate-950">{selectedClass?.className ?? "Lớp học"}</div>
          <div className="mt-0.5 truncate text-[12px] font-semibold text-slate-500">{classSummary}</div>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_112px] gap-2">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
            <TextField
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Tìm học sinh"
              size="small"
              fullWidth
              sx={{
                "& .MuiInputBase-root": { height: 44, bgcolor: "white", borderRadius: "14px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d9e2ef" },
                "& .MuiInputBase-input": { pl: "36px", fontSize: "15px", fontWeight: 600 },
              }}
            />
          </label>
          <label className="flex h-11 min-w-0 items-center gap-1 rounded-[14px] border border-[#d9e2ef] bg-white px-2 text-[12px] font-semibold text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="sr-only">Môn</span>
            <AppSelect
              aria-label="Chọn môn học"
              value={selectedSubject}
              onChange={(event) => onSelectedSubjectChange(event.target.value)}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 pr-5 text-[13px] font-bold text-slate-900 shadow-none outline-none"
            >
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </AppSelect>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-[16px] bg-[#e9f0fb] p-1.5">
          {[
            ["student", "Học sinh"],
            ["column", "Cột điểm"],
            ["sheet", "Sheet"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn("min-h-11 rounded-[12px] px-2 text-[13px] font-bold text-slate-600 transition", mode === value && "bg-white text-[var(--erg-blue)] shadow-[0_1px_2px_rgba(15,23,42,0.08)]")}
              onClick={() => setMode(value as MobileScoreMode)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {mode === "student" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
          <div className="grid gap-3">
            {visibleStudents.map((student, studentIndex) => {
              const state = getStudentState(student);
              const classification = getClassification(student);
              return (
                <article key={student.id} className={cn("rounded-[16px] border border-white bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]", state === "disabled" && "bg-slate-50 text-slate-400")}>
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef6ff] text-[var(--erg-blue)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                      onClick={() => onOpenStudentDetail(student)}
                      aria-label={`Mở hồ sơ ${studentNameFor(student)}`}
                    >
                      <UserRound className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" className="block max-w-full truncate text-left text-[15px] font-bold text-slate-950" onClick={() => onOpenStudentDetail(student)}>
                        {studentNameFor(student)}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={cn("rounded-md border px-2 py-1 text-[12px] font-bold", classificationClass(classification))}>{classification}</span>
                        <input
                          value={bonusScores[student.id] ?? ""}
                          onChange={(event) => onUpdateBonusScore(student.id, event.target.value)}
                          onKeyDown={commitScoreInputOnEnter}
                          inputMode="decimal"
                          aria-label={`Điểm cộng trừ của ${studentNameFor(student)}`}
                          placeholder="+/-"
                          className="h-10 w-20 rounded-[12px] border border-[#d9e2ef] bg-white px-2 text-center text-[13px] font-bold outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                        />
                      </div>
                    </div>
                    <button type="button" className="h-11 rounded-[12px] border border-[#d9e2ef] bg-[#f8fbff] px-3 text-[13px] font-bold text-slate-700" onClick={() => onRequestClassificationChange(student, nextClassification(classification))}>
                      Đổi loại
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {scoreColumns.slice(0, 4).map((column, columnIndex) => (
                      <button
                        key={column.id}
                        type="button"
                        className="min-h-14 rounded-[14px] border border-[#d9e2ef] bg-[#fbfdff] px-2 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                        onClick={() => openEditor(column, student, studentIndex, columnIndex)}
                      >
                        <span className="block truncate text-[11px] font-bold text-slate-500">{column.label}</span>
                        <span className="mt-1 block text-[16px] font-bold text-slate-950">{scoreValueFor(column, student, studentIndex, columnIndex) || "-"}</span>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === "column" && activeColumn ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-[#d9e2ef] bg-white px-3 py-2">
            <label className="flex h-11 items-center gap-2 rounded-[14px] border border-[#d9e2ef] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[13px] font-bold text-slate-500">Cột</span>
              <select
                value={activeColumn.id}
                onChange={(event) => setActiveColumnId(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-slate-950 outline-none"
                aria-label="Chọn cột điểm"
              >
                {scoreColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
            <div className="grid gap-2">
              {visibleStudents.map((student, studentIndex) => {
                const columnIndex = Math.max(0, scoreColumns.findIndex((column) => column.id === activeColumn.id));
                return (
                  <div key={student.id} className="grid min-h-[58px] grid-cols-[minmax(0,1fr)_96px] items-center gap-2 rounded-[14px] border border-white bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                    <button type="button" className="min-w-0 text-left" onClick={() => onOpenStudentDetail(student)}>
                      <span className="block truncate text-[14px] font-bold text-slate-950">{studentNameFor(student)}</span>
                      <span className="mt-0.5 block text-[12px] font-semibold text-slate-500">{activeColumn.label}</span>
                    </button>
                    <input
                      value={scoreValueFor(activeColumn, student, studentIndex, columnIndex)}
                      onChange={(event) => onUpdateManualScore(activeColumn.id, student.id, event.target.value)}
                      onKeyDown={commitScoreInputOnEnter}
                      inputMode="decimal"
                      aria-label={`${studentNameFor(student)} ${activeColumn.label}`}
                      className="h-11 rounded-[12px] border border-[#d9e2ef] px-2 text-center text-[15px] font-bold outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "sheet" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          <div className="grid min-w-max" style={{ gridTemplateColumns: `148px repeat(${scoreColumns.length}, 88px)` }}>
            <div className="sticky left-0 top-0 z-20 border-b border-r border-[#d9e2ef] bg-[#f5f8fc] px-2 py-2 text-[12px] font-bold text-slate-600">Học sinh</div>
            {scoreColumns.map((column) => (
              <div key={column.id} className="sticky top-0 z-10 border-b border-r border-[#d9e2ef] bg-[#f5f8fc] px-2 py-2 text-center text-[11px] font-bold leading-4 text-slate-700">
                <span className="line-clamp-2">{column.label}</span>
              </div>
            ))}
            {visibleStudents.map((student, studentIndex) => (
              <div key={student.id} className="contents">
                <button type="button" className="sticky left-0 z-10 min-h-12 border-b border-r border-[#d9e2ef] bg-white px-2 text-left text-[12px] font-bold text-[var(--erg-blue)]" onClick={() => onOpenStudentDetail(student)}>
                  <span className="line-clamp-2">{studentNameFor(student)}</span>
                </button>
                {scoreColumns.map((column, columnIndex) => (
                  <button
                    key={`${student.id}-${column.id}`}
                    type="button"
                    className={cn("min-h-12 border-b border-r border-[#d9e2ef] px-1 text-center text-[13px] font-bold", scoreTone(scoreValueFor(column, student, studentIndex, columnIndex), column.maxScore))}
                    onClick={() => openEditor(column, student, studentIndex, columnIndex)}
                  >
                    {scoreValueFor(column, student, studentIndex, columnIndex) || "-"}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

        <div className="shrink-0 border-t border-[#d9e2ef] bg-white px-3 py-2 shadow-[0_-1px_0_rgba(15,23,42,0.03)]">
          <div className="grid grid-cols-[minmax(0,1fr)_52px] gap-2">
            <input
            value={offlineColumnName}
            onChange={(event) => onOfflineColumnNameChange(event.target.value)}
            placeholder="Tên cột offline"
            className="h-11 min-w-0 rounded-[12px] border border-[#d9e2ef] px-3 text-[14px] font-semibold outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
          />
          <button type="button" className="grid h-11 w-11 place-items-center rounded-[12px] bg-[var(--erg-blue)] text-white shadow-[0_8px_18px_rgba(15,108,189,0.24)]" onClick={addOfflineColumn} aria-label="Tạo cột offline">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {editor ? (
        <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/35" role="dialog" aria-modal="true" aria-label="Chỉnh điểm">
          <button type="button" className="absolute inset-0" aria-label="Đóng chỉnh điểm" onClick={() => setEditor(null)} />
          <div className="relative w-full rounded-t-[20px] border border-[#d9e2ef] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-18px_42px_rgba(15,23,42,0.18)]">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300" />
            <div className="text-[13px] font-bold text-slate-500">{editor.column.label}</div>
            <div className="mt-1 truncate text-[18px] font-bold text-slate-950">{studentNameFor(editor.student)}</div>
            <label className="mt-4 block">
              <span className="mb-1 block text-[13px] font-bold text-slate-600">Điểm</span>
              <input
                value={editor.value}
                onChange={(event) => setEditor({ ...editor, value: event.target.value })}
                inputMode="decimal"
              className="h-12 w-full rounded-[12px] border border-[#d9e2ef] px-3 text-center text-xl font-bold outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              autoFocus
            />
          </label>
            <div className="mt-3 rounded-[14px] border border-[#d9e2ef] bg-[#fbfdff] p-3">
              <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                <History className="h-4 w-4 text-[var(--erg-blue)]" />
                Lịch sử gần đây
              </div>
              <div className="mt-2 text-[13px] font-semibold text-slate-500">Mobile dùng tap sheet thay hover. Dữ liệu lịch sử thật sẽ nối API sau.</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="h-11 rounded-[12px] border border-[#d9e2ef] text-[14px] font-bold text-slate-700" onClick={() => setEditor(null)}>
                Hủy
              </button>
              <button type="button" className="h-11 rounded-[12px] bg-[var(--erg-blue)] text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(15,108,189,0.24)]" onClick={saveEditor}>
                <span className="inline-flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Lưu
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getDefaultScore(student: ClassroomStudent, column: ScoreColumn, studentIndex: number, columnIndex: number) {
  const raw = (student.averageScore / 10 + ((columnIndex % 3) - 1) * 0.45 + (studentIndex % 2) * 0.1) / 10;
  return Math.max(0, Math.min(column.maxScore, Math.round(raw * column.maxScore)));
}

function nextClassification(current: Classification): Classification {
  if (current === "A") return "B";
  if (current === "B") return "C";
  if (current === "C") return "D";
  if (current === "D") return "E";
  return "A";
}

function classificationClass(classification: Classification) {
  if (classification === "A") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (classification === "B") return "border-blue-200 bg-blue-50 text-[var(--erg-blue)]";
  if (classification === "C") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (classification === "D") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function scoreTone(value: string, maxScore: number) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "bg-white text-slate-300";
  const rate = score / maxScore;
  if (rate < 0.5) return "bg-rose-50 text-rose-700";
  if (rate >= 0.8) return "bg-emerald-50 text-emerald-700";
  return "bg-white text-slate-700";
}
