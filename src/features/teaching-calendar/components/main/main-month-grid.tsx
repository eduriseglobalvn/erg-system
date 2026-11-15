import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { addDaysToDate } from "@/features/teaching-calendar/domain/schedule-copy";

type Props = {
  events: readonly TeachingCalendarEvent[];
  from: string;
  month: string;
  /** Bam mot ngay: sang che do ngay. */
  onPickDay: (day: string) => void;
};

const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Che do Thang: moi o ngay ghi so tiet; bam de xem ngay do. */
export function MainMonthGrid({ events, from, month, onPickDay }: Props) {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.date, (counts.get(event.date) ?? 0) + 1);
  const days = Array.from({ length: 42 }, (_, index) => addDaysToDate(from, index));
  return (
    <Box aria-label="Lịch tháng" sx={{ border: 1, borderColor: "divider", borderRadius: "14px", display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", overflow: "hidden" }}>
      {HEAD.map((label) => <Box key={label} sx={{ borderBottom: 1, borderColor: "divider", color: "text.secondary", p: 0.75, textAlign: "center", typography: "caption" }}>{label}</Box>)}
      {days.map((day) => (
        <ButtonBase key={day} onClick={() => onPickDay(day)} sx={{ alignItems: "flex-start", borderBottom: 1, borderColor: "divider", borderLeft: 1, color: day.startsWith(month) ? "text.primary" : "text.disabled", display: "flex", flexDirection: "column", minHeight: 72, p: 0.75 }}>
          <Typography sx={{ typography: "caption" }}>{Number(day.slice(8))}</Typography>
          {counts.get(day) ? <Typography sx={{ color: "primary.main", typography: "caption" }}>{counts.get(day)} tiết</Typography> : null}
        </ButtonBase>
      ))}
    </Box>
  );
}
