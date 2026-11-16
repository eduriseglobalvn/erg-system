import { useCallback, useState, type KeyboardEvent } from "react";

import { cellKey, parseCellKey, WEEKDAYS } from "@/features/teaching-calendar/domain/schedule-grid-model";

/** O ke tiep khi bam phim di chuyen; trong luoi 6 cot (Thu 2..7) x cac tiet (`periods`). Tab / Shift+Tab di tung o theo hang, het hang xuong hang ke. */
export function nextCellKey(current: string, key: string, shiftKey: boolean, periods: readonly number[]): string | null {
  const { periodNo, weekday } = parseCellKey(current);
  const row = periods.indexOf(periodNo);
  if (row < 0) return null;
  const last = periods.length - 1;
  const first = WEEKDAYS[0];
  const lastDay = WEEKDAYS[WEEKDAYS.length - 1];
  switch (key) {
    case "ArrowUp": return row > 0 ? cellKey(weekday, periods[row - 1]) : null;
    case "ArrowDown": return row < last ? cellKey(weekday, periods[row + 1]) : null;
    case "ArrowLeft": return weekday > first ? cellKey(weekday - 1, periodNo) : null;
    case "ArrowRight": return weekday < lastDay ? cellKey(weekday + 1, periodNo) : null;
    case "Tab":
      if (shiftKey) {
        if (weekday > first) return cellKey(weekday - 1, periodNo);
        return row > 0 ? cellKey(lastDay, periods[row - 1]) : null;
      }
      if (weekday < lastDay) return cellKey(weekday + 1, periodNo);
      return row < last ? cellKey(first, periods[row + 1]) : null;
    default: return null;
  }
}

type Handlers = {
  onClear: (key: string) => void;
  onCopy: (key: string) => void;
  onEscape?: () => void;
  onOpen: (key: string) => void;
  periods: readonly number[];
};

/** Ban phim cho luoi (ARIA grid): mui ten / Tab chuyen o, Enter mo, Delete xoa, Ctrl+C, Esc dong (dan Ctrl+V di qua su kien paste cua luoi). */
export function useGridKeyboard({ onClear, onCopy, onEscape, onOpen, periods }: Handlers) {
  const [active, setActive] = useState<string>(cellKey(1, periods[0] ?? 1));

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [role='dialog']")) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "c") { onCopy(active); return; }
    if (event.key === "Enter") { event.preventDefault(); onOpen(active); return; }
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onClear(active); return; }
    if (event.key === "Escape") { onEscape?.(); return; }
    const next = nextCellKey(active, event.key, event.shiftKey, periods);
    if (next) {
      event.preventDefault();
      setActive(next);
    }
  }, [active, onClear, onCopy, onEscape, onOpen, periods]);

  return { active, onKeyDown, setActive };
}
