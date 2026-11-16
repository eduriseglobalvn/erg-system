import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";
import { CARD, LEAVE, SEMIBOLD, SIZE, t } from "./teacher-board-styles";

const DOW = ["T2", "T3", "T4", "T5", "T6", "T7"];
const MAX_CHIPS = 3;

type Props = { events: readonly TeachingCalendarEvent[]; leave: ReadonlyMap<string, string>; month: string; onPickDay: (day: string) => void; today: string; weeks: readonly (readonly string[])[] };

/** Luoi thang: moi o ngay co toi da 3 chip «lớp · T<tiết>», con lai «+n»; bam o de sang xem Ngay. */
export function TeacherMonthGrid({ events, leave, month, onPickDay, today, weeks }: Props) {
  return (
    <Box aria-label="Lịch dạy theo tháng" component="section" sx={{ ...CARD, flex: 1, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ borderBottom: `1px solid ${t.color.border}`, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {DOW.map((name) => <Box key={name} sx={{ borderLeft: `1px solid ${t.color.divider}`, color: t.color.textMuted, fontSize: SIZE.chip, fontWeight: SEMIBOLD, py: "6px", textAlign: "center" }}>{name}</Box>)}
      </Box>
      {weeks.map((week) => (
        <Box key={week[0]} sx={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
          {week.map((day) => {
            const list = events.filter((event) => event.date === day && event.status !== "CANCELLED");
            return (
              <ButtonBase
                aria-label={`Ngày ${Number(day.slice(8))}, ${list.length} tiết`} key={day} onClick={() => onPickDay(day)}
                sx={{ alignItems: "stretch", borderLeft: `1px solid ${t.color.divider}`, borderTop: `1px solid ${t.color.divider}`, display: "flex", flexDirection: "column", gap: "2px", minHeight: 96, opacity: day.startsWith(month) ? 1 : 0.5, p: "6px", textAlign: "left" }}
              >
                <Box sx={{ alignSelf: "flex-start", bgcolor: day === today ? t.color.primary : "transparent", borderRadius: `${t.radius.chip}px`, color: day === today ? t.color.surface : t.color.textSecondary, fontSize: SIZE.panel, px: "6px" }}>{Number(day.slice(8))}</Box>
                {leave.has(day) ? <Box component="span" sx={{ bgcolor: LEAVE.bg, borderRadius: "6px", color: LEAVE.text, fontSize: SIZE.chip, fontWeight: SEMIBOLD, px: "6px", py: "2px" }}>Nghỉ phép</Box> : null}
                {list.slice(0, MAX_CHIPS).map((event) => (
                  <Box component="span" key={event.id} sx={{ bgcolor: event.myRole === "ASSISTANT" ? t.color.surface : t.schedule.published.bg, border: event.myRole === "ASSISTANT" ? `1px dashed ${t.color.primary}` : 0, borderRadius: "6px", color: t.schedule.published.text, fontSize: SIZE.chip, overflow: "hidden", px: "6px", py: "2px", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.myRole === "ASSISTANT" ? "TG " : ""}{event.className} · T{event.periodStart}</Box>
                ))}
                {list.length > MAX_CHIPS ? <Box component="span" sx={{ color: t.color.textMuted, fontSize: SIZE.chip, px: "6px" }}>+{list.length - MAX_CHIPS}</Box> : null}
              </ButtonBase>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
