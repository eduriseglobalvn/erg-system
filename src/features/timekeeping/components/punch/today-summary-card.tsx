import CoPresentIcon from "@mui/icons-material/CoPresent";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import type { TodayView } from "../../api/timekeeping-types";
import { CardRow, PunchCard } from "./punch-card";
import { hhmm } from "./punch-format";

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <CardRow icon={icon} trailing={<Typography color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }} variant="caption">{value}</Typography>}>
      <Typography variant="body2">{label}</Typography>
    </CardRow>
  );
}

/** "Hôm nay" card: in/out times and the number of teaching periods. */
export function TodaySummaryCard({ today }: { today: TodayView }) {
  const periods = today.periods?.length ?? 0;
  const expectedOut = hhmm(today.expectedOut ?? today.shift?.end);
  return (
    <PunchCard sx={{ p: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", pb: 0.5, pt: 1.5, px: 2 }}>
        <Typography component="h2" variant="h6">Hôm nay</Typography>
        <Typography color="text.secondary" variant="caption">Công tính theo ca + tiết</Typography>
      </Box>
      <Row icon={<LoginIcon />} label="Vào ca" value={hhmm(today.in?.serverTime) || "Chưa chấm"} />
      <Row icon={<LogoutIcon />} label="Ra ca" value={today.out ? hhmm(today.out.serverTime) : expectedOut ? `Dự kiến ${expectedOut}` : "—"} />
      <Row icon={<CoPresentIcon />} label="Tiết dạy" value={`${periods} tiết`} />
    </PunchCard>
  );
}
