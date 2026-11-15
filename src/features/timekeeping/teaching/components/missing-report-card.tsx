import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { useNavigate } from "@tanstack/react-router";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { dayMonthVi, hhmm, mondayOf, periodRangeLabel, weekdayLong } from "../domain/teaching-model";

const isoWeekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() || 7;

type Missing = NonNullable<MyTeachingMonth["missingReports"]>[number];

/** «Báo giảng ngay ›» / «Báo giảng ›» opens Sổ đầu bài on the week of that period. */
function useOpenLog() {
  const navigate = useNavigate();
  return (m: Missing) => void navigate({ href: teacherPath(`/class-log?tab=teacher&week=${mondayOf(m.date ?? "")}`) });
}

const link = { ...t.type.smallStrong, textDecoration: "none" } as const;

/** Desktop 6.3 «Tiết chưa báo giảng»: bordered card, one row per period, a red count on the right. */
export function MissingReportCard({ missing }: { missing: NonNullable<MyTeachingMonth["missingReports"]> }) {
  const open = useOpenLog();
  if (missing.length === 0) return null;
  const periods = missing.reduce((sum, m) => sum + (m.periodCount ?? 0), 0);
  return (
    <Box component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, display: "flex", flexDirection: "column", gap: "10px", p: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex" }}>
        <Box component="h2" sx={{ fontSize: "inherit", fontWeight: t.type.label.fontWeight, m: 0 }}>Tiết chưa báo giảng</Box>
        <Box component="span" sx={{ ...t.type.label, color: t.color.brandRed, ml: "auto" }}>{periods} tiết</Box>
      </Box>
      {missing.map((m) => (
        <Box key={`${m.eventId}-${m.date}-${m.periodStart}`} sx={{ alignItems: "center", border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.control}px`, display: "flex", gap: "10px", px: 1.5, py: "10px" }}>
          <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: "2px", minWidth: 0 }}>
            <Box component="span" sx={{ fontWeight: "fontWeightMedium" }}>{m.className} · {periodRangeLabel(m.periodStart, m.periodCount)}</Box>
            <Box component="span" sx={{ ...t.type.note, color: "text.secondary" }}>{weekdayLong(isoWeekday(m.date ?? ""))}, {dayMonthVi(m.date)} · {hhmm(m.from)} – {hhmm(m.to)}</Box>
          </Box>
          <Link component="button" onClick={() => open(m)} sx={link} type="button">Báo giảng ngay ›</Link>
        </Box>
      ))}
      <Box component="span" sx={{ ...t.type.note, color: "text.secondary" }}>Thiếu báo giảng không làm mất tiết.</Box>
    </Box>
  );
}

/** Phone 6.4: one red strip per period: «6A4 · Tiết 1–2 · Thứ 5 08/10», «Chưa báo giảng», «Báo giảng ›». */
export function MissingReportStrips({ missing }: { missing: NonNullable<MyTeachingMonth["missingReports"]> }) {
  const open = useOpenLog();
  return (
    <>
      {missing.map((m) => (
        <Box
          component="button"
          key={`${m.eventId}-${m.date}-${m.periodStart}`}
          onClick={() => open(m)}
          sx={{ ...t.type.small, alignItems: "center", bgcolor: t.statusTint.error.bg, border: 0, borderRadius: `${t.radius.card}px`, color: t.statusTint.error.color, cursor: "pointer", display: "flex", fontFamily: "inherit", gap: 1, px: "14px", py: 1.5, textAlign: "left", width: "100%" }}
          type="button"
        >
          <Box component="span" sx={{ flex: 1 }}>
            <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>{m.className} · {periodRangeLabel(m.periodStart, m.periodCount)} · {weekdayLong(isoWeekday(m.date ?? ""))} {dayMonthVi(m.date)}</Box><br />Chưa báo giảng
          </Box>
          <Box component="span" sx={{ fontWeight: t.type.label.fontWeight }}>Báo giảng ›</Box>
        </Box>
      ))}
    </>
  );
}
