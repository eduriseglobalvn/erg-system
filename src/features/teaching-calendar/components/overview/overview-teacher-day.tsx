import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";

import type { TeachingOverviewTeacherRow } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { slotText, type FoldedSlot } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, travelLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { OverviewHoverCard } from "./overview-hover-card";
import { ink, stripes, tone, type } from "./overview-styles";

const POSITIONS = [1, 2, 3, 4, 6, 7, 8, 9] as const;
const HOVER_DELAY_MS = 300;

/** Mau o tiet theo board AdminOverviewTeacher (soc nhap 4/8, nghi 4/5, tro giang chi vien net dut). */
const SLOT_SX = {
  assistant: { backgroundColor: tone.surface, color: tone.published.text, outline: `1px dashed ${ink.primary}`, outlineOffset: -1 },
  clash: { backgroundColor: tone.clash.bg, boxShadow: `inset 0 0 0 1.5px ${tone.clash.edge}`, color: tone.clash.text },
  draft: { backgroundImage: stripes(4, tone.surface, tone.draft.stripe), boxShadow: `inset 0 0 0 1px ${ink.primary}`, color: tone.published.text },
  empty: { backgroundColor: ink.surfaceSubtle },
  off: { backgroundImage: `repeating-linear-gradient(135deg, ${tone.off.stripe} 0 4px, ${tone.off.stripeAlt} 4px 5px)` },
  published: { backgroundColor: ink.primarySofter, color: tone.published.text },
  travel: { backgroundColor: tone.clash.bg, color: tone.clash.text, outline: `1.5px dashed ${tone.clash.edge}`, outlineOffset: -1.5 },
} as const;

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
  const kind = day.onLeave ? "off" : !slot ? "empty" : slot.conflict ? "clash" : slot.travel ? "travel" : slot.onLeave ? "off" : slot.roles.every((role) => role === "ASSISTANT") && slot.roles.length ? "assistant" : slot.status === "DRAFT" ? "draft" : "published";
  const events = (slot?.eventIds ?? []).flatMap((id) => { const event = eventsById.get(id); return event ? [event] : []; });
  return (
    <>
      <Box
        data-slot={`${position}`}
        onDoubleClick={() => onOpenSlot(date, position, slot?.eventIds[0])}
        onMouseEnter={(event) => { if (!slot) return; const target = event.currentTarget; timer.current = setTimeout(() => setAnchor(target), HOVER_DELAY_MS); }}
        onMouseLeave={() => { clearTimeout(timer.current); setAnchor(null); }}
        sx={{ ...type(10, 600), alignItems: "center", borderRadius: "5px", display: "flex", height: 20, justifyContent: "center", overflow: "hidden", whiteSpace: "nowrap", ...SLOT_SX[kind] }}
      >
        {slot && kind !== "off" ? slotText(slot) : null}
      </Box>
      {slot ? <OverviewHoverCard anchorEl={anchor} date={date} events={events} onChangeTeacher={() => onOpenSlot(date, position, slot.eventIds[0], "teacher")} onOpen={() => onOpenSlot(date, position, slot.eventIds[0])} periodNo={position} slot={slot} teacherName={teacherName} /> : null}
    </>
  );
}

/** O ngay (6.7): luoi 4x2 (tiet 1-4 tren, 6-9 duoi) + dong meta; nen cam khi chay 2 truong, hong khi khong kip di chuyen. */
export function OverviewTeacherDay({ day, eventsById, onOpenSlot, slots, teacherName, weekStart }: Props) {
  const date = addDaysToDate(weekStart, day.weekday - 1);
  const meta = dayMeta(day);
  return (
    <Box role="cell" sx={{ bgcolor: meta.clash ? alpha(tone.clash.edge, 0.05) : meta.warn && !day.onLeave ? tone.warn.bg : undefined, borderLeft: `1px solid ${ink.divider}`, minWidth: 0, px: 1, py: "6px" }}>
      <Box sx={{ display: "grid", gap: "2px", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {POSITIONS.map((position) => (
          <SlotBox date={date} day={day} eventsById={eventsById} key={position} onOpenSlot={onOpenSlot} position={position} slot={slots.get(`${day.weekday}:${position}`)} teacherName={teacherName} />
        ))}
      </Box>
      <Box sx={{ ...type(10, meta.clash || meta.warn ? 600 : 400), color: meta.clash ? tone.clash.text : meta.warn ? tone.warn.text : ink.textMuted, mt: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.text || " "}</Box>
    </Box>
  );
}
