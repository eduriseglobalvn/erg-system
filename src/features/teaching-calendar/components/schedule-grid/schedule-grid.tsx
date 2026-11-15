import { useMemo } from "react";
import Box from "@mui/material/Box";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { addDaysToDate, dayLabel, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { cellKey, WEEKDAYS, type CellState, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { ScheduleCell } from "./schedule-cell";

type Props = {
  active: string;
  holidays: ReadonlyMap<number, string>;
  onActivate: (key: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onMove: (from: string, to: string) => void;
  onOpen: (key: string, element: HTMLElement) => void;
  rows: ReadonlyMap<string, GridRow>;
  states: ReadonlyMap<string, CellState>;
  template: TeachingPeriodTemplate;
  unknown: ReadonlyMap<string, string>;
  weekStart: string;
};

const COLUMNS = "52px 112px repeat(6, minmax(0, 1fr))";
const { color, radius, type } = ergEnterpriseTokens;

/** Luoi Buoi / Tiet / Thu (board AdminCreate), ARIA grid: cot 52 + 112 + 6 ngay, header 46, hang 58. Keo o de doi tiet (@dnd-kit). */
export function ScheduleGrid({ active, holidays, onActivate, onKeyDown, onMove, onOpen, rows, states, template, unknown, weekStart }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const slots = useMemo(() => [...template.slots].sort((a, b) => a.periodNo - b.periodNo), [template]);
  const morning = slots.filter((slot) => slot.session === "MORNING").length;
  const onDragEnd = ({ active: from, over }: DragEndEvent) => { if (over && over.id !== from.id) onMove(String(from.id), String(over.id)); };

  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, overflow: "hidden" }}>
        <Box aria-colcount={8} aria-label="Thời khóa biểu" aria-rowcount={slots.length + 1} onKeyDown={onKeyDown} role="grid" sx={{ overflowX: "auto" }}>
          <Box role="row" sx={{ bgcolor: color.surfaceMuted, borderBottom: 1, borderColor: "divider", color: color.textSecondary, display: "grid", gridTemplateColumns: COLUMNS, height: 46, minWidth: 720, ...type.smallStrong }}>
            <Box role="columnheader" sx={{ px: 1, py: "13px" }}>Buổi</Box>
            <Box role="columnheader" sx={{ px: 1, py: "13px" }}>Tiết</Box>
            {WEEKDAYS.map((weekday) => (
              <Box key={weekday} role="columnheader" sx={{ borderLeft: `1px solid ${color.divider}`, px: 1.25, py: "5px" }}>
                {weekdayName(weekday)}
                <Box sx={{ color: color.textMuted, ...type.note }}>{dayLabel(addDaysToDate(weekStart, weekday - 1)).split(", ")[1]}</Box>
              </Box>
            ))}
          </Box>
          {slots.map((slot, index) => (
            <Box key={slot.periodNo} role="row" sx={{ borderBottom: index === morning - 1 ? `2px solid ${color.border}` : `1px solid ${color.divider}`, display: "grid", gridTemplateColumns: COLUMNS, height: 58, minWidth: 720 }}>
              <Box role="rowheader" sx={{ color: color.textMuted, px: 1, py: 0.75, ...type.label }}>
                {index === 0 || index === morning ? (slot.session === "MORNING" ? "Sáng" : "Chiều") : ""}
              </Box>
              <Box role="rowheader" sx={{ display: "flex", flexDirection: "column", justifyContent: "center", px: 1, py: 0.75, ...type.smallStrong }}>
                {slot.periodNo}
                <Box component="span" sx={{ color: color.textMuted, ...type.micro }}>{slot.startTime ? `${slot.startTime}–${slot.endTime}` : "trống giờ"}</Box>
              </Box>
              {WEEKDAYS.map((weekday) => {
                const key = cellKey(weekday, slot.periodNo);
                const holiday = holidays.get(weekday);
                return (
                  <ScheduleCell
                    active={active === key}
                    cellId={key}
                    holiday={holiday}
                    key={key}
                    off={!slot.startTime || Boolean(holiday)}
                    onActivate={onActivate}
                    onOpen={onOpen}
                    row={rows.get(key)}
                    state={states.get(key)}
                    unknownName={unknown.get(key)}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
        <Box component="footer" sx={{ borderTop: `1px solid ${color.divider}`, color: color.textMuted, display: "flex", flexWrap: "wrap", gap: 2.25, px: 1.75, py: 1, ...type.note }}>
          <span>Bấm ô để chọn · Enter mở ô · Tab / mũi tên chuyển ô</span>
          <span>Ctrl+V dán vùng copy từ Excel</span>
          <span>Kéo ô để dời tiết</span>
        </Box>
      </Box>
    </DndContext>
  );
}
