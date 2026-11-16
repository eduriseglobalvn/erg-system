import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Popper from "@mui/material/Popper";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import type { FoldedSlot } from "@/features/teaching-calendar/domain/overview-model";
import { dayLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { ink, tone, type, weight } from "./overview-styles";

type Props = {
  anchorEl: HTMLElement | null;
  date: string;
  events: readonly TeachingCalendarEvent[];
  onChangeTeacher: () => void;
  onOpen: () => void;
  periodNo: number;
  slot: FoldedSlot;
  teacherName: string;
};

const action = { ...type(12), alignItems: "center", display: "inline-flex", height: 28 } as const;

/**
 * Hover card o slot (board AdminOverviewTeacher), hien sau 300 ms: «Q.Vương · Thứ 4, 11/11 · Tiết 6» + gio, moi tiet mot dong «9A4 · PM 03 · THCS …»,
 * «Trùng giờ ở 2 trường.» (bo km, 2.3-1), «Trợ giảng cho …», nut «Đổi GV» (hop dong chua tra goi y GV) va link «Mở ô».
 */
export function OverviewHoverCard({ anchorEl, date, events, onChangeTeacher, onOpen, periodNo, slot, teacherName }: Props) {
  const start = events[0]?.startTime;
  const mainTeacher = slot.roles.includes("ASSISTANT") ? events[0]?.teachers.find((teacher) => teacher.role === "MAIN")?.displayName : undefined;
  const lines = events.length
    ? events.map((event) => ({ key: event.id, name: event.className, rest: [event.roomName, event.schoolName].filter(Boolean).join(" · ") }))
    : slot.classNames.map((name, index) => ({ key: name + index, name, rest: slot.schoolShortNames.join(", ") }));
  return (
    <Popper anchorEl={anchorEl} open={Boolean(anchorEl)} placement="bottom-start" role="tooltip" sx={{ zIndex: "tooltip" }}>
      <Box sx={{ ...type(12), bgcolor: ink.surface, borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, display: "flex", flexDirection: "column", gap: 1, px: "14px", py: "12px", width: 300 }}>
        <Box sx={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
          <Box component="strong" sx={type(13, 600)}>{teacherName} · {dayLabel(date)} · Tiết {periodNo}</Box>
          {start ? <Box component="span" sx={{ color: ink.textMuted }}>{start}</Box> : null}
        </Box>
        <Box sx={{ display: "grid", gap: "4px 8px", gridTemplateColumns: slot.conflict ? "4px 1fr" : "1fr" }}>
          {slot.conflict ? <Box component="span" sx={{ bgcolor: tone.clash.edge, borderRadius: "2px", gridRow: `span ${Math.max(1, lines.length)}` }} /> : null}
          {lines.map((line) => <span key={line.key}><Box component="strong" sx={{ ...weight(600) }}>{line.name}</Box>{line.rest ? ` · ${line.rest}` : ""}</span>)}
        </Box>
        {slot.conflict && slot.schoolShortNames.length > 1 ? <Box sx={{ color: tone.clash.text }}>Trùng giờ ở {slot.schoolShortNames.length} trường.</Box> : null}
        {mainTeacher ? <Box sx={{ color: ink.textMuted }}>Trợ giảng cho {mainTeacher}</Box> : null}
        <Box sx={{ display: "flex", gap: 1 }}>
          <ButtonBase onClick={onChangeTeacher} sx={{ ...action, border: `1px solid ${ink.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: ink.text, px: "10px" }}>Đổi GV</ButtonBase>
          <ButtonBase onClick={onOpen} sx={{ ...action, color: ink.primary, px: "6px" }}>Mở ô</ButtonBase>
        </Box>
      </Box>
    </Popper>
  );
}
