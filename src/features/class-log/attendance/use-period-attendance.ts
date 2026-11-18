import { useCallback, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { toast } from "sonner";

import { todayInput } from "@/domain/formatters/format-date";
import { resolveAcademicRecordIdentity } from "@/features/lms/api/lms-academic-record-query";

import { attendanceErrorCode, attendanceErrorMessage } from "./attendance-copy";
import { clearDraft, readDraft, writeDraft } from "./attendance-draft";
import { attendanceRows, exportAttendance } from "./attendance-export";
import {
  buildSaveInput,
  countMarks,
  groupPeriods,
  initialMarks,
  markFromKey,
  periodKey,
  type AttendanceMark,
  type LessonLogPeriod,
  type MarkMap,
} from "./attendance-model";
import { useCurriculumRows, useDayPeriodsQuery, useRosterQuery, useSaveAttendanceAndLog } from "./attendance-query";

type LogDraft = { actualPeriod?: number; comment?: string };

const isIsoDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

/** `?date=yyyy-MM-dd&scheduleId=` from the calendar's "Mở lớp học" link; a bad date falls back to today. */
export function readAttendanceDeepLink(searchStr: string) {
  const params = new URLSearchParams(searchStr);
  const date = params.get("date");
  return { date: isIsoDate(date) ? date : null, scheduleId: params.get("scheduleId") ?? "" };
}

export function usePeriodAttendance() {
  const { accountId } = resolveAcademicRecordIdentity();
  const link = readAttendanceDeepLink(useLocation().searchStr);
  const [date, setDate] = useState(() => link.date ?? todayInput());
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [periodNo, setPeriodNo] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<string, MarkMap>>({});
  const [logs, setLogs] = useState<Record<string, LogDraft>>({});
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<{ id: string; key: string } | null>(null);

  const dayQuery = useDayPeriodsQuery(date);
  const groups = useMemo(() => groupPeriods(dayQuery.data ?? []), [dayQuery.data]);
  const group = groups.find((item) => item.key === groupKey) ?? groups.find((item) => link.scheduleId && item.eventId === link.scheduleId) ?? groups[0] ?? null;
  const period: LessonLogPeriod | null = group?.periods.find((item) => item.periodNo === periodNo) ?? group?.periods[0] ?? null;
  const key = period ? periodKey(period) : "";

  // Tied to the period key so switching period clears the highlighted row without an effect.
  const activeStudentId = active?.key === key ? active.id : null;
  const setActiveStudentId = useCallback((id: string | null) => setActive(id ? { id, key } : null), [key]);

  const rosterQuery = useRosterQuery(period?.classId);
  const students = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);
  const curriculum = useCurriculumRows(period?.classId, period?.subjectName, period?.subjectId);
  const { mutation, pendingCount } = useSaveAttendanceAndLog(date);

  // Draft of this period left on the device (offline, or the tab was closed before saving).
  const stored = useMemo(() => (key ? readDraft(accountId, key) : null), [accountId, key]);
  const marks = useMemo<MarkMap>(
    () => edits[key] ?? stored?.marks ?? (period ? initialMarks(students, period.absentees) : {}),
    [edits, key, period, stored, students],
  );
  const draft = useMemo<LogDraft>(
    () => logs[key] ?? { actualPeriod: stored?.actualPeriod, comment: stored?.comment },
    [key, logs, stored],
  );
  const actualPeriod = draft.actualPeriod ?? period?.actualPeriod ?? 1;
  const comment = draft.comment ?? period?.comment ?? "";
  const lessonTitle = curriculum.data?.find((row) => row.period === actualPeriod)?.title ?? (actualPeriod === period?.actualPeriod ? period?.lessonTitle : null) ?? null;
  const draftAt = savedAt[key] ?? stored?.at ?? null;
  const dirty = key in savedAt || (stored !== null && !(key in edits));

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return query ? students.filter((student) => student.name.toLocaleLowerCase("vi").includes(query)) : students;
  }, [search, students]);
  const counts = useMemo(() => countMarks(students, marks), [marks, students]);

  const persist = (next: { log?: LogDraft; marks?: MarkMap }) => {
    const at = Date.now();
    writeDraft(accountId, key, { at, ...(next.log ?? draft), marks: next.marks ?? marks });
    setSavedAt((current) => ({ ...current, [key]: at }));
  };

  const setMark = useCallback((studentId: string, mark: AttendanceMark) => {
    const next = { ...marks, [studentId]: mark };
    setEdits((current) => ({ ...current, [key]: next }));
    const at = Date.now();
    writeDraft(accountId, key, { at, ...draft, marks: next });
    setSavedAt((current) => ({ ...current, [key]: at }));
  }, [accountId, draft, key, marks]);

  /** Keys 1-4 mark the active student then move to the next row. */
  const onKeyDown = useCallback((event: { key: string; preventDefault: () => void; target: EventTarget }) => {
    if ((event.target as HTMLElement).tagName === "INPUT" || (event.target as HTMLElement).tagName === "TEXTAREA") return;
    const index = visibleStudents.findIndex((student) => student.id === activeStudentId);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), visibleStudents.length - 1);
      setActiveStudentId(visibleStudents[next]?.id ?? null);
      return;
    }
    const mark = markFromKey(event.key);
    if (!mark || index < 0) return;
    event.preventDefault();
    setMark(visibleStudents[index].id, mark);
    setActiveStudentId(visibleStudents[Math.min(index + 1, visibleStudents.length - 1)].id);
  }, [activeStudentId, setActiveStudentId, setMark, visibleStudents]);

  /** "Áp dụng cho tiết 2": copy these marks onto the next period of the same block. */
  const nextPeriod = group?.periods.find((item) => period && item.periodNo === period.periodNo + 1) ?? null;
  const applyToNext = () => {
    if (!nextPeriod) return;
    const nextKey = periodKey(nextPeriod);
    setEdits((current) => ({ ...current, [nextKey]: { ...marks } }));
    writeDraft(accountId, nextKey, { at: Date.now(), marks: { ...marks } });
    setPeriodNo(nextPeriod.periodNo);
  };

  const patchLog = (patch: LogDraft) => {
    const next = { ...draft, ...patch };
    setLogs((current) => ({ ...current, [key]: next }));
    persist({ log: next });
  };

  const save = async (): Promise<boolean> => {
    if (!period || rosterQuery.isPending) return false;
    try {
      const result = await mutation.mutateAsync(buildSaveInput(period, students, marks, { actualPeriod, comment }));
      // Edits stay on screen: the server keeps only absences, so a refetch would forget "Muộn".
      clearDraft(accountId, key);
      setEdits((current) => ({ ...current, [key]: marks }));
      setLogs((current) => ({ ...current, [key]: { actualPeriod, comment } }));
      setSavedAt((current) => omit(current, key));
      toast.success(result.status === "pending" ? "Đã lưu trên máy, sẽ đồng bộ khi có mạng." : "Đã lưu điểm danh và ghi sổ đầu bài.");
      return true;
    } catch (error) {
      toast.error(attendanceErrorMessage(error));
      if (attendanceErrorCode(error) === "STALE_VERSION") {
        clearDraft(accountId, key);
        setEdits((current) => omit(current, key));
        setLogs((current) => omit(current, key));
      }
      return false;
    }
  };

  const exportExcel = () => {
    if (!period) return;
    void exportAttendance(attendanceRows(students, marks), `diem-danh-${period.className}-${period.date}-tiet-${period.periodNo}.xlsx`);
  };

  return {
    actualPeriod,
    activeStudentId,
    applyToNext,
    comment,
    counts,
    curriculumRows: curriculum.data ?? [],
    date,
    dayQuery,
    dirty,
    draftAt,
    exportExcel,
    group,
    groups,
    lessonTitle,
    marks,
    nextPeriod,
    onKeyDown,
    pendingCount,
    period,
    rosterQuery,
    save,
    saving: mutation.isPending,
    search,
    selectGroup: (next: string) => { setGroupKey(next); setPeriodNo(null); },
    selectPeriod: setPeriodNo,
    setActiveStudentId,
    setActualPeriod: (value: number) => patchLog({ actualPeriod: value }),
    setComment: (value: string) => patchLog({ comment: value }),
    setDate: (value: string) => { setDate(value); setGroupKey(null); setPeriodNo(null); },
    setMark,
    setSearch,
    students,
    visibleStudents,
  };
}

export type PeriodAttendanceController = ReturnType<typeof usePeriodAttendance>;

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}
