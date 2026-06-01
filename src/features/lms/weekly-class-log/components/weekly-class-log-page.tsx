import { useEffect, useMemo, useRef, useState } from "react";

import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { weeklyClassLogWeeks } from "@/features/lms/weekly-class-log/api/mock-weekly-class-log-data";
import type {
  WeeklyClassLogDay,
  WeeklyClassLogPeriod,
  WeeklyClassLogSummary,
  WeeklyClassLogWeek,
} from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import { cn } from "@/lib/utils";

type WeeklyClassLogPageProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
};

type StudentMentionOption = {
  id: string;
  name: string;
};

const STORAGE_KEY = "erg:lms:weekly-class-log:v1";
const periodFields: Array<keyof WeeklyClassLogPeriod> = [
  "className",
  "ppct",
  "absent",
  "lesson",
  "comment",
  "disciplineScore",
  "teacherSignature",
];

export function WeeklyClassLogPage({ selectedClass, selectedSchoolName, teacherName }: WeeklyClassLogPageProps) {
  const [weeks, setWeeks] = useState<WeeklyClassLogWeek[]>(() => loadStoredWeeks());
  const [selectedWeekId, setSelectedWeekId] = useState(weeks[0]?.id ?? "");
  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0];
  const selectedWeekIndex = weeks.findIndex((week) => week.id === selectedWeek.id);
  const computedSummary = useMemo(() => buildWeeklySummary(selectedWeek), [selectedWeek]);
  const selectedClassId = selectedClass?.id;
  const studentMentionOptions = useMemo(
    () =>
      classroomStudents
        .filter((student) => !selectedClassId || student.classId === selectedClassId)
        .map((student) => ({ id: student.id, name: student.name })),
    [selectedClassId],
  );
  const isLocked = selectedWeek.status === "locked";

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));
  }, [weeks]);

  function patchSelectedWeek(updater: (week: WeeklyClassLogWeek) => WeeklyClassLogWeek) {
    setWeeks((currentWeeks) =>
      currentWeeks.map((week) => (week.id === selectedWeek.id ? normalizeWeekSignatures(updater(week), teacherName) : week)),
    );
  }

  function updateWeek(patch: Partial<WeeklyClassLogWeek>) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({ ...week, ...patch, status: "draft" }));
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
    <section className="flex min-h-full bg-white text-slate-950" data-testid="weekly-class-log-page">
      <div className="min-w-0 flex-1 px-3 py-3 md:px-5 md:py-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Sổ đầu bài theo tuần</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {selectedSchoolName} · {selectedClass?.className ?? "Lớp học"} · GVCN: {teacherName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToWeek(1)}
              disabled={selectedWeekIndex >= weeks.length - 1}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tuần trước
            </button>
            <button
              type="button"
              onClick={() => goToWeek(-1)}
              disabled={selectedWeekIndex <= 0}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tuần sau
            </button>
          </div>

          <div className="flex min-w-full gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
            {weeks.map((week) => (
              <button
                key={week.id}
                type="button"
                onClick={() => setSelectedWeekId(week.id)}
                className={cn(
                  "h-9 shrink-0 rounded-lg px-3 text-xs font-black transition",
                  week.id === selectedWeek.id
                    ? "bg-white text-[#1967d2] shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-white/80",
                )}
              >
                {week.label} <span className="font-semibold text-slate-400">{compactWeekDateRange(week)}</span>
              </button>
            ))}
          </div>

          <div className="grid min-w-full grid-cols-1 gap-3 text-sm font-semibold sm:min-w-[520px] sm:grid-cols-3 sm:gap-6 sm:text-center">
            <EditableHeaderField disabled={isLocked} label="Tuần" value={selectedWeek.label} onChange={(value) => updateWeek({ label: value })} />
            <EditableHeaderField disabled={isLocked} label="Từ ngày" value={selectedWeek.fromDate} onChange={(value) => updateWeek({ fromDate: value })} />
            <EditableHeaderField disabled={isLocked} label="Đến ngày" value={selectedWeek.toDate} onChange={(value) => updateWeek({ toDate: value })} />
          </div>
        </div>

        <div className="overflow-auto border border-black bg-white">
          <div className="grid min-w-[1320px] grid-cols-[minmax(0,1fr)_260px]">
            <table className="w-full table-fixed border-collapse text-[12px] leading-tight">
              <colgroup>
                <col className="w-[80px]" />
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
                  <HeaderCell>Tiết</HeaderCell>
                  <HeaderCell>Lớp</HeaderCell>
                  <HeaderCell>Tiết PPCT</HeaderCell>
                  <HeaderCell>Học sinh vắng</HeaderCell>
                  <HeaderCell>Tên bài học, nội dung công việc</HeaderCell>
                  <HeaderCell>Nhận xét</HeaderCell>
                  <HeaderCell>Kỷ luật</HeaderCell>
                  <HeaderCell>GV dạy kí tên</HeaderCell>
                </tr>
                <tr className="h-7 italic">
                  {Array.from({ length: 9 }, (_, index) => (
                    <td key={index} className="border border-black text-center">
                      {index + 1}
                    </td>
                  ))}
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

function DayRows({
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
  return (
    <>
      {day.periods.map((period, index) => (
        <tr key={period.id} className="h-8 align-top">
          {index === 0 ? (
            <td rowSpan={day.periods.length} className="border border-black px-2 text-center align-middle">
              <div>{day.label}</div>
              <input
                value={day.date}
                disabled={disabled}
                onChange={(event) => onUpdateDay(day.id, event.target.value)}
                className="mt-1 w-full bg-transparent text-center text-[11px] outline-none disabled:text-slate-500"
              />
            </td>
          ) : null}
          <td className="border border-black border-b-dotted px-1.5 py-1 text-center">{index + 1}</td>
          {periodFields.map((field) => (
            <EditableCell
              key={field}
              center={isCenteredField(field)}
              disabled={disabled || field === "teacherSignature"}
              field={field}
              mentionOptions={isStudentMentionField(field) ? studentMentionOptions : undefined}
              value={field === "teacherSignature" ? getTeacherSignature(period, teacherName) : period[field]}
              onChange={(value) => onUpdatePeriod(day.id, period.id, field, value)}
            />
          ))}
        </tr>
      ))}
    </>
  );
}

function WeeklySummary({
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
    <aside className="border-l border-black text-[12px]">
      <div className="border-b border-black py-3 text-center text-sm font-black uppercase">Tổng kết tuần</div>
      <div className="min-h-[312px] border-b border-black px-3 py-2">
        {rows.map((row) => (
          <label key={row.field} className="flex min-h-7 items-center gap-1 border-b border-dotted border-slate-500 py-1">
            <span className="shrink-0">{row.label}:</span>
            <input
              value={summary[row.field]}
              disabled
              readOnly
              className="min-w-0 flex-1 bg-transparent outline-none disabled:text-slate-700"
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
}

function SummaryTextArea({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <>
      <div className="border-b border-black py-2 text-center text-sm font-black">{label}</div>
      <textarea
        value={value}
        disabled
        readOnly
        className="h-28 w-full resize-none bg-transparent px-3 py-2 leading-7 outline-none disabled:text-slate-700 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_27px,#64748b_28px)]"
      />
    </>
  );
}

function HeaderCell({
  children,
  colSpan,
  rowSpan,
}: {
  children: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th colSpan={colSpan} rowSpan={rowSpan} className="border border-black px-2 py-2 text-center font-semibold">
      {children}
    </th>
  );
}

function EditableCell({
  center,
  disabled,
  field,
  mentionOptions,
  onChange,
  value,
}: {
  center?: boolean;
  disabled: boolean;
  field: keyof WeeklyClassLogPeriod;
  mentionOptions?: StudentMentionOption[];
  onChange: (value: string) => void;
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const filteredMentionOptions = useMemo(() => {
    if (!mentionOptions?.length || mentionStart === null) return [];
    const normalizedQuery = normalizeSearchText(mentionQuery);
    return mentionOptions
      .filter((student) => mentionMatchesQuery(student.name, normalizedQuery))
      .slice(0, 6);
  }, [mentionOptions, mentionQuery, mentionStart]);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value]);

  function handleChange(nextValue: string, caretPosition: number | null) {
    onChange(nextValue);
    updateMentionState(nextValue, caretPosition);
  }

  function updateMentionState(nextValue: string, caretPosition: number | null) {
    if (!mentionOptions?.length || caretPosition === null) {
      closeMentionMenu();
      return;
    }

    const mentionMatch = getActiveMentionQuery(nextValue, caretPosition);
    if (!mentionMatch) {
      closeMentionMenu();
      return;
    }

    setMentionStart(mentionMatch.start);
    setMentionQuery(mentionMatch.query);
  }

  function closeMentionMenu() {
    setMentionStart(null);
    setMentionQuery("");
  }

  function insertMention(studentName: string) {
    const textarea = textareaRef.current;
    if (!textarea || mentionStart === null) return;

    const caretPosition = textarea.selectionStart ?? value.length;
    const nextValue = `${value.slice(0, mentionStart)}${studentName} ${value.slice(caretPosition)}`;
    onChange(nextValue);
    closeMentionMenu();

    window.requestAnimationFrame(() => {
      const nextCaret = mentionStart + studentName.length + 1;
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
      resizeTextarea(textarea);
    });
  }

  if (field === "disciplineScore") {
    return (
      <td className="border border-black border-b-dotted p-0 focus-within:bg-blue-50">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full bg-transparent px-1 text-center text-[12px] font-semibold outline-none disabled:text-slate-500"
        >
          <option value=""></option>
          <option value="Đạt">Đạt</option>
          <option value="Chưa đạt">Chưa đạt</option>
        </select>
      </td>
    );
  }

  return (
    <td className="relative overflow-visible border border-black border-b-dotted p-0 focus-within:bg-blue-50">
      {mentionOptions?.length && !isFocused ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 whitespace-pre-wrap break-words px-1.5 py-1 text-[12px] leading-5 text-slate-950",
            center && "text-center",
          )}
        >
          {renderMentionText(value, mentionOptions)}
        </div>
      ) : null}
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onBlur={() => {
          window.setTimeout(() => {
            closeMentionMenu();
            setIsFocused(false);
          }, 120);
        }}
        onChange={(event) => handleChange(event.target.value, event.target.selectionStart)}
        onClick={(event) => updateMentionState(event.currentTarget.value, event.currentTarget.selectionStart)}
        onFocus={() => setIsFocused(true)}
        onKeyUp={(event) => updateMentionState(event.currentTarget.value, event.currentTarget.selectionStart)}
        className={cn(
          "relative block h-auto min-h-8 w-full resize-none overflow-hidden bg-transparent px-1.5 py-1 leading-5 outline-none disabled:text-slate-500",
          mentionOptions?.length && !isFocused ? "text-transparent caret-slate-950" : "text-slate-950",
          !mentionOptions?.length && "focus:bg-blue-50",
          center && "text-center",
        )}
      />
      {filteredMentionOptions.length ? (
        <div className="absolute left-1 top-[calc(100%-1px)] z-50 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl">
          {filteredMentionOptions.map((student) => (
            <button
              key={student.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                insertMention(student.name);
              }}
              className="block w-full truncate px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1967d2]"
            >
              @{student.name}
            </button>
          ))}
        </div>
      ) : null}
    </td>
  );
}

function EditableHeaderField({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex items-end gap-2">
      <span>{label}:</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 border-0 border-b border-dotted border-slate-700 bg-transparent text-center outline-none focus:border-blue-500 disabled:text-slate-500"
      />
    </label>
  );
}

function loadStoredWeeks() {
  if (typeof window === "undefined") return migrateWeeks(weeklyClassLogWeeks);

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return migrateWeeks(weeklyClassLogWeeks);
    const parsed = JSON.parse(storedValue) as WeeklyClassLogWeek[];
    return Array.isArray(parsed) && parsed.length ? migrateWeeks(parsed) : migrateWeeks(weeklyClassLogWeeks);
  } catch {
    return migrateWeeks(weeklyClassLogWeeks);
  }
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
  if (value === "Đạt" || value === "Chưa đạt") return value;
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
      <span key={partIndex} className="font-bold text-sky-600">
        {part.mention}
      </span>
    ),
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(32, textarea.scrollHeight)}px`;
}

function compactWeekDateRange(week: WeeklyClassLogWeek) {
  return `${week.fromDate.slice(0, 5)} - ${week.toDate.slice(0, 5)}`;
}
