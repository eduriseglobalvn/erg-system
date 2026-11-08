import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useTimekeepingMonth } from "../../api/timekeeping-query";
import { PunchCard } from "../punch/punch-card";
import { exportMyTimesheet } from "./export-timesheet";
import { MissingDayCard } from "./missing-day-card";
import { MonthCalendarGrid } from "./month-calendar-grid";
import { dayMonth, firstIssue, monthLabel, shiftPeriod, unitsVi } from "./timesheet-summary";

/** One cell of the four-column stats strip: big number, caption under it. */
function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Box sx={{ minWidth: 0, px: 0.5, py: 1.5, textAlign: "center" }}>
      <Typography color={warn ? "warning.main" : "text.primary"} component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="h4">{value}</Typography>
      <Typography color="text.secondary" component="div" variant="caption">{label}</Typography>
    </Box>
  );
}

const bordered = { border: 1, borderColor: "divider" } as const;

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

  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mx: -1 }}>
        <ErgIconButton label="Quay lại" onClick={() => go("/timekeeping")}><ArrowBackIcon /></ErgIconButton>
        <Typography component="h1" sx={{ flex: 1, minWidth: 0 }} variant="h4">Bảng công của tôi</Typography>
        <ErgIconButton disabled={!data} label="Xuất Excel" onClick={() => data && void exportMyTimesheet(data, period)}>
          <FileDownloadOutlinedIcon />
        </ErgIconButton>
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <ErgIconButton label="Tháng trước" onClick={() => setPeriod(shiftPeriod(period, -1))} sx={bordered}><ChevronLeftIcon /></ErgIconButton>
        <Box sx={{ minWidth: 0, textAlign: "center" }}>
          <Typography component="div" variant="subtitle1">{monthLabel(period)}</Typography>
          {review ? <Typography color="text.secondary" component="div" variant="caption">{review}</Typography> : null}
        </Box>
        <ErgIconButton disabled={period >= currentPeriod} label="Tháng sau" onClick={() => setPeriod(shiftPeriod(period, 1))} sx={bordered}><ChevronRightIcon /></ErgIconButton>
      </Box>
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được bảng công." title="Có lỗi xảy ra" />
      ) : isLoading || !data ? (
        <ErgSkeleton height={320} />
      ) : (
        <>
          <PunchCard sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", p: 0, "& > * + *": { borderLeft: 1, borderColor: "divider" } }}>
            <Stat label={`/ ${unitsVi(data.standardUnits)} công`} value={unitsVi(data.actualUnits)} />
            <Stat label="tiết dạy" value={String(data.periods ?? 0)} />
            <Stat label="lần muộn" value={String(data.lateCount ?? 0)} warn={(data.lateCount ?? 0) > 0} />
            <Stat label="phép còn" value={unitsVi(data.annualLeaveRemaining)} />
          </PunchCard>
          <PunchCard sx={{ p: 1.5 }}>
            <MonthCalendarGrid days={days} onSelect={(date) => go(`/timekeeping/timesheet?date=${date}`)} period={period} />
          </PunchCard>
          {issue ? <MissingDayCard issue={issue} locked={Boolean(data.locked)} onExplain={(date) => go(`/timekeeping/requests?new=explanation&date=${date}`)} onOpenRequest={(id) => go(`/timekeeping/requests?id=${encodeURIComponent(id)}`)} /> : null}
        </>
      )}
    </Box>
  );
}
