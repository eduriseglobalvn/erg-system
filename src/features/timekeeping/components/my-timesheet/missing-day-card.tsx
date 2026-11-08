import ErrorIcon from "@mui/icons-material/Error";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { usePendingExplanation } from "../../api/timekeeping-request-query";
import { useTimekeepingDay } from "../../api/timekeeping-query";
import type { MonthDayView } from "../../api/timekeeping-types";
import { PendingExplanationNote } from "./pending-explanation-note";
import { dayMonth, MISSING_TITLE, unitsVi } from "./timesheet-summary";

type MissingDayCardProps = { issue: MonthDayView; locked: boolean; onExplain: (date: string) => void; onOpenRequest: (id: string) => void };

/** G04 error card for the latest unexplained day; the day query is shared with G05. */
export function MissingDayCard({ issue, locked, onExplain, onOpenRequest }: MissingDayCardProps) {
  const date = issue.date as string;
  const { data: day } = useTimekeepingDay(date);
  const pending = usePendingExplanation(date);
  const remaining = day?.explanationsRemaining;
  const tint = ergEnterpriseTokens.statusTint.error;
  const detail = [`Đang tính ${unitsVi(issue.units)} công`, remaining === undefined ? "" : `còn ${remaining} lượt giải trình`].filter(Boolean).join(" · ");
  return (
    <Box sx={{ alignItems: "center", bgcolor: tint.bg, border: 1, borderColor: tint.bg, borderRadius: `${ergEnterpriseTokens.radius.card}px`, color: tint.color, display: "flex", flexWrap: "wrap", gap: 1.5, p: 2 }}>
      <ErrorIcon aria-hidden sx={{ color: tint.dot }} />
      <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
        <Typography component="h2" variant="subtitle1">{dayMonth(date)} · {day?.missing ? MISSING_TITLE[day.missing] : "Thiếu chấm công"}</Typography>
        <Typography variant="caption">{detail}</Typography>
      </Box>
      {pending.request?.id ? (
        <PendingExplanationNote onOpen={() => onOpenRequest(pending.request?.id as string)} />
      ) : locked || remaining === 0 || pending.loading ? null : (
        <ErgButton onClick={() => onExplain(date)} size="small">Giải trình</ErgButton>
      )}
    </Box>
  );
}
