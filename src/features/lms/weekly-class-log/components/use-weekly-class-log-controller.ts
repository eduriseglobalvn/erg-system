import { useMemo, useState } from "react";

import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import type { WeeklyClassLogPeriod, WeeklyClassLogWeek } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import {
  WEEKLY_CLASS_LOG_SERVER_CONTRACT,
  addWeeks,
  buildBlankWeek,
  buildWeeklySummary,
  currentWeekStart,
  normalizeWeekSignatures,
} from "./weekly-class-log-model";

export type WeeklyClassLogControllerOptions = {
  selectedClassId?: string | null;
  selectedSchoolId?: string | null;
};

const WEEK_OPTIONS_BEFORE = 8;
const WEEK_OPTIONS_AFTER = 4;

export function useWeeklyClassLogController(teacherName: string, options: WeeklyClassLogControllerOptions = {}) {
  const [currentMonday] = useState(() => currentWeekStart());
  const [weekStart, setWeekStart] = useState(currentMonday);
  const [edits, setEdits] = useState<Record<string, WeeklyClassLogWeek>>({});
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const blankWeek = useMemo(() => buildBlankWeek(weekStart), [weekStart]);
  const selectedWeek = edits[blankWeek.id] ?? blankWeek;
  const computedSummary = useMemo(() => buildWeeklySummary(selectedWeek), [selectedWeek]);
  const isLocked = selectedWeek.status === "locked";
  const weekOptions = useMemo(
    () => Array.from({ length: WEEK_OPTIONS_BEFORE + WEEK_OPTIONS_AFTER + 1 }, (_, index) => {
      const start = addWeeks(weekStart, index - WEEK_OPTIONS_BEFORE);
      return { start, week: buildBlankWeek(start) };
    }),
    [weekStart],
  );

  function patchSelectedWeek(updater: (week: WeeklyClassLogWeek) => WeeklyClassLogWeek) {
    setEdits((current) => ({
      ...current,
      [selectedWeek.id]: normalizeWeekSignatures(updater(current[selectedWeek.id] ?? blankWeek), teacherName),
    }));
  }

  function updatePeriod(dayId: string, periodId: string, field: keyof WeeklyClassLogPeriod, value: string) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({
      ...week,
      status: "draft",
      days: week.days.map((day) => day.id === dayId
        ? { ...day, periods: day.periods.map((period) => period.id === periodId ? { ...period, [field]: value } : period) }
        : day),
    }));
  }

  return {
    computedSummary,
    goToCurrentWeek: () => setWeekStart(currentMonday),
    goToWeek: (offset: number) => setWeekStart((current) => addWeeks(current, offset)),
    isCurrentWeek: weekStart.getTime() === currentMonday.getTime(),
    isLocked,
    // No BE weekly-log read/write contract exists yet: edits stay in memory only
    // and the page shows an empty state until WEEKLY_CLASS_LOG_SERVER_CONTRACT flips.
    offlineStatus: "session-only" as const,
    selectedSubject,
    selectedClassId: options.selectedClassId ?? null,
    selectedSchoolId: options.selectedSchoolId ?? null,
    selectedWeek,
    serverContract: WEEKLY_CLASS_LOG_SERVER_CONTRACT,
    setSelectedSubject,
    setSelectedWeekId: (id: string) => {
      const match = weekOptions.find((option) => option.week.id === id);
      if (match) setWeekStart(match.start);
    },
    subjectOptions: lmsSubjectOptions,
    teacherName,
    updatePeriod,
    weekOptions,
  };
}

export type WeeklyClassLogController = ReturnType<typeof useWeeklyClassLogController>;
