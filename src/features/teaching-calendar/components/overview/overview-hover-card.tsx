import Popper from "@mui/material/Popper";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import type { FoldedSlot } from "@/features/teaching-calendar/domain/overview-model";
import { dayLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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

/** Hover card o slot (6.7), hien sau 300 ms: tung tiet mot dong, «Trùng giờ ở 2 trường.» (bo km, 2.3-1), «Trợ giảng cho …», link «Mở ô». */
export function OverviewHoverCard({ anchorEl, date, events, onChangeTeacher, onOpen, periodNo, slot, teacherName }: Props) {
  const start = events[0]?.startTime;
  const mainTeacher = slot.roles.includes("ASSISTANT") ? events[0]?.teachers.find((teacher) => teacher.role === "MAIN")?.displayName : undefined;
  return (
    <Popper anchorEl={anchorEl} open={Boolean(anchorEl)} placement="bottom-start" sx={{ zIndex: "tooltip" }}>
      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, maxWidth: 360, p: 1.5 }}>
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "subtitle2" }}>{teacherName} · {dayLabel(date)} · Tiết {periodNo}{start ? ` ${start}` : ""}</Typography>
          {events.length
            ? events.map((event) => <Typography key={event.id} sx={{ typography: "body2" }}>{[event.className, event.roomName, event.schoolName].filter(Boolean).join(" · ")}</Typography>)
            : slot.classNames.map((name, index) => <Typography key={name + index} sx={{ typography: "body2" }}>{name} · {slot.schoolShortNames.join(", ")}</Typography>)}
          {slot.conflict && slot.schoolShortNames.length > 1 ? <Typography sx={{ typography: "body2" }}>Trùng giờ ở {slot.schoolShortNames.length} trường.</Typography> : null}
          {mainTeacher ? <Typography sx={{ color: "text.secondary", typography: "body2" }}>Trợ giảng cho {mainTeacher}</Typography> : null}
          <Stack direction="row" spacing={1.5}>
            <Link component="button" onClick={onChangeTeacher} sx={{ typography: "caption" }} type="button" underline="hover">Đổi GV</Link>
            <Link component="button" onClick={onOpen} sx={{ typography: "caption" }} type="button" underline="hover">Mở ô</Link>
          </Stack>
        </Stack>
      </Paper>
    </Popper>
  );
}
