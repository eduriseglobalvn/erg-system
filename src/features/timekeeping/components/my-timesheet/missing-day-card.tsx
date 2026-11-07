import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useTimekeepingDay } from "../../api/timekeeping-query";
import type { MonthDayView } from "../../api/timekeeping-types";
import { dayMonth, unitsVi } from "./timesheet-summary";

const MISSING_TITLE = { IN: "Thiếu giờ vào", OUT: "Thiếu giờ ra" } as const;

type MissingDayCardProps = { issue: MonthDayView; locked: boolean; onExplain: (date: string) => void };

/** G04 warning card for the latest unexplained day; the day query is shared with G05. */
export function MissingDayCard({ issue, locked, onExplain }: MissingDayCardProps) {
  const date = issue.date as string;
  const { data: day } = useTimekeepingDay(date);
  const remaining = day?.explanationsRemaining;
  const tint = ergEnterpriseTokens.statusTint.warning;
  const detail = [`Đang tính ${unitsVi(issue.units)} công`, remaining === undefined ? "" : `còn ${remaining} lượt giải trình`].filter(Boolean).join(" · ");
  return (
    <Box sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: `${ergEnterpriseTokens.radius.card}px`, color: tint.color, display: "flex", gap: 2, justifyContent: "space-between", p: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" variant="subtitle1">{dayMonth(date)} · {day?.missing ? MISSING_TITLE[day.missing] : "Thiếu chấm công"}</Typography>
        <Typography variant="body2">{detail}</Typography>
      </Box>
      {locked || remaining === 0 ? null : <ErgButton onClick={() => onExplain(date)}>Giải trình</ErgButton>}
    </Box>
  );
}
