import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { useTimekeepingMonth } from "../api/timekeeping-query";
import { PunchCard } from "./punch/punch-card";
import { periodOf } from "./punch/punch-format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle1">{value}</Typography>
    </Box>
  );
}

type MonthStatsCardProps = { serverNow: Date; onOpenTimesheet: () => void; onCreateRequest: () => void };

/** G01 month card: units worked, lateness, annual leave left, pending requests. */
export function MonthStatsCard({ serverNow, onOpenTimesheet, onCreateRequest }: MonthStatsCardProps) {
  const { data, isLoading } = useTimekeepingMonth(periodOf(serverNow));
  return (
    <PunchCard>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography component="h2" variant="subtitle1">Tháng này</Typography>
        <Button onClick={onOpenTimesheet} size="small" variant="text">Bảng công</Button>
      </Box>
      {isLoading || !data ? (
        <ErgSkeleton height={72} />
      ) : (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
          <Stat label="Công thực tế" value={`${data.actualUnits ?? 0} / ${data.standardUnits ?? 0}`} />
          <Stat label="Đi muộn" value={`${data.lateCount ?? 0} lần · ${data.lateMinutes ?? 0} phút`} />
          <Stat label="Phép năm còn" value={`${data.annualLeaveRemaining ?? 0} ngày`} />
          <Stat label="Đơn đang chờ" value={String(data.pendingRequests ?? 0)} />
        </Box>
      )}
      <Button fullWidth onClick={onCreateRequest} sx={{ mt: 2 }} variant="outlined">Tạo đơn</Button>
    </PunchCard>
  );
}
