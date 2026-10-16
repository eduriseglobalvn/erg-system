import { useMemo, useState } from "react";

import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import type { WeeklyClassLogPeriod, WeeklyClassLogWeek } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import {
  buildWeeklySummary,
  loadStoredWeeks,
  normalizeWeekSignatures,
} from "./weekly-class-log-model";

export type WeeklyClassLogControllerOptions = {
  selectedClassId?: string | null;
  selectedSchoolId?: string | null;
};

export function useWeeklyClassLogController(teacherName: string, options: WeeklyClassLogControllerOptions = {}) {
  const [weeks, setWeeks] = useState<WeeklyClassLogWeek[]>(loadStoredWeeks);
  const [selectedWeekId, setSelectedWeekId] = useState(weeks[0]?.id ?? "");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0];
  const selectedWeekIndex = weeks.findIndex((week) => week.id === selectedWeek.id);
  const computedSummary = useMemo(() => buildWeeklySummary(selectedWeek), [selectedWeek]);
  const isLocked = selectedWeek.status === "locked";

  function patchSelectedWeek(updater: (week: WeeklyClassLogWeek) => WeeklyClassLogWeek) {
    setWeeks((currentWeeks) => currentWeeks.map((week) => (
      week.id === selectedWeek.id ? normalizeWeekSignatures(updater(week), teacherName) : week
    )));
  }

  function updateDay(dayId: string, value: string) {
    if (isLocked) return;
    patchSelectedWeek((week) => ({
      ...week,
      status: "draft",
      days: week.days.map((day) => day.id === dayId ? { ...day, date: value } : day),
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

  function goToWeek(offset: number) {
    const nextWeek = weeks[selectedWeekIndex + offset];
    if (nextWeek) setSelectedWeekId(nextWeek.id);
  }

  return {
    computedSummary,
    goToWeek,
    isLocked,
    // No BE weekly-log read/write contract exists yet. Keep edits in memory
    // only and make the absence visible instead of inventing local truth.
    offlineStatus: "session-only" as const,
    selectedSubject,
    selectedClassId: options.selectedClassId ?? null,
    selectedSchoolId: options.selectedSchoolId ?? null,
    selectedWeek,
    selectedWeekId,
    selectedWeekIndex,
    setSelectedSubject,
    setSelectedWeekId,
    subjectOptions: lmsSubjectOptions,
    teacherName,
    updateDay,
    updatePeriod,
    weeks,
  };
}

export type WeeklyClassLogController = ReturnType<typeof useWeeklyClassLogController>;
