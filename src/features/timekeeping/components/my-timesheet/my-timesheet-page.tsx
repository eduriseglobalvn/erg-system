import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useTimekeepingMonth } from "../../api/timekeeping-query";
import { PunchCard } from "../punch/punch-card";
import { exportMyTimesheet } from "./export-timesheet";
import { MissingDayCard } from "./missing-day-card";
import { MonthCalendarGrid } from "./month-calendar-grid";
import { dayMonth, firstIssue, monthLabel, shiftPeriod, unitsVi } from "./timesheet-summary";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <PunchCard>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="h6">{value}</Typography>
    </PunchCard>
  );
}

type MyTimesheetPageProps = { period: string; currentPeriod: string };

/** G04: month picker, stats, calendar and the latest missing day. The month lives in `?period=`, the day in `?date=` (G05). */
export function MyTimesheetPage({ period, currentPeriod }: MyTimesheetPageProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTimekeepingMonth(period);
  const go = (path: string, replace = false) => void navigate({ href: teacherPath(path), replace });
  const setPeriod = (next: string) => go(`/timekeeping/timesheet?period=${next}`, true);

  const days = data?.days ?? [];
  const issue = firstIssue(days);
  const review = data?.locked ? "Đã chốt" : data?.reviewUntil ? `Rà soát đến ${dayMonth(data.reviewUntil)}, sau đó chốt` : "";
  const monthPicker = (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
      <ErgIconButton label="Tháng trước" onClick={() => setPeriod(shiftPeriod(period, -1))}><ChevronLeftIcon /></ErgIconButton>
      <Typography component="span" sx={{ minWidth: 112, textAlign: "center" }} variant="subtitle1">{monthLabel(period)}</Typography>
      <ErgIconButton disabled={period >= currentPeriod} label="Tháng sau" onClick={() => setPeriod(shiftPeriod(period, 1))}><ChevronRightIcon /></ErgIconButton>
    </Box>
  );

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader
        description={review}
        primaryAction={
          <ErgIconButton disabled={!data} label="Xuất Excel" onClick={() => data && void exportMyTimesheet(data, period)}>
            <FileDownloadOutlinedIcon />
          </ErgIconButton>
        }
        title="Bảng công của tôi"
      />
      {monthPicker}
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được bảng công." title="Có lỗi xảy ra" />
      ) : isLoading || !data ? (
        <ErgSkeleton height={320} />
      ) : (
        <>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" } }}>
            <Stat label="Công / chuẩn" value={`${unitsVi(data.actualUnits)} / ${unitsVi(data.standardUnits)}`} />
            <Stat label="Tiết dạy" value={String(data.periods ?? 0)} />
            <Stat label="Lần muộn" value={String(data.lateCount ?? 0)} />
            <Stat label="Ngày phép còn" value={unitsVi(data.annualLeaveRemaining)} />
          </Box>
          <PunchCard>
            <MonthCalendarGrid days={days} onSelect={(date) => go(`/timekeeping/timesheet?date=${date}`)} period={period} />
          </PunchCard>
          {issue ? <MissingDayCard issue={issue} locked={Boolean(data.locked)} onExplain={(date) => go(`/timekeeping/requests?new=explanation&date=${date}`)} onOpenRequest={(id) => go(`/timekeeping/requests?id=${encodeURIComponent(id)}`)} /> : null}
        </>
      )}
    </Box>
  );
}
