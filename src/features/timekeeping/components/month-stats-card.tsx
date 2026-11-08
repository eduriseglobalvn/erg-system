import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { useTimekeepingMonth } from "../api/timekeeping-query";
import { unitsVi } from "./my-timesheet/timesheet-summary";
import { PunchCard } from "./punch/punch-card";
import { periodOf } from "./punch/punch-format";

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" component="div" variant="caption">{label}</Typography>
      <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h4">
        {value}
        <Typography color="text.secondary" component="span" variant="caption">{` ${unit}`}</Typography>
      </Typography>
    </Box>
  );
}

type MonthStatsCardProps = { serverNow: Date; onOpenTimesheet: () => void };

/** G01 month card: units worked, lateness, annual leave left, pending requests. */
export function MonthStatsCard({ serverNow, onOpenTimesheet }: MonthStatsCardProps) {
  const { data, isLoading } = useTimekeepingMonth(periodOf(serverNow));
  return (
    <PunchCard sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Typography component="h2" variant="h6">{`Tháng ${serverNow.getMonth() + 1}`}</Typography>
        <Button endIcon={<ChevronRightIcon />} onClick={onOpenTimesheet} size="small" variant="text">Bảng công</Button>
      </Box>
      {isLoading || !data ? (
        <ErgSkeleton height={72} />
      ) : (
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "1fr 1fr" }}>
          <Stat label="Công thực tế" unit={`/ ${unitsVi(data.standardUnits)}`} value={unitsVi(data.actualUnits)} />
          <Stat label="Đi muộn" unit={`lần · ${data.lateMinutes ?? 0} phút`} value={String(data.lateCount ?? 0)} />
          <Stat label="Phép năm còn" unit="ngày" value={unitsVi(data.annualLeaveRemaining)} />
          <Stat label="Đơn đang chờ" unit="đơn" value={String(data.pendingRequests ?? 0)} />
        </Box>
      )}
    </PunchCard>
  );
}
