import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgMetricStrip } from "@/components/erg-mui/erg-metric-card";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { useTimekeepingSchools } from "@/features/timekeeping/api/timekeeping-admin-query";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { PanelState } from "../components/class-log-ui";
import { WeekStepper } from "../components/class-log-toolbar";
import { addDays, currentWeekStart, weekRangeLabel } from "../domain/class-log-week";
import { exportLessonReportExcel } from "./lesson-report-excel";
import { LessonReportDetailPanel } from "./lesson-report-detail-panel";
import { LessonReportGrid, type CellPick } from "./lesson-report-grid";
import type { LessonReportRow } from "./lesson-report-api";
import { remindLabel, remindTargets, reportText, summarize, weekTitle } from "./lesson-report-model";
import { useLessonReportMatrix, useRemindTeachers } from "./lesson-report-query";

/** «Theo dõi báo giảng» (6.11): teacher × day matrix of the class log, kpis, the cell panel and the reminders. */
export function LessonReportMatrixPage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [schoolId, setSchoolId] = useState("");
  const [picked, setPicked] = useState<CellPick | null>(null);
  const schools = useTimekeepingSchools();
  const query = useLessonReportMatrix(weekStart, schoolId);
  const remind = useRemindTeachers();
  const matrix = query.data;
  const rows = useMemo(() => matrix?.rows ?? [], [matrix]);
  const sum = useMemo(() => summarize(rows), [rows]);
  const targets = remindTargets(rows);
  const row = rows.find((r) => r.teacherId === picked?.teacherId);
  const openTimesheet = (r: LessonReportRow, date: string) =>
    void navigate({ href: adminPath(`/employees/teaching-hours?sheet=${date.slice(0, 7)}&year=${date.slice(0, 4)}&teacherId=${r.teacherId}&month=${date.slice(0, 7)}`) });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ "& > div": { mb: 0 } }}>
        <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="caption">Đào tạo › Báo giảng</Typography>
        <ErgPageHeader
          primaryAction={(
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
              <ErgButton disabled={!matrix || rows.length === 0} onClick={() => matrix && void exportLessonReportExcel(matrix, rows)} variant="outlined">Xuất Excel</ErgButton>
              <ErgButton disabled={targets.length === 0} loading={remind.isPending} onClick={() => remind.mutate(targets)} variant="contained">{remindLabel(targets.length)}</ErgButton>
            </Box>
          )}
          title={`${reportText.title}${matrix ? ` · ${weekTitle(matrix.days)}` : ""}`}
        />
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <WeekStepper onStep={(d) => { setWeekStart(addDays(weekStart, d * 7)); setPicked(null); }} rangeLabel={weekRangeLabel(weekStart, 6)} />
        <ErgSelect
          label="Trường"
          onChange={(e) => { setSchoolId(e.target.value); setPicked(null); }}
          options={[{ label: "Tất cả", value: "" }, ...(schools.data ?? []).map((s) => ({ label: s.name, value: s.id }))]}
          size="small"
          sx={{ width: { xs: "100%", sm: 240 } }}
          value={schoolId}
        />
      </Box>
      <PanelState isError={query.isError} isPending={query.isPending} onRetry={() => void query.refetch()}>
        {matrix ? (
          <>
            <ErgMetricStrip
              items={[
                { label: "Buổi dạy tuần này", value: sum.periods, hint: `${sum.teachers} giáo viên · ${sum.schools} trường` },
                { label: "Đúng hạn", value: `${sum.onTimePercent}%`, hint: `${sum.onTime} / ${sum.periods} buổi` },
                { label: "Báo muộn", value: sum.late, hint: `${sum.lateTeachers} giáo viên` },
                { label: "Chưa báo", value: sum.missing, hint: `${sum.missingTeachers} giáo viên` },
              ]}
            />
            {rows.length === 0 ? (
              <ErgEmptyState title={reportText.empty} />
            ) : (
              <Box sx={{ alignItems: "flex-start", display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 1.75 }}>
                <LessonReportGrid matrix={matrix} onPick={setPicked} picked={picked} rows={rows} />
                <LessonReportDetailPanel date={picked?.date} now={new Date()} onOpenTimesheet={openTimesheet} onRemind={(id) => remind.mutate([id])} reminding={remind.isPending} row={row} />
              </Box>
            )}
          </>
        ) : null}
      </PanelState>
      <Typography sx={{ color: t.color.textMuted, fontSize: t.type.label.fontSize }}>Hạn báo giảng là 23:59 của ngày dạy; mỗi giáo viên chỉ nhận một lời nhắc mỗi ngày.</Typography>
    </Box>
  );
}
