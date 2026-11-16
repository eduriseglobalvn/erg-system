import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

import type { TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { conflictKindName, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { errorConflicts } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
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
    <Box component="article" sx={{ bgcolor: "background.paper", border: `1px solid ${ergEnterpriseTokens.color.border}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "flex", flexDirection: "column", gap: "6px", p: 1.5 }}>
      <Box sx={{ typography: "subtitle2", fontSize: "0.8125rem" }}>
        {draft.batch.label}{" "}
        <Box component="span" sx={{ bgcolor: scheduleTokens.neutral.bg, borderRadius: "999px", color: scheduleTokens.neutral.text, fontSize: "0.6875rem", fontWeight: "fontWeightRegular", px: 1, py: "1px" }}>Nháp</Box>
      </Box>
      <Box sx={{ color: ergEnterpriseTokens.color.textSecondary }}>{[`${own.length} tiết`, weekdays.join(", "), school].filter(Boolean).join(" · ")}</Box>
      {issues ? <Box sx={{ color: scheduleTokens.clash.text }}>{issues}</Box> : null}
      <Link href={`${adminPath("/calendar/schedule")}?batchId=${draft.batch.id}`} sx={{ typography: "subtitle2", fontSize: "0.8125rem" }} underline="none">Mở để áp dụng →</Link>
    </Box>
  );
}
