import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

import { todayInput } from "@/domain/formatters/format-date";
import { useTeachingDayLoads } from "@/features/teaching-calendar/api/teaching-calendar-day-loads-api";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { useHolidays, useSaturdayModes } from "../../api/timekeeping-config-query";
import type { HolidayConfig } from "../../api/timekeeping-types";
import { isMonth, monthGrid, monthOf, shiftMonth } from "./days-off-model";

const PATH = "/calendar/days-off";

/** Everything the days-off screen needs for one month: `?month=yyyy-MM`, holidays, Saturday modes, periods per day, and which dialog is open. */
export function useDaysOff() {
  const raw = useSearch({ strict: false }) as { month?: unknown };
  const navigate = useNavigate();
  const today = todayInput();
  const month = isMonth(raw.month) ? raw.month : monthOf(today);
  const grid = monthGrid(month);
  const [first, last] = [grid[0], grid[grid.length - 1]];
  const years = [...new Set([Number(first.slice(0, 4)), Number(month.slice(0, 4)), Number(last.slice(0, 4))])];

  // The 6 weeks of a month cross at most two calendar years, so these two reads cover every cell.
  const yearA = useHolidays(years[0]);
  const yearB = useHolidays(years[years.length - 1]);
  const modes = useSaturdayModes(month);
  const loads = useTeachingDayLoads(first, last);

  const holidays = new Map<string, HolidayConfig>();
  for (const item of [...(yearA.data ?? []), ...(yearB.data ?? [])]) if (item.date) holidays.set(item.date, item);
  const monthHolidays = [...holidays.values()].filter((item) => item.date?.startsWith(month)).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked && holidays.has(picked) && picked.startsWith(month) ? picked : (monthHolidays[0]?.date ?? "");
  const [adding, setAdding] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState(false);

  const goMonth = (next: string) => {
    setPicked(null);
    void navigate({ href: adminPath(`${PATH}?month=${next}`), replace: true });
  };
  return {
    month, today, adding, importing, selected,
    selectedHoliday: selected ? holidays.get(selected) : undefined,
    importYear: Number(month.slice(0, 4)) + 1,
    holidays, monthHolidays,
    modes: new Map((modes.data ?? []).map((item) => [item.date ?? "", item.mode ?? "OFFICE"] as const)),
    periods: new Map((loads.data ?? []).map((item) => [item.date, item.periods] as const)),
    loading: yearA.isPending || yearB.isPending,
    failed: yearA.isError || yearB.isError,
    retry: () => { void yearA.refetch(); void yearB.refetch(); },
    prev: () => goMonth(shiftMonth(month, -1)),
    next: () => goMonth(shiftMonth(month, 1)),
    editing,
    select: (date: string | null) => { setPicked(date); setEditing(date !== null); },
    closeEdit: () => setEditing(false),
    openAdd: (date: string) => setAdding(date),
    closeAdd: () => setAdding(null),
    openImport: () => setImporting(true),
    closeImport: () => setImporting(false),
  };
}

export type DaysOffState = ReturnType<typeof useDaysOff>;
