import { useCallback } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import GlobalStyles from "@mui/material/GlobalStyles";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { exportSheets, overviewFileName, overviewSheets } from "@/features/teaching-calendar/domain/schedule-excel";
import { toggleSchool } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, weekRangeLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { OverviewFilterBar, teacherLegend, type QuickChip } from "./overview-filter-bar";
import { OverviewSchoolGrid } from "./overview-school-grid";
import { OverviewSchoolPicker } from "./overview-school-picker";
import { OverviewTeacherPanel } from "./overview-teacher-panel";
import { ink, tone, type } from "./overview-styles";
import { useOverviewData } from "./use-overview-data";
import { useOverviewParams } from "./use-overview-params";

const PRINT_CSS = {
  "@media print": {
    ".erg-print-hide": { display: "none !important" },
    '[data-testid="erg-portal-shell"]': { display: "block !important", height: "auto !important", overflow: "visible !important", width: "auto !important" },
    '[data-testid="erg-portal-shell"] > :not([data-testid="erg-portal-main"])': { display: "none !important" },
    '[data-testid="erg-portal-main"] *': { overflow: "visible !important" },
  },
};

const stepSx = { ...type(18), borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: ink.textSecondary, height: 36, width: 36 } as const;
const tabSx = (on: boolean) => ({ ...type(13, on ? 600 : 400), alignItems: "center", bgcolor: on ? ink.primarySofter : undefined, borderRadius: "7px", color: on ? tone.published.text : ink.textSecondary, display: "inline-flex", height: 30, px: "12px" }) as const;

/** Bảng tổng thời khoá biểu (board AdminOverview / AdminOverviewTeacher): một trang hai tab, URL giữ tab/week/schools/q/quick. */
export function OverviewPage() {
  const params = useOverviewParams();
  const data = useOverviewData(params);
  const { quick, tab, update, week } = params;
  const onSearch = useCallback((q: string) => update({ q }), [update]);
  const onQuick = useCallback((key: string) => update({ quick: key }), [update]);
  const counts = data.teachers.data?.quickCounts;
  const chips: QuickChip[] = [
    { count: counts?.conflicts ?? 0, key: "CONFLICT", label: "Có xung đột", tone: "clash" },
    { count: counts?.travel ?? 0, key: "TRAVEL", label: "Không kịp di chuyển", tone: "clash" },
    { count: counts?.multiSchool ?? 0, key: "MULTI_SCHOOL", label: "Chạy 2 trường/buổi", tone: "warn" },
    { count: counts?.overload ?? 0, key: "OVERLOAD", label: `Quá ${data.loadSettings?.loadWarn ?? 18} tiết`, tone: "neutral" },
    { count: counts?.empty ?? 0, key: "EMPTY", label: "Chưa có tiết", tone: "neutral" },
  ];
  const requiredMinutes = data.teachers.data?.items.flatMap((row) => row.days.map((day) => day.travel?.requiredMinutes ?? 0)).find((minutes) => minutes > 0) ?? 50;
  const step = (direction: 1 | -1) => update({ week: addDaysToDate(week, direction * 7) });
  const failed = tab === "schools" ? data.schools.query.error ?? data.grid.error : data.teachers.error;
  const retry = () => { if (tab === "teachers") void data.teachers.refetch(); else { void data.schools.query.refetch(); if (data.selected.length) void data.grid.refetch(); } };
  const gridSchools = data.grid.data?.schools ?? [];
  const selectedRows = data.selected.flatMap((id) => { const row = gridSchools.find((school) => school.schoolId === id) ?? data.schools.items.find((school) => school.schoolId === id); return row ? [row] : []; });
  const onToggle = (id: string) => { const next = toggleSchool(data.selected, id); if (next.join() !== data.selected.join()) update({ schools: next }); };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", mt: "-4px" }}>
      <GlobalStyles styles={PRINT_CSS} />
      <Box component="header" sx={{ alignItems: "flex-end", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
        <Box>
          <Link className="erg-print-hide" href={adminPath("/calendar")} sx={{ ...type(13) }} underline="none">← Lịch giảng dạy</Link>
          <Typography component="h1" sx={{ m: "4px 0 0" }} variant="h1">Bảng tổng thời khoá biểu</Typography>
        </Box>
        <Box className="erg-print-hide" sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <ButtonBase aria-label="Tuần trước" onClick={() => step(-1)} sx={stepSx}>‹</ButtonBase>
          <Typography component="span" sx={type(16, 500)}>{weekRangeLabel(week, "overview")}</Typography>
          <ButtonBase aria-label="Tuần sau" onClick={() => step(1)} sx={stepSx}>›</ButtonBase>
          <Box aria-label={tab === "schools" ? "Nhóm hàng" : "Nhóm cột"} role="tablist" sx={{ bgcolor: ink.surface, border: `1px solid ${ink.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, display: "flex", ml: 1, p: "3px" }}>
            <ButtonBase aria-selected={tab === "schools"} onClick={() => update({ tab: "schools" })} role="tab" sx={tabSx(tab === "schools")}>Theo trường</ButtonBase>
            <ButtonBase aria-selected={tab === "teachers"} onClick={() => update({ tab: "teachers" })} role="tab" sx={tabSx(tab === "teachers")}>Theo giáo viên</ButtonBase>
          </Box>
          <ErgButton onClick={() => window.print()} sx={{ ...type(14), borderColor: ink.border, height: 36, minHeight: 36, minWidth: 0, px: "14px" }} variant="outlined">In</ErgButton>
          {tab === "schools" ? (
            <ErgButton
              disabled={!data.grid.data?.schools.length} onClick={() => { const grid = data.grid.data; if (grid) void exportSheets(() => overviewSheets(grid), overviewFileName(grid.weekStart)); }}
              sx={{ height: 36, minHeight: 36, minWidth: 0, px: 2 }} variant="contained"
            >
              Xuất Excel
            </ErgButton>
          ) : null}
        </Box>
      </Box>
      {tab === "teachers" ? (
        <OverviewFilterBar
          chips={chips} legend={teacherLegend(requiredMinutes)} onQuick={onQuick} onSearch={onSearch}
          placeholder="Tìm giáo viên…" quick={quick} search={params.q}
        />
      ) : (
        <OverviewSchoolPicker
          hasMore={data.schools.hasMore} loadMore={data.schools.fetchNext} onSearch={onSearch} onToggle={onToggle}
          rows={data.schools.items} search={params.q} selected={data.selected} selectedRows={selectedRows} total={data.schools.total}
        />
      )}
      {data.slotDialog}
      {failed ? <ErgErrorState action={<ErgButton onClick={retry} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." /> : tab === "teachers" ? (
        <OverviewTeacherPanel data={data} params={params} requiredMinutes={requiredMinutes} />
      ) : data.schools.query.isPending || (data.selected.length > 0 && data.grid.isPending) ? <ContentPendingSkeleton />
        : !data.schools.items.length ? <ErgEmptyState title="Không có trường nào khớp bộ lọc" />
          : data.grid.data ? (
            <OverviewSchoolGrid
              eventsById={data.eventsById} grid={data.grid.data}
              onOpen={(chip, schoolId, intent) => data.openSchedule(chip.cell.eventId ? data.eventsById.get(chip.cell.eventId) : undefined, { date: addDaysToDate(week, chip.weekday - 1), intent, periodNo: chip.firstPeriod, schoolId })}
            />
          ) : null}
    </Box>
  );
}
