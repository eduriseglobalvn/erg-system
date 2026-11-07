import Typography from "@mui/material/Typography";

import type { TodayView } from "../../api/timekeeping-types";
import { PunchCard } from "./punch-card";
import { hhmm } from "./punch-format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Typography component="div" sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }} variant="body2">
      <span>{label}</span>
      <Typography component="span" sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle2">{value}</Typography>
    </Typography>
  );
}

/** "Hôm nay" card: in/out times and the number of teaching periods. */
export function TodaySummaryCard({ today }: { today: TodayView }) {
  const periods = today.periods?.length ?? 0;
  return (
    <PunchCard>
      <Typography component="h2" sx={{ mb: 1 }} variant="subtitle1">Hôm nay</Typography>
      <Row label="Vào ca" value={hhmm(today.in?.serverTime) || "—"} />
      <Row label={today.out ? "Ra ca" : "Ra ca (dự kiến)"} value={hhmm(today.out?.serverTime ?? today.expectedOut ?? today.shift?.end) || "—"} />
      <Row label="Tiết dạy" value={`${periods} tiết`} />
    </PunchCard>
  );
}
