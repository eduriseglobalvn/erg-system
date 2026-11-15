import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import type { TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { conflictKindName, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { errorConflicts } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Props = {
  draft: TeachingScheduleDraftResult;
  events: readonly TeachingCalendarEvent[];
  shortNames: ReadonlyMap<string, string>;
};

const LOWER: Record<string, string> = { CLASS_TIME: "trùng lớp", ROOM_TIME: "trùng phòng", TEACHER_TIME: "trùng giáo viên", TRAVEL_TIME: "không kịp di chuyển" };

/** Dong 3 cua the nhap: «<k> trùng giáo viên cần xử lý», nhieu loai -> «<k> xung đột cần xử lý». */
export function draftIssueLine(conflicts: ReadonlyArray<{ kind: string }>): string {
  if (!conflicts.length) return "";
  const kinds = new Set(conflicts.map((conflict) => conflict.kind));
  return `${conflicts.length} ${kinds.size === 1 ? LOWER[[...kinds][0]] ?? conflictKindName([...kinds][0] as never).toLowerCase() : "xung đột"} cần xử lý`;
}

/** The nhap o panel trai: ten dot + chip «Nháp», «<n> tiết · <các thứ> · <trường>», loi (do), link mo trang xep. */
export function DraftCard({ draft, events, shortNames }: Props) {
  const own = events.filter((event) => event.batchId === draft.batch.id);
  const weekdays = [...new Set(own.map((event) => new Date(`${event.date}T00:00:00Z`).getUTCDay()))].sort((a, b) => a - b).map((day) => weekdayName(day === 0 ? 7 : day));
  const school = shortNames.get(draft.batch.schoolId) ?? own[0]?.schoolName ?? "";
  const issues = draftIssueLine(errorConflicts(draft.conflicts));
  return (
    <Box component="article" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: "10px", p: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Typography sx={{ typography: "subtitle2" }}>{draft.batch.label}</Typography>
        <Chip label="Nháp" size="small" sx={{ bgcolor: scheduleTokens.published.bg, color: scheduleTokens.published.text }} />
      </Box>
      <Typography sx={{ color: "text.secondary", typography: "caption" }}>{[`${own.length} tiết`, weekdays.join(", "), school].filter(Boolean).join(" · ")}</Typography>
      {issues ? <Typography sx={{ color: scheduleTokens.clash.edge, typography: "caption" }}>{issues}</Typography> : null}
      <Link href={`${adminPath("/calendar/schedule")}?batchId=${draft.batch.id}`} sx={{ typography: "caption" }} underline="hover">Mở để xuất bản →</Link>
    </Box>
  );
}
