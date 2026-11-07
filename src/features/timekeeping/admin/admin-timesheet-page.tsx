import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Box from "@mui/material/Box";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminTimesheet, useTimekeepingSchools } from "../api/timekeeping-admin-query";
import { dayMonth, monthLabel, shiftPeriod } from "../components/my-timesheet/timesheet-summary";
import { periodOf } from "../components/punch/punch-format";
import { exportTimesheet } from "./export-timesheet";
import { PeriodLockAction } from "./period-lock-action";
import { PeriodStageStepper } from "./period-stage-stepper";
import { SchoolFilter } from "./school-filter";
import { SymbolLegend } from "./symbol-legend";
import { TimesheetGrid } from "./timesheet-grid";
import { useAdminSearch } from "./use-admin-search";

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Teams arrive as raw department ids (no names yet): long ids are shortened so the filter stays readable. */
const teamLabel = (team: string) => (team.length > 12 ? `Tổ …${team.slice(-4)}` : team);

/** "01/11 – 30/11" of a yyyy-MM period. */
function periodRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  return `${dayMonth(`${period}-01`)} – ${dayMonth(`${period}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`)}`;
}

/** A02: monthly sheet of a school with stage stepper, lock/reopen and payroll export. School and month live in `?schoolId=&period=`. */
export function AdminTimesheetPage() {
  const { search, update } = useAdminSearch("/employees/timesheet");
  const schools = useTimekeepingSchools();
  const currentPeriod = periodOf(new Date());
  const period = search.period && PERIOD_PATTERN.test(search.period) ? search.period : currentPeriod;
  const schoolId = search.schoolId ?? schools.data?.[0]?.id ?? "";
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [teams, setTeams] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const { data, isLoading, isError, refetch } = useAdminTimesheet({ schoolId, period, team: team || undefined, q: debouncedQ || undefined, page, size });
  const rows = data?.rows ?? [];

  // Team options come from the rows seen so far (the API has no team list yet).
  const seen = rows.map((row) => row.team).filter((value): value is string => Boolean(value));
  if (seen.some((value) => !teams.includes(value))) setTeams([...new Set([...teams, ...seen])].sort());

  const reset = () => setPage(0);
  const schoolName = schools.data?.find((school) => school.id === schoolId)?.name ?? "";
  const description = [`Kỳ ${periodRange(period)}`, `Công chuẩn ${data?.standardDays ?? "—"} ngày`, schoolName, data ? `${data.total ?? 0} nhân sự` : ""].filter(Boolean).join(" · ");
  const teamOptions = [{ label: "Tất cả tổ", value: "" }, ...teams.map((value) => ({ label: teamLabel(value), value }))];

  return (
    <Box sx={{ display: "grid", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader
        description={description}
        primaryAction={
          <>
            <ErgButton disabled={!schoolId} onClick={() => void exportTimesheet(schoolId, period)} startIcon={<FileDownloadOutlinedIcon />} variant="outlined">Xuất cho tính lương</ErgButton>
            {data?.stage ? <PeriodLockAction period={period} schoolId={schoolId} stage={data.stage} /> : null}
          </>
        }
        title={`Bảng công tháng ${period.slice(5)}/${period.slice(0, 4)}`}
      />
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <SchoolFilter onChange={(next) => { setTeams([]); setTeam(""); reset(); update({ schoolId: next }); }} schools={schools.data ?? []} value={schoolId} />
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
          <ErgIconButton label="Tháng trước" onClick={() => { reset(); update({ period: shiftPeriod(period, -1) }); }}><ChevronLeftIcon /></ErgIconButton>
          <Typography component="span" sx={{ minWidth: 112, textAlign: "center" }} variant="subtitle2">{monthLabel(period)}</Typography>
          <ErgIconButton disabled={period >= currentPeriod} label="Tháng sau" onClick={() => { reset(); update({ period: shiftPeriod(period, 1) }); }}><ChevronRightIcon /></ErgIconButton>
        </Box>
        <ErgSelect label="Tổ" onChange={(event) => { setTeam(event.target.value); reset(); }} options={teamOptions} size="small" sx={{ width: { xs: "100%", sm: 160 } }} value={team} />
        <ErgSearchField onChange={(event) => { setQ(event.target.value); reset(); }} placeholder="Tìm nhân sự" slotProps={{ htmlInput: { "aria-label": "Tìm nhân sự" } }} sx={{ width: { xs: "100%", sm: 240 } }} value={q} />
      </Box>
      {data?.stage ? <PeriodStageStepper issues={data.issues} reviewUntil={data.reviewUntil} stage={data.stage} /> : null}
      <SymbolLegend />
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được bảng công." title="Có lỗi xảy ra" />
      ) : !schoolId || isLoading || !data ? (
        <ErgSkeleton height={360} />
      ) : rows.length === 0 ? (
        <ErgEmptyState description="Thử đổi tổ hoặc từ khoá tìm kiếm." title="Không có nhân sự phù hợp" />
      ) : (
        <TimesheetGrid
          footer={
            <TablePagination
              component="div"
              count={data.total ?? 0}
              labelDisplayedRows={({ count, from, to }) => `${from}–${to} / ${count}`}
              labelRowsPerPage="Số dòng"
              onPageChange={(_, next) => setPage(next)}
              onRowsPerPageChange={(event) => { setSize(Number(event.target.value)); reset(); }}
              page={page}
              rowsPerPage={size}
              rowsPerPageOptions={[25, 50, 100]}
            />
          }
          period={period}
          rows={rows}
        />
      )}
    </Box>
  );
}
