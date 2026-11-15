import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { TeachingOverviewTeacherRow } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { slotText, type FoldedSlot } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, travelLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { scheduleCellSx, scheduleTokens } from "../shared/schedule-cell-sx";
import { OverviewHoverCard } from "./overview-hover-card";

const POSITIONS = [1, 2, 3, 4, 6, 7, 8, 9] as const;
const HOVER_DELAY_MS = 300;

type Day = TeachingOverviewTeacherRow["days"][number];

type Props = {
  day: Day;
  eventsById: ReadonlyMap<string, TeachingCalendarEvent>;
  onOpenSlot: (date: string, periodNo: number, eventId?: string, intent?: "edit" | "teacher") => void;
  slots: ReadonlyMap<string, FoldedSlot>;
  teacherName: string;
  weekStart: string;
};

/** Dong meta duoi o ngay (6.7): chay 2 truong (cam), khong kip di chuyen (do), nghi phep, ten truong. */
export function dayMeta(day: Day): { clash: boolean; text: string; warn: boolean } {
  if (day.travel && day.travel.gapMinutes < day.travel.requiredMinutes) return { clash: true, text: `⚠ ${travelLabel(day.travel, "short")}`, warn: false };
  if (day.onLeave) return { clash: false, text: "Nghỉ phép", warn: false };
  if (day.multiSchoolSameSession && day.travel) return { clash: false, text: travelLabel(day.travel, "far"), warn: true };
  return { clash: false, text: day.schoolShortNames.join(" · "), warn: day.multiSchoolSameSession };
}

function SlotBox({ date, day, eventsById, onOpenSlot, position, slot, teacherName }: { date: string; day: Day; eventsById: Props["eventsById"]; onOpenSlot: Props["onOpenSlot"]; position: number; slot?: FoldedSlot; teacherName: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const kind = !slot ? null : slot.conflict ? "clash" : slot.travel ? "travel" : slot.onLeave || day.onLeave ? "off" : slot.roles.every((role) => role === "ASSISTANT") && slot.roles.length ? "assistant" : slot.status === "DRAFT" ? "draft" : "published";
  const events = (slot?.eventIds ?? []).flatMap((id) => { const event = eventsById.get(id); return event ? [event] : []; });
  return (
    <>
      <Box
        data-slot={`${position}`}
        onDoubleClick={() => onOpenSlot(date, position, slot?.eventIds[0])}
        onMouseEnter={(event) => { if (!slot) return; const target = event.currentTarget; timer.current = setTimeout(() => setAnchor(target), HOVER_DELAY_MS); }}
        onMouseLeave={() => { clearTimeout(timer.current); setAnchor(null); }}
        sx={[{ alignItems: "center", borderRadius: 0.5, display: "flex", height: 22, justifyContent: "center", overflow: "hidden", px: 0.25, typography: "caption", whiteSpace: "nowrap" },
          kind ? scheduleCellSx(kind) : { bgcolor: scheduleTokens.surface, border: 1, borderColor: "divider" }] as never}
      >
        {slot ? slotText(slot) : null}
      </Box>
      {slot ? <OverviewHoverCard anchorEl={anchor} date={date} events={events} onChangeTeacher={() => onOpenSlot(date, position, slot.eventIds[0], "teacher")} onOpen={() => onOpenSlot(date, position, slot.eventIds[0])} periodNo={position} slot={slot} teacherName={teacherName} /> : null}
    </>
  );
}

/** O ngay (6.7): luoi 4x2 (tiet 1-4 tren, 6-9 duoi) + dong meta. */
export function OverviewTeacherDay({ day, eventsById, onOpenSlot, slots, teacherName, weekStart }: Props) {
  const date = addDaysToDate(weekStart, day.weekday - 1);
  const meta = dayMeta(day);
  return (
    <Box>
      <Box sx={{ display: "grid", gap: "2px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {POSITIONS.map((position) => (
          <SlotBox date={date} day={day} eventsById={eventsById} key={position} onOpenSlot={onOpenSlot} position={position} slot={slots.get(`${day.weekday}:${position}`)} teacherName={teacherName} />
        ))}
      </Box>
      <Typography noWrap sx={{ color: meta.clash ? scheduleTokens.clash.text : meta.warn ? scheduleTokens.warn.text : "text.secondary", mt: 0.25, typography: "caption" }}>{meta.text || " "}</Typography>
    </Box>
  );
}

