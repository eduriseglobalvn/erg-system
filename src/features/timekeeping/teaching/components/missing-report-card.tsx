import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { dayMonthVi, hhmm, mondayOf, periodRangeLabel, weekdayLong } from "../domain/teaching-model";

const isoWeekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() || 7;

/** «Tiết chưa báo giảng»: «Báo giảng ngay ›» opens Sổ đầu bài on the week of that period. */
export function MissingReportCard({ missing }: { missing: NonNullable<MyTeachingMonth["missingReports"]> }) {
  const navigate = useNavigate();
  if (missing.length === 0) return null;
  const periods = missing.reduce((sum, m) => sum + (m.periodCount ?? 0), 0);
  return (
    <Box component="section" sx={{ border: 1, borderColor: t.statusTint.warning.dot, borderRadius: `${t.radius.card}px`, p: 2 }}>
      <Typography component="h2" variant="subtitle1">Tiết chưa báo giảng ({periods} tiết)</Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}>
        {missing.map((m) => (
          <Box component="li" key={`${m.eventId}-${m.date}-${m.periodStart}`} sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", py: 0.75 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="div" variant="subtitle2">{m.className} · {periodRangeLabel(m.periodStart, m.periodCount)}</Typography>
              <Typography color="text.secondary" component="div" variant="caption">
                {weekdayLong(isoWeekday(m.date ?? ""))}, {dayMonthVi(m.date)} · {hhmm(m.from)} – {hhmm(m.to)}
              </Typography>
            </Box>
            <ErgButton onClick={() => void navigate({ href: teacherPath(`/class-log?tab=teacher&week=${mondayOf(m.date ?? "")}`) })} variant="text">Báo giảng ngay ›</ErgButton>
          </Box>
        ))}
      </Box>
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption" component="div">Thiếu báo giảng không làm mất tiết.</Typography>
    </Box>
  );
}
