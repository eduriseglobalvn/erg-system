import { useCallback } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ergChipTabsSx } from "@/components/erg-mui/erg-tabs";
import { exportSheets, overviewFileName, overviewSheets } from "@/features/teaching-calendar/domain/schedule-excel";
import { toggleSchool } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate, weekRangeLabel } from "@/features/teaching-calendar/domain/schedule-copy";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { OverviewFilterBar, type QuickChip } from "./overview-filter-bar";
import { OverviewSchoolAside } from "./overview-school-aside";
import { OverviewSchoolGrid } from "./overview-school-grid";
import { OverviewTeacherPanel } from "./overview-teacher-panel";
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

/** Bảng tổng thời khoá biểu (6.6, 6.7): một trang hai tab, một thanh lọc dùng chung, URL giữ tab/week/schools/q/quick. */
export function OverviewPage() {
  const params = useOverviewParams();
  const data = useOverviewData(params);
  const { quick, tab, update, week } = params;
  const onSearch = useCallback((q: string) => update({ q }), [update]);
  const onQuick = useCallback((key: string) => update({ quick: key }), [update]);
  const quickCounts = data.schools.quickCounts;
  const counts = data.teachers.data?.quickCounts;
  const chips: QuickChip[] = tab === "schools"
    ? [
      { count: quickCounts?.conflicts ?? 0, key: "CONFLICT", label: "Có xung đột", tone: "clash" },
      { count: quickCounts?.travel ?? 0, key: "TRAVEL", label: "Không kịp di chuyển", tone: "clash" },
      { count: quickCounts?.drafts ?? 0, key: "DRAFT", label: "Có nháp", tone: "neutral" },
      { count: quickCounts?.empty ?? 0, key: "EMPTY", label: "Chưa có lịch", tone: "neutral" },
    ]
    : [
      { count: counts?.conflicts ?? 0, key: "CONFLICT", label: "Có xung đột", tone: "clash" },
      { count: counts?.travel ?? 0, key: "TRAVEL", label: "Không kịp di chuyển", tone: "clash" },
      { count: counts?.multiSchool ?? 0, key: "MULTI_SCHOOL", label: "Chạy 2 trường/buổi", tone: "warn" },
      { count: counts?.overload ?? 0, key: "OVERLOAD", label: `Quá ${data.loadSettings?.loadWarn ?? 18} tiết`, tone: "warn" },
      { count: counts?.empty ?? 0, key: "EMPTY", label: "Chưa có tiết", tone: "neutral" },
    ];
  const step = (direction: 1 | -1) => update({ week: addDaysToDate(week, direction * 7) });
  const failed = tab === "schools" ? data.schools.query.error ?? data.grid.error : data.teachers.error;
  const retry = () => { void data.schools.query.refetch(); void data.grid.refetch(); void data.teachers.refetch(); };
  const openCell = (eventId: string | null | undefined, schoolId: string, weekday: number, periodNo: number) =>
    data.openSchedule(eventId ? data.eventsById.get(eventId) : undefined, { date: addDaysToDate(week, weekday - 1), periodNo, schoolId });

  return (
    <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <GlobalStyles styles={PRINT_CSS} />
      <Link className="erg-print-hide" href={adminPath("/calendar")} sx={{ typography: "body2" }} underline="hover">← Lịch giảng dạy</Link>
      <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between" }}>
        <Typography component="h1" variant="h1">Bảng tổng thời khoá biểu</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ErgIconButton className="erg-print-hide" label="Tuần trước" onClick={() => step(-1)}><ChevronLeftIcon /></ErgIconButton>
          <Typography sx={{ typography: "subtitle2" }}>{weekRangeLabel(week, "overview")}</Typography>
          <ErgIconButton className="erg-print-hide" label="Tuần sau" onClick={() => step(1)}><ChevronRightIcon /></ErgIconButton>
        </Stack>
      </Stack>
      <Stack className="erg-print-hide" direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Tabs onChange={(_event, value: "schools" | "teachers") => update({ tab: value })} sx={ergChipTabsSx} value={tab}>
          <Tab label="Theo trường" value="schools" />
          <Tab label="Theo giáo viên" value="teachers" />
        </Tabs>
        <Stack direction="row" spacing={1}>
          <ErgButton onClick={() => window.print()} variant="outlined">In</ErgButton>
          {tab === "schools" ? (
            <ErgButton
              disabled={!data.grid.data?.schools.length} onClick={() => { const grid = data.grid.data; if (grid) void exportSheets(() => overviewSheets(grid), overviewFileName(grid.weekStart)); }}
              variant="contained"
            >
              Xuất Excel
            </ErgButton>
          ) : null}
        </Stack>
      </Stack>
      <OverviewFilterBar
        chips={chips} legend={tab === "schools" ? ["published", "draft", "clash", "travel", "off"] : ["published", "draft", "clash", "travel", "off", "assistant"]}
        legendLabels={tab === "schools" ? { draft: "Nháp (chưa xuất bản)" } : undefined}
        onQuick={onQuick} onSearch={onSearch} placeholder={tab === "schools" ? "Tìm trường, lớp, giáo viên…" : "Tìm giáo viên…"} quick={quick} search={params.q}
      />
      {failed ? <ErgErrorState action={<ErgButton onClick={retry} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." /> : tab === "teachers" ? (
        <OverviewTeacherPanel data={data} params={params} />
      ) : (
        <Stack direction={{ md: "row", xs: "column" }} spacing={2} sx={{ alignItems: "flex-start" }}>
          <OverviewSchoolAside
            hasMore={data.schools.hasMore} loadMore={data.schools.fetchNext} onToggle={(id) => { const next = toggleSchool(data.selected, id); if (next.join() !== data.selected.join()) update({ schools: next }); }}
            schools={data.schools.items} selected={data.selected} total={data.schools.total}
          />
          <Stack sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            {data.schools.query.isPending || (data.selected.length > 0 && data.grid.isPending) ? <ContentPendingSkeleton />
              : !data.schools.items.length ? <ErgEmptyState title="Không có trường nào khớp bộ lọc" />
                : data.grid.data ? <OverviewSchoolGrid grid={data.grid.data} onOpenCell={(cell, schoolId, weekday, periodNo) => openCell(cell?.eventId, schoolId, weekday, periodNo)} /> : null}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
