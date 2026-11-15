import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { todayInput } from "@/domain/formatters/format-date";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { useTimekeepingSchools } from "../../api/timekeeping-admin-query";
import { monthLabel } from "../../components/my-timesheet/timesheet-summary";
import { timekeepingTeachingApi } from "../../api/timekeeping-teaching-api";
import { useTeachingMonthSheet, useTeachingPeriods } from "../api/teaching-hours-query";
import { exportTeachingExcel } from "../domain/teaching-excel";
import { monthRange, yearMonths, yearRange } from "../domain/teaching-model";
import { MonthCloseCard } from "./month-close-card";
import { MonthSheet } from "./month-sheet";
import { TotalSheet } from "./total-sheet";
import { useTeachingSearch } from "./use-teaching-search";

/** Closing a month is `timekeeping.manage` (HR); the page itself is `timekeeping.approve`. */
function canCloseMonth(): boolean {
  if (AUTH_BYPASS_ENABLED) return true;
  const session = getAuthScope("lcms").session;
  return evaluatePermission({ permission: "timekeeping.manage", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
}

const noPrint = { "@media print": { display: "none" } } as const;

/** «Công tiết dạy» (6.1 Total, 6.2 month sheet): one page, sheet tabs at the bottom, `?sheet=total|yyyy-MM`. */
export function TeachingHoursPage() {
  const { search, update } = useTeachingSearch();
  const today = todayInput();
  const schools = useTimekeepingSchools();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const isTotal = search.sheet === "total";
  const months = yearMonths(search.year, today);
  const range = search.month ? monthRange(search.month) : yearRange(search.year);
  const periods = useTeachingPeriods({ role: search.role, ...range, schoolId: search.schoolId, teacherId: search.teacherId, q: debouncedQ || undefined, page }, isTotal);
  const month = useTeachingMonthSheet(isTotal ? "" : search.sheet, search.role, !isTotal);
  // Teacher options come from the latest month sheet of the year (no separate teacher list endpoint).
  const roster = useTeachingMonthSheet(months.at(-1) ?? "", search.role, isTotal && months.length > 0);
  const teachers = [...new Map((roster.data?.rows ?? []).filter((r) => r.teacherId).map((r) => [r.teacherId as string, r.teacherName ?? ""])).entries()];
  const active = isTotal ? periods : month;
  const years = [Number(today.slice(0, 4)) - 1, Number(today.slice(0, 4))].filter((y) => y >= 2025);

  const [exporting, setExporting] = useState(false);
  const runExport = async () => {
    setExporting(true);
    await exportTeachingExcel(() => timekeepingTeachingApi.adminExport(search.year), search.year);
    setExporting(false);
  };
  const change = (patch: Parameters<typeof update>[0]) => { setPage(0); update(patch); };
  const title = isTotal ? (search.role === "ASSISTANT" ? "Bảng chi tiết TKB trợ giảng" : "Bảng chi tiết TKB giáo viên") : `Thống kê số tiết · ${monthLabel(search.sheet)}`;
  const description = isTotal
    ? "Mỗi dòng là 1 tiết đã dạy, tự lấy từ lịch dạy. Cột «Nội dung giảng dạy» lấy từ sổ đầu bài: bài tra KCT theo tiết thực tế GV ghi."
    : "Số tiết mỗi tuần cộng từ bảng Total. Giáo viên xem và bấm xác nhận thay cho ký giấy.";

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr)", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ "& > div": { mb: 0 } }}>
        <Typography color="text.secondary" sx={{ mb: 0.5, ...noPrint }} variant="caption">Chấm công / Công tiết dạy</Typography>
        <ErgPageHeader
          description={description}
          primaryAction={(
            <Box sx={{ display: "flex", gap: 1, ...noPrint }}>
              <ErgButton onClick={() => window.print()} variant="outlined">{isTotal ? "In" : "In bảng ký"}</ErgButton>
              <ErgButton loading={exporting} onClick={() => void runExport()} variant="contained">Xuất Excel (Total + từng tháng)</ErgButton>
            </Box>
          )}
          title={title}
        />
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5, ...noPrint }}>
        <ToggleButtonGroup aria-label="Vai trò" exclusive onChange={(_, role) => role && change({ role })} size="small" value={search.role}>
          <ToggleButton value="MAIN">Giáo viên chính</ToggleButton>
          <ToggleButton value="ASSISTANT">Trợ giảng</ToggleButton>
        </ToggleButtonGroup>
        {isTotal ? (
          <>
            <ErgSearchField onChange={(event) => { setQ(event.target.value); setPage(0); }} placeholder="Tìm lớp, nội dung…" slotProps={{ htmlInput: { "aria-label": "Tìm lớp, nội dung" } }} sx={{ width: { xs: "100%", sm: 240 } }} value={q} />
            <ErgSelect label="Năm" onChange={(event) => change({ year: Number(event.target.value), month: undefined })} options={years.map((y) => ({ label: String(y), value: y }))} size="small" sx={{ width: { xs: "100%", sm: 110 } }} value={search.year} />
            <ErgSelect label="Tháng" onChange={(event) => change({ month: event.target.value })} options={[{ label: "Tất cả", value: "" }, ...months.map((m) => ({ label: m.slice(5), value: m }))]} size="small" sx={{ width: { xs: "100%", sm: 120 } }} value={search.month && months.includes(search.month) ? search.month : ""} />
            <ErgSelect label="Trường" onChange={(event) => change({ schoolId: event.target.value })} options={[{ label: "Tất cả", value: "" }, ...(schools.data ?? []).map((s) => ({ label: s.name, value: s.id }))]} size="small" sx={{ width: { xs: "100%", sm: 220 } }} value={search.schoolId ?? ""} />
            <ErgSelect label="Giáo viên" onChange={(event) => change({ teacherId: event.target.value })} options={[{ label: "Tất cả", value: "" }, ...teachers.map(([value, label]) => ({ label, value })), ...(search.teacherId && !teachers.some(([id]) => id === search.teacherId) ? [{ label: "Giáo viên đã chọn", value: search.teacherId }] : [])]} size="small" sx={{ width: { xs: "100%", sm: 220 } }} value={search.teacherId ?? ""} />
            <Typography color="text.secondary" variant="body2">{periods.data ? `${periods.data.rows?.length ?? 0} / ${(periods.data.total ?? 0).toLocaleString("vi-VN")} tiết` : ""}</Typography>
          </>
        ) : null}
      </Box>
      {active.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void active.refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được dữ liệu." title="Có lỗi xảy ra" />
      ) : isTotal && periods.data ? (
        (periods.data.rows ?? []).length === 0 ? <ErgEmptyState description="Thử đổi bộ lọc hoặc từ khoá." title="Không có tiết nào" /> : <TotalSheet data={periods.data} onPage={setPage} role={search.role} />
      ) : !isTotal && month.data ? (
        <>
          <MonthSheet data={month.data} month={search.sheet} onOpenTeacher={(teacherId) => change({ sheet: "total", teacherId, month: search.sheet, year: Number(search.sheet.slice(0, 4)) })} role={search.role} />
          <MonthCloseCard canClose={canCloseMonth()} data={month.data} month={search.sheet} />
        </>
      ) : (
        <ErgSkeleton height={360} />
      )}
      <Box sx={noPrint}>
        <Tabs aria-label="Bảng công tiết dạy" onChange={(_, sheet: string) => change({ sheet })} scrollButtons="auto" value={search.sheet} variant="scrollable">
          <Tab label="Total" value="total" />
          {months.map((m) => <Tab key={m} label={`Tháng ${m.slice(5)}`} value={m} />)}
        </Tabs>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">Total = chi tiết từng tiết · mỗi tháng = bảng thống kê để giáo viên xác nhận</Typography>
      </Box>
    </Box>
  );
}
