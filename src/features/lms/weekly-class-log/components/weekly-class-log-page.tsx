import { memo, useCallback, useEffect, useMemo, useState } from "react";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { weeklyClassLogWeeks } from "@/features/lms/weekly-class-log/api/mock-weekly-class-log-data";
import type {
  WeeklyClassLogDay,
  WeeklyClassLogPeriod,
  WeeklyClassLogSummary,
  WeeklyClassLogWeek,
} from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import { cn } from "@/lib/utils";
import { getPersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";

// Inline minimal student data for @mention autocomplete — avoids importing
// the full 13KB mock-classroom-data which is teacher-shell-only concern.
const CLASS_LOG_STUDENTS: Array<{ id: string; name: string }> = [
  { id: "student-1", name: "Võ Ngọc Linh" },
  ...Array.from(
    { length: 13 },
    (_, i) => ({ id: `student-${i + 2}`, name: `Học sinh ${i + 2}` }),
  ),
];

type WeeklyClassLogPageProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
};

type StudentMentionOption = {
  id: string;
  name: string;
};

type PeriodCompletionState = "empty" | "complete" | "incomplete";

const STORAGE_KEY = "erg:lms:weekly-class-log:v3";
const morningPeriodCount = 5;
const periodFields: Array<keyof WeeklyClassLogPeriod> = [
  "className",
  "ppct",
  "absent",
  "lesson",
  "comment",
  "disciplineScore",
  "teacherSignature",
];

const svgChevronDown = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5.5 7.75 10 12.25l4.5-4.5' stroke='%23787878' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

export function WeeklyClassLogPage({ selectedClass: _selectedClass, teacherName }: WeeklyClassLogPageProps) {
  const [weeks, setWeeks] = useState<WeeklyClassLogWeek[]>(() => loadStoredWeeks());
  const [selectedWeekId, setSelectedWeekId] = useState(weeks[0]?.id ?? "");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0];
  const selectedWeekIndex = weeks.findIndex((week) => week.id === selectedWeek.id);
  const computedSummary = useMemo(() => buildWeeklySummary(selectedWeek), [selectedWeek]);
  const studentMentionOptions = useMemo(
    () => CLASS_LOG_STUDENTS,
    [],
  );
  const isLocked = selectedWeek.status === "locked";

  useEffect(() => {
    setPersistedJsonValue(STORAGE_KEY, weeks);
  }, [weeks]);

  function patchSelectedWeek(updater: (week: WeeklyClassLogWeek) => WeeklyClassLogWeek) {
    setWeeks((currentWeeks) =>
      currentWeeks.map((week) => (week.id === selectedWeek.id ? normalizeWeekSignatures(updater(week), teacherName) : week)),
    );
  }


  function updateDay(dayId: string, value: string) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({
      ...week,
      status: "draft",
      days: week.days.map((day) => (day.id === dayId ? { ...day, date: value } : day)),
    }));
  }

  function updatePeriod(dayId: string, periodId: string, field: keyof WeeklyClassLogPeriod, value: string) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({
      ...week,
      status: "draft",
      days: week.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              periods: day.periods.map((period) =>
                period.id === periodId ? { ...period, [field]: value } : period,
              ),
            }
          : day,
      ),
    }));
  }

  function goToWeek(offset: number) {
    const nextWeek = weeks[selectedWeekIndex + offset];
    if (nextWeek) setSelectedWeekId(nextWeek.id);
  }

  return (
    <section className="flex min-h-full bg-[var(--background)] text-[var(--foreground)]" data-testid="weekly-class-log-page">
      <div className="min-w-0 flex-1 px-3 py-3 md:px-5 md:py-4">
        <div className="sticky top-0 z-30 -mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-3 py-3 backdrop-blur md:-mx-5 md:px-5">
          <h1 className="font-[var(--font-heading)] text-[22px] font-semibold leading-7 tracking-[-0.01em] text-[var(--foreground)]">Sổ Đầu Bài</h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="h-10 min-w-40 appearance-none rounded-[10px] border border-[var(--border)] bg-[var(--card)] py-0 pl-3.5 pr-9 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 hover:border-[var(--muted-foreground)]/30 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
              style={{ backgroundImage: svgChevronDown, backgroundSize: "16px 16px", backgroundPosition: "right 12px center", backgroundRepeat: "no-repeat" }}
              aria-label="Chọn môn học"
            >
              {lmsSubjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={selectedWeek.id}
              onChange={(event) => setSelectedWeekId(event.target.value)}
              className="h-10 min-w-56 appearance-none rounded-[10px] border border-[var(--border)] bg-[var(--card)] py-0 pl-3.5 pr-9 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 hover:border-[var(--muted-foreground)]/30 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
              style={{ backgroundImage: svgChevronDown, backgroundSize: "16px 16px", backgroundPosition: "right 12px center", backgroundRepeat: "no-repeat" }}
              aria-label="Chọn tuần"
            >
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.label} · {compactWeekDateRange(week)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => goToWeek(1)}
              disabled={selectedWeekIndex >= weeks.length - 1}
              className="h-10 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-all duration-150 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tuần trước
            </button>
            <button
              type="button"
              onClick={() => goToWeek(-1)}
              disabled={selectedWeekIndex <= 0}
              className="h-10 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-all duration-150 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tuần sau
            </button>
          </div>
        </div>
        <div className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="grid min-w-[1380px] grid-cols-[minmax(0,1fr)_260px]">
            <table className="w-full table-fixed border-collapse text-[13px] leading-5 text-[var(--foreground)]" style={{ contentVisibility: "auto" }}>
              <colgroup>
                <col className="w-[80px]" />
                  <col className="w-[64px]" />
                  <col className="w-[44px]" />
                <col className="w-[70px]" />
                <col className="w-[52px]" />
                <col className="w-[110px]" />
                <col className="w-[300px]" />
                <col className="w-[250px]" />
                <col className="w-[78px]" />
                <col className="w-[76px]" />
              </colgroup>
              <thead>
                <tr>
                  <HeaderCell>Thứ, ngày</HeaderCell>
                  <HeaderCell>Buổi</HeaderCell>
                  <HeaderCell>Tiết</HeaderCell>
                  <HeaderCell>Lớp</HeaderCell>
                  <HeaderCell>Tiết PPCT</HeaderCell>
                  <HeaderCell>Học sinh vắng</HeaderCell>
                  <HeaderCell>Tên bài học, nội dung công việc</HeaderCell>
                  <HeaderCell>Nhận xét</HeaderCell>
                  <HeaderCell>Kỷ luật</HeaderCell>
                  <HeaderCell>GV dạy kí tên</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {selectedWeek.days.map((day) => (
                  <DayRows
                    key={day.id}
                    day={day}
                    disabled={isLocked}
                    teacherName={teacherName}
                    onUpdateDay={updateDay}
                    onUpdatePeriod={updatePeriod}
                    studentMentionOptions={studentMentionOptions}
                  />
                ))}
              </tbody>
            </table>

            <WeeklySummary summary={computedSummary} />
          </div>
        </div>
      </div>
    </section>
  );
}

const DayRows = memo(function DayRows({
  day,
  disabled,
  onUpdateDay,
  onUpdatePeriod,
  studentMentionOptions,
  teacherName,
}: {
  day: WeeklyClassLogDay;
  disabled: boolean;
  onUpdateDay: (dayId: string, value: string) => void;
  onUpdatePeriod: (dayId: string, periodId: string, field: keyof WeeklyClassLogPeriod, value: string) => void;
  studentMentionOptions: StudentMentionOption[];
  teacherName: string;
}) {
  const dayState = getGroupedPeriodState(day.periods);
  return (
    <>
      {day.periods.map((period, index) => (
        <tr key={period.id} className={cn("h-9 align-top", periodRowClass(getPeriodCompletionState(period)))}>
          {index === 0 ? (
            <td rowSpan={day.periods.length} className={cn("border border-[var(--border)] px-2 text-center align-middle", periodRowClass(dayState))}>
              <div>{day.label}</div>
              <input
                value={day.date}
                disabled={disabled}
                onChange={(event) => onUpdateDay(day.id, event.target.value)}
                className="mt-1 w-full rounded bg-[var(--surface-hover)] text-[var(--muted-foreground)] px-1 py-0.5 text-center text-[12px] font-medium text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] disabled:bg-transparent disabled:text-[var(--muted-foreground)]/50"
              />
            </td>
          ) : null}
          {index === 0 || index === morningPeriodCount ? (
            <td rowSpan={morningPeriodCount} className={cn("border border-[var(--border)] bg-[var(--muted)]/70 px-1.5 py-1 text-center align-middle font-semibold text-[var(--muted-foreground)]", periodRowClass(getGroupedPeriodState(day.periods.slice(index, index + morningPeriodCount))))}>
              {index === 0 ? "Sáng" : "Chiều"}
            </td>
          ) : null}
          <td className={cn("border border-[var(--border)] border-b border-dotted border-b-[var(--border)] px-1.5 py-1 text-center font-semibold text-[var(--muted-foreground)]", periodRowClass(getPeriodCompletionState(period)))}>{(index % morningPeriodCount) + 1}</td>
          {periodFields.map((field) => (
            <EditableCell
              key={field}
              center={isCenteredField(field)}
              disabled={disabled || field === "teacherSignature"}
              field={field}
              mentionOptions={isStudentMentionField(field) ? studentMentionOptions : undefined}
              rowState={getPeriodCompletionState(period)}
              value={field === "teacherSignature" ? getTeacherSignature(period, teacherName) : period[field]}
              onChange={(value) => onUpdatePeriod(day.id, period.id, field, value)}
            />
          ))}
        </tr>
      ))}
    </>
  );
});

const WeeklySummary = memo(function WeeklySummary({
  summary,
}: {
  summary: WeeklyClassLogSummary;
}) {
  const rows: Array<{ field: keyof WeeklyClassLogSummary; label: string }> = [
    { field: "absence", label: "Vắng" },
    { field: "late", label: "Đi học muộn" },
    { field: "otherViolation", label: "Vi phạm khác" },
    { field: "finalScore", label: "Điểm cuối tuần" },
    { field: "learning", label: "Học tập" },
    { field: "discipline", label: "Kỷ luật" },
    { field: "hygiene", label: "Vệ sinh" },
    { field: "deduction", label: "Điểm trừ" },
    { field: "average", label: "Điểm TB của tuần" },
    { field: "goodWeek", label: "Đạt tuần học tốt" },
    { field: "rank", label: "Xếp thứ" },
    { field: "unsignedSubjects", label: "Số tiết GVBM không kí" },
    { field: "subjectNotes", label: "Thuộc các lớp" },
  ];

  return (
    <aside className="border-l border-[var(--border)] text-[13px] text-[var(--foreground)]">
      <div className="border-b border-[var(--border)] bg-[var(--muted)]/70 py-3 text-center text-sm font-semibold text-[var(--foreground)]">Tổng kết tuần</div>
      <div className="min-h-[312px] border-b border-[var(--border)] px-3 py-2">
        {rows.map((row) => (
          <label key={row.field} className="flex min-h-8 items-center gap-1.5 border-b border-dotted border-[var(--border)] border-b border-dotted py-1 text-[13px]">
            <span className="shrink-0">{row.label}:</span>
            <input
              value={summary[row.field]}
              disabled
              readOnly
              className="min-w-0 flex-1 bg-transparent font-medium text-[var(--foreground)] outline-none disabled:text-[var(--muted-foreground)]"
            />
          </label>
        ))}
      </div>
      <SummaryTextArea
        label="Kiến nghị của GVBM"
        value={summary.subjectTeacherProposal}
      />
      <SummaryTextArea
        label="Ý kiến của GVCN"
        value={summary.homeroomTeacherOpinion}
      />
    </aside>
  );
});

const SummaryTextArea = memo(function SummaryTextArea({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <>
      <div className="border-b border-[var(--border)] py-2 text-center text-sm font-semibold">{label}</div>
      <textarea
        value={value}
        disabled
        readOnly
        className="h-28 w-full resize-none bg-transparent px-3 py-2 text-[13px] font-medium leading-7 text-[var(--foreground)] outline-none disabled:text-[var(--muted-foreground)]"
      />
    </>
  );
});

const HeaderCell = memo(function HeaderCell({
  children,
  colSpan,
  rowSpan,
}: {
  children: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th colSpan={colSpan} rowSpan={rowSpan} className="border border-[var(--border)] bg-[var(--muted)]/70 px-2 py-2.5 text-center text-[12px] font-semibold leading-4 text-[var(--muted-foreground)]">
      {children}
    </th>
  );
});

// ---------------------------------------------------------------------------
// EditableCell – lightweight native <input> + <select>.
// Replaced textarea (350 nodes) + JS resize + Radix AppSelect with minimal DOM.
// Mention overlay only activates on focused cells that support @mentions.
// ---------------------------------------------------------------------------
const EditableCell = memo(function EditableCell({
  center,
  disabled,
  field,
  mentionOptions,
  onChange,
  rowState,
  value,
}: {
  center?: boolean;
  disabled: boolean;
  field: keyof WeeklyClassLogPeriod;
  mentionOptions?: StudentMentionOption[];
  onChange: (value: string) => void;
  rowState: PeriodCompletionState;
  value: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  // Lazy mention filter — only computed when mention menu is open
  const filteredMentionOptions = useMemo(() => {
    if (!mentionOptions?.length || mentionStart === null) return [];
    const normalizedQuery = normalizeSearchText(mentionQuery);
    return mentionOptions
      .filter((student) => mentionMatchesQuery(student.name, normalizedQuery))
      .slice(0, 6);
  }, [mentionOptions, mentionQuery, mentionStart]);

  // disciplineScore → native <select> (was Radix AppSelect)
  if (field === "disciplineScore") {
    return (
      <td className={cn("border border-[var(--border)] border-b border-dotted border-b-[var(--border)] p-0 focus-within:bg-[var(--accent-soft)]", periodRowClass(rowState))}>
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full bg-transparent px-1 text-center text-[13px] font-semibold text-[var(--foreground)] outline-none disabled:bg-transparent disabled:text-[var(--muted-foreground)]/50"
        >
          <option value=""></option>
          <option value="Đạt">Đạt</option>
          <option value="Chưa đạt">Chưa đạt</option>
        </select>
      </td>
    );
  }

  // use native <input> instead of <textarea> — CSS field-sizing: content handles auto-height
  // No JS resize. No useEffect per cell.
  const handleInputChange = useCallback((nextValue: string, caretPosition: number | null) => {
    onChange(nextValue);
    if (!mentionOptions?.length || caretPosition === null) {
      setMentionStart(null);
      setMentionQuery("");
      return;
    }
    const mentionMatch = getActiveMentionQuery(nextValue, caretPosition);
    if (!mentionMatch) {
      setMentionStart(null);
      setMentionQuery("");
      return;
    }
    setMentionStart(mentionMatch.start);
    setMentionQuery(mentionMatch.query);
  }, [onChange, mentionOptions]);

  const insertMention = useCallback((studentName: string) => {
    if (mentionStart === null) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    const nextValue = `${before}${studentName} ${after}`;
    onChange(nextValue);
    setMentionStart(null);
    setMentionQuery("");
  }, [value, mentionStart, mentionQuery, onChange]);

  return (
    <td className={cn("relative overflow-visible border border-[var(--border)] border-b border-dotted border-b-[var(--border)] p-0", periodRowClass(rowState))}>
      {/* Mention overlay: renders highlighted names behind the transparent input when blurred */}
      {mentionOptions?.length && !isFocused && value ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 whitespace-pre-wrap break-words px-2 py-1.5 text-[13px] font-medium leading-5 text-[var(--foreground)]",
            center && "text-center",
          )}
        >
          {renderMentionText(value, mentionOptions)}
        </div>
      ) : null}
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => handleInputChange(event.target.value, event.target.selectionStart)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setMentionStart(null);
            setMentionQuery("");
            setIsFocused(false);
          }, 120);
        }}
        className={cn(
          "block h-9 w-full min-w-0 bg-transparent px-2 py-1.5 text-[13px] font-medium leading-5 outline-none disabled:bg-transparent disabled:text-[var(--muted-foreground)]/50",
          mentionOptions?.length && !isFocused ? "text-transparent caret-[var(--foreground)]" : "text-[var(--foreground)]",
          center && "text-center",
        )}
      />
      {/* Mention dropdown */}
      {filteredMentionOptions.length ? (
        <div className="absolute left-1 top-[calc(100%-1px)] z-50 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 text-left shadow-[var(--shadow-sm)]">
          {filteredMentionOptions.map((student) => (
            <button
              key={student.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                insertMention(student.name);
              }}
              className="block w-full truncate px-3 py-2 text-left text-[13px] font-semibold text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
            >
              @{student.name}
            </button>
          ))}
        </div>
      ) : null}
    </td>
  );
});

function loadStoredWeeks() {
  const storedWeeks = getPersistedJsonValue<WeeklyClassLogWeek[]>(STORAGE_KEY, weeklyClassLogWeeks);
  return Array.isArray(storedWeeks) && storedWeeks.length ? migrateWeeks(storedWeeks) : migrateWeeks(weeklyClassLogWeeks);
}

function migrateWeeks(weeks: WeeklyClassLogWeek[]) {
  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      periods: day.periods.map((period) => ({
        ...period,
        className: period.className || period.subject || "",
        subject: "",
        learningScore: "",
        hygieneScore: "",
        totalScore: "",
        disciplineScore: normalizeDisciplineValue(period.disciplineScore),
        teacherSignature: "",
      })),
    })),
  }));
}

function normalizeWeekSignatures(week: WeeklyClassLogWeek, teacherName: string) {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      periods: day.periods.map((period) => ({
        ...period,
        teacherSignature: getTeacherSignature(period, teacherName),
      })),
    })),
  };
}

function normalizeDisciplineValue(value: string) {
  if (value === "Đạt") return "Đạt";
  if (value === "Chưa đạt") return "Chưa đạt";
  return value ? "Đạt" : "";
}

function getTeacherSignature(period: WeeklyClassLogPeriod, teacherName: string) {
  if (!isPeriodComplete(period)) return "";
  return teacherName;
}

function isPeriodComplete(period: WeeklyClassLogPeriod) {
  return Boolean(
    period.className.trim() &&
      period.ppct.trim() &&
      period.lesson.trim() &&
      period.comment.trim() &&
      period.disciplineScore.trim(),
  );
}

function getPeriodCompletionState(period: WeeklyClassLogPeriod): PeriodCompletionState {
  const requiredValues = [period.className, period.ppct, period.lesson, period.comment, period.disciplineScore];
  const hasAnyValue = [...requiredValues, period.absent].some((value) => value.trim());
  if (!hasAnyValue) return "empty";
  return requiredValues.every((value) => value.trim()) ? "complete" : "incomplete";
}

function getGroupedPeriodState(periods: WeeklyClassLogPeriod[]): PeriodCompletionState {
  const states = periods.map(getPeriodCompletionState);
  if (states.some((state) => state === "incomplete")) return "empty";
  if (states.some((state) => state === "complete")) return "complete";
  return "empty";
}

function periodRowClass(state: PeriodCompletionState) {
  if (state === "complete") return "bg-emerald-50/70";
  if (state === "incomplete") return "bg-rose-50/60";
  return "bg-[var(--card)]";
}

function buildWeeklySummary(week: WeeklyClassLogWeek): WeeklyClassLogSummary {
  const periods = week.days.flatMap((day) => day.periods);
  const filledPeriods = periods.filter((period) => period.className || period.ppct || period.lesson || period.comment || period.absent);
  const signedPeriods = filledPeriods.filter((period) => period.teacherSignature);
  const absentNotes = periods.map((period) => period.absent.trim()).filter(Boolean);
  const notAchievedCount = periods.filter((period) => period.disciplineScore === "Chưa đạt").length;
  const achievedCount = periods.filter((period) => period.disciplineScore === "Đạt").length;

  return {
    ...week.summary,
    absence: absentNotes.length ? absentNotes.join("; ") : "Không ghi nhận",
    late: "Không ghi nhận",
    otherViolation: notAchievedCount ? `${notAchievedCount} tiết chưa đạt kỷ luật` : "Không ghi nhận",
    finalScore: "",
    learning: "",
    discipline: filledPeriods.length ? `${achievedCount}/${filledPeriods.length} tiết đạt` : "",
    hygiene: "",
    deduction: notAchievedCount ? String(notAchievedCount) : "0",
    average: "",
    goodWeek: filledPeriods.length && notAchievedCount === 0 ? "Đạt" : "Chưa đủ dữ liệu",
    rank: "",
    unsignedSubjects: String(Math.max(0, filledPeriods.length - signedPeriods.length)),
    subjectNotes: selectedClassesFromPeriods(periods),
    subjectTeacherProposal: week.summary.subjectTeacherProposal || "",
    homeroomTeacherOpinion: week.summary.homeroomTeacherOpinion || "",
  };
}

function selectedClassesFromPeriods(periods: WeeklyClassLogPeriod[]) {
  const classes = Array.from(new Set(periods.map((period) => period.className.trim()).filter(Boolean)));
  return classes.join(", ");
}

function isCenteredField(field: keyof WeeklyClassLogPeriod) {
  return field === "ppct" || field === "disciplineScore" || field === "teacherSignature" || field === "className";
}

function isStudentMentionField(field: keyof WeeklyClassLogPeriod) {
  return field === "absent" || field === "comment";
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mentionMatchesQuery(studentName: string, normalizedQuery: string) {
  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!queryParts.length) return true;

  const normalizedName = normalizeSearchText(studentName);
  return queryParts.every((part) => normalizedName.includes(part));
}

function getActiveMentionQuery(value: string, caretPosition: number) {
  const beforeCaret = value.slice(0, caretPosition);
  const atIndex = beforeCaret.lastIndexOf("@");
  if (atIndex < 0) return null;

  const characterBeforeAt = beforeCaret[atIndex - 1];
  if (characterBeforeAt && !/\s/.test(characterBeforeAt)) return null;

  const query = beforeCaret.slice(atIndex + 1);
  if (/[\n\r,;]$/.test(query) || query.length > 60) return null;

  return { query, start: atIndex };
}

function renderMentionText(value: string, mentionOptions: StudentMentionOption[]) {
  if (!value) return null;

  const names = mentionOptions.map((option) => option.name).sort((a, b) => b.length - a.length);
  const parts: Array<string | { mention: string }> = [];
  let index = 0;

  while (index < value.length) {
    const mentionName = names.find((name) => value.slice(index, index + name.length) === name);

    if (mentionName) {
      parts.push({ mention: mentionName });
      index += mentionName.length;
      continue;
    }

    parts.push(value[index]);
    index += 1;
  }

  return parts.map((part, partIndex) =>
    typeof part === "string" ? (
      <span key={partIndex}>{part}</span>
    ) : (
      <span key={partIndex} className="font-medium text-[var(--primary)]">
        {part.mention}
      </span>
    ),
  );
}

function compactWeekDateRange(week: WeeklyClassLogWeek) {
  return `${week.fromDate.slice(0, 5)} - ${week.toDate.slice(0, 5)}`;
}

