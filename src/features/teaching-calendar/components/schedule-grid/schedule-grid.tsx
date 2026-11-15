import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { addDaysToDate, dayLabel, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { cellKey, WEEKDAYS, type CellState, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
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

const head = { bgcolor: "background.default", borderBottom: 1, borderColor: "divider", color: "text.secondary", p: 0.75, typography: "caption" } as const;

/** Luoi Thu / Buoi / Tiet (6.2), ARIA grid. Keo o de doi tiet (@dnd-kit), tiet khong co gio la o xam. */
export function ScheduleGrid({ active, holidays, onActivate, onKeyDown, onMove, onOpen, rows, states, template, unknown, weekStart }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const slots = useMemo(() => [...template.slots].sort((a, b) => a.periodNo - b.periodNo), [template]);
  const morning = slots.filter((slot) => slot.session === "MORNING").length;
  const onDragEnd = ({ active: from, over }: DragEndEvent) => { if (over && over.id !== from.id) onMove(String(from.id), String(over.id)); };

  return (
    <DndContext onDragEnd={onDragEnd} sensors={sensors}>
      <Box
        aria-colcount={8}
        aria-label="Thời khóa biểu"
        aria-rowcount={slots.length + 1}
        onKeyDown={onKeyDown}
        role="grid"
        sx={{ border: 1, borderColor: "divider", borderRadius: "14px", display: "grid", gridTemplateColumns: "64px 96px repeat(6, minmax(112px, 1fr))", overflow: "auto" }}
      >
        <Box role="row" sx={{ display: "contents" }}>
          <Box role="columnheader" sx={head}>Buổi</Box>
          <Box role="columnheader" sx={head}>Tiết</Box>
          {WEEKDAYS.map((weekday) => (
            <Box key={weekday} role="columnheader" sx={head}>{weekdayName(weekday)} {dayLabel(addDaysToDate(weekStart, weekday - 1)).split(", ")[1]}</Box>
          ))}
        </Box>
        {slots.map((slot, index) => (
          <Box key={slot.periodNo} role="row" sx={{ display: "contents" }}>
            {index === 0 || index === morning ? (
              <Box role="rowheader" sx={{ ...head, borderBottom: 0, gridRow: `span ${index === 0 ? morning : slots.length - morning}`, writingMode: "vertical-rl", textAlign: "center" }}>
                {slot.session === "MORNING" ? "Sáng" : "Chiều"}
              </Box>
            ) : null}
            <Box role="rowheader" sx={{ ...head, borderBottom: 0 }}>
              <Typography component="span" sx={{ typography: "body2" }}>{slot.periodNo}</Typography>
              {slot.startTime ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>{slot.startTime}–{slot.endTime}</Typography> : null}
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
      <Typography sx={{ color: "text.secondary", display: "flex", flexWrap: "wrap", gap: 2, mt: 1, typography: "caption" }}>
        <span>Bấm ô để chọn · Enter mở ô · Tab / mũi tên chuyển ô</span>
        <span>Ctrl+V dán vùng copy từ Excel</span>
        <span>Kéo ô để dời tiết</span>
      </Typography>
    </DndContext>
  );
}
