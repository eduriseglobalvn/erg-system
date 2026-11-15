import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";

import { cellKey, newClientRowId, WEEKDAYS, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";

export type ScheduleIntent = "edit" | "copy" | "teacher" | "move";

type Options = {
  cells: ReadonlyMap<string, GridRow>;
  periods: readonly number[];
  ready: boolean;
  setActive: (key: string) => void;
  setCell: (key: string, row: GridRow | null) => void;
  /** `view: "teacher"` mo thang picker giao vien. */
  openCell: (key: string, view?: "teacher") => void;
};

/** O ke ben de nhan ban: cung tiet o ngay ke tiep con trong, het ngay thi tiet ke tiep ngay dau tuan. */
export function copyTargetKey(key: string, taken: ReadonlySet<string>, periods: readonly number[]): string | null {
  const [weekday, periodNo] = key.split(":").map(Number);
  const row = periods.indexOf(periodNo);
  const candidates = [
    ...WEEKDAYS.filter((day) => day > weekday).map((day) => cellKey(day, periodNo)),
    ...periods.slice(row + 1).flatMap((period) => WEEKDAYS.map((day) => cellKey(day, period))),
  ];
  return candidates.find((candidate) => !taken.has(candidate)) ?? null;
}

/**
 * `?focus=<yyyy-MM-dd>:<tiet>&intent=edit|copy|teacher|move` tu popover o Main (6.1): chay mot lan khi luoi da nap.
 * edit mo o; teacher mo o o man chon giao vien; copy chep dong sang o ke ben roi mo o do; move chi dua tro ve o de keo.
 */
export function useScheduleIntent({ cells, openCell, periods, ready, setActive, setCell }: Options) {
  const params = new URLSearchParams(useLocation().searchStr);
  const focus = params.get("focus");
  const intent = (params.get("intent") ?? "edit") as ScheduleIntent;
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !ready || !focus) return;
    const [date, period] = focus.split(":");
    const weekday = weekdayIndex(date);
    const periodNo = Number(period);
    if (!WEEKDAYS.some((day) => day === weekday) || !periods.includes(periodNo)) { done.current = true; return; }
    done.current = true;
    const key = cellKey(weekday, periodNo);
    setActive(key);
    if (intent === "move") return;
    if (intent === "copy") {
      const source = cells.get(key);
      const target = source ? copyTargetKey(key, new Set(cells.keys()), periods) : null;
      if (!source || !target) return;
      const [targetWeekday, targetPeriod] = target.split(":").map(Number);
      setCell(target, { ...source, clientRowId: newClientRowId(), eventId: undefined, periodNo: targetPeriod, weekday: targetWeekday });
      setActive(target);
      requestAnimationFrame(() => openCell(target));
      return;
    }
    requestAnimationFrame(() => openCell(key, intent === "teacher" ? "teacher" : undefined));
  }, [cells, focus, intent, openCell, periods, ready, setActive, setCell]);
}
