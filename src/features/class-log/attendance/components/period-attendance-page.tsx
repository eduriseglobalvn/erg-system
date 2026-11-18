import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { inputDateToVi } from "@/domain/formatters/format-date";
import { AttendanceDateField } from "@/features/lms/components/attendance/attendance-date-field";
import { useIsMobile } from "@/hooks/use-mobile";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { attendanceCopy, countLabel, markLabels } from "../attendance-copy";
import { ATTENDANCE_MARKS, periodRangeLabel } from "../attendance-model";
import { usePeriodAttendance } from "../use-period-attendance";
import { LogSidePanel } from "./log-side-panel";
import { PeriodRail } from "./period-rail";
import { MARK_TINT, StudentAttendanceList } from "./student-attendance-list";

const { classLog, color, radius } = ergEnterpriseTokens;
const cardSx = { bgcolor: color.surface, border: `1px solid ${color.border}`, borderRadius: `${radius.card}px`, overflow: "hidden" } as const;

/** /teacher/attendance: attendance by timetable period, saved together with the class-log entry. */
export function PeriodAttendancePage() {
  const m = usePeriodAttendance();
  const isMobile = useIsMobile();
  // 768–1535px: three columns crush the student-name column to 0px (measured at 1280), so the log panel goes under the list, compact and pinned to the bottom so «Lưu» stays in view.
  const midWidth = useMediaQuery(useTheme().breakpoints.down("xl"), { noSsr: true }) && !isMobile;
  const navigate = useNavigate();
  const openLog = () => void navigate({ href: teacherPath("/class-log") });

  const retry = (refetch: () => unknown) => (
    <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Thử lại</ErgButton>} description={attendanceCopy.loadError} title="Lỗi tải" />
  );

  const panel = m.period ? (
    <LogSidePanel
      actualPeriod={m.actualPeriod}
      comment={m.comment}
      compact={isMobile || midWidth}
      curriculumRows={m.curriculumRows}
      draftAt={m.draftAt}
      lessonTitle={m.lessonTitle}
      marks={m.marks}
      onActualPeriod={m.setActualPeriod}
      onComment={m.setComment}
      onOpenLog={openLog}
      onSave={() => void m.save()}
      period={m.period}
      saving={m.saving}
      students={m.students}
    />
  ) : null;

  const counts = (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {ATTENDANCE_MARKS.map((mark) => {
        // Tint only a count that needs attention; a zero stays neutral.
        const tint = m.counts[mark] > 0 && (isMobile || mark !== "absentExcused") ? MARK_TINT[mark] : classLog.neutral;
        return (
        <Box
          key={mark}
          sx={{
            alignItems: "center",
            bgcolor: tint.bg,
            borderRadius: `${radius.chip}px`,
            color: tint.color,
            display: "flex",
            flex: { md: "none", xs: 1 },
            flexDirection: { md: "row", xs: "column" },
            gap: { md: 0.5, xs: 0 },
            justifyContent: "center",
            minHeight: { md: 28, xs: 48 },
            px: 1.25,
          }}
        >
          <Typography component="strong" variant="subtitle2">{m.counts[mark]}</Typography>
          <Typography variant="caption">{isMobile ? markLabels[mark] : countLabel(markLabels[mark])}</Typography>
        </Box>
        );
      })}
    </Box>
  );

  let body;
  if (m.dayQuery.isPending) body = <Box aria-busy="true"><ErgLoadingSkeleton /></Box>;
  else if (m.dayQuery.isError) body = retry(m.dayQuery.refetch);
  else if (!m.group || !m.period) body = <ErgEmptyState description={attendanceCopy.empty} title="Không có tiết trong ngày này" />;
  else {
    const roster = m.rosterQuery.isError ? retry(m.rosterQuery.refetch) : m.rosterQuery.isPending ? <Box aria-busy="true" sx={{ p: 2 }}><ErgLoadingSkeleton rows={4} /></Box> : (
      <StudentAttendanceList
        activeStudentId={m.activeStudentId}
        marks={m.marks}
        onActive={m.setActiveStudentId}
        onKeyDown={m.onKeyDown}
        onMark={m.setMark}
        students={m.visibleStudents}
      />
    );
    body = (
      <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: { xl: "260px minmax(0, 1fr) 340px", md: "240px minmax(0, 1fr)", xs: "minmax(0, 1fr)" } }}>
        <PeriodRail dirty={m.dirty} groups={m.groups} onSelect={m.selectGroup} selectedKey={m.group.key} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
          {isMobile ? counts : null}
          <Box sx={cardSx}>
            <Box sx={{ alignItems: "center", borderBottom: `1px solid ${color.divider}`, display: { md: "flex", xs: "none" }, flexWrap: "wrap", gap: 1, px: 2, py: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{m.group.className} · {periodRangeLabel(m.group.periods)} · {m.group.subjectName}</Typography>
                <Typography color="text.secondary" variant="caption">Sĩ số {m.students.length}</Typography>
              </Box>
              {counts}
            </Box>
            {m.group.periods.length > 1 ? (
              <Box sx={{ borderBottom: `1px solid ${color.divider}`, display: "flex", gap: 1, overflowX: "auto", px: 2, py: 1 }}>
                {m.group.periods.map((item) => (
                  <ErgButton key={item.periodNo} onClick={() => m.selectPeriod(item.periodNo)} sx={{ minHeight: 44 }} variant={item.periodNo === m.period?.periodNo ? "outlined" : "text"}>
                    Tiết {item.periodNo}
                  </ErgButton>
                ))}
              </Box>
            ) : null}
            <Box sx={{ alignItems: "center", borderBottom: `1px solid ${color.divider}`, display: { md: "flex", xs: "none" }, gap: 1, px: 2, py: 1 }}>
              <Box sx={{ flex: 1 }}>
                <ErgSearchField onChange={(event) => m.setSearch(event.target.value)} placeholder="Tìm học sinh…" slotProps={{ htmlInput: { "aria-label": "Tìm học sinh" } }} value={m.search} />
              </Box>
              {m.nextPeriod ? <ErgButton onClick={m.applyToNext} variant="outlined">Áp dụng cho tiết {m.nextPeriod.periodNo}</ErgButton> : null}
              <ErgButton onClick={m.exportExcel} variant="text">Xuất Excel</ErgButton>
            </Box>
            {roster}
            <Box sx={{ alignItems: "center", display: { md: "flex", xs: "none" }, gap: 1, px: 2, py: 1 }}>
              <Typography color="text.secondary" sx={{ flex: 1 }} variant="caption">{m.visibleStudents.length ? `1–${m.visibleStudents.length}` : "0"} / {m.students.length} học sinh</Typography>
              <Typography color="text.secondary" variant="caption">{attendanceCopy.shortcuts}</Typography>
            </Box>
          </Box>
          {isMobile && m.nextPeriod ? <ErgButton onClick={m.applyToNext} variant="outlined">Áp dụng cho tiết {m.nextPeriod.periodNo}</ErgButton> : null}
          {isMobile ? (
            <Box sx={{ ...cardSx, borderRadius: `${radius.shell}px`, boxShadow: ergEnterpriseTokens.shadow.float, p: 1.5 }}>{panel}</Box>
          ) : null}
        </Box>
        {isMobile ? null : midWidth ? (
          <Box sx={{ ...cardSx, borderRadius: `${radius.shell}px`, bottom: 16, boxShadow: ergEnterpriseTokens.shadow.float, gridColumn: { md: 2 }, minWidth: 0, p: 1.5, position: "sticky" }}>{panel}</Box>
        ) : <Box sx={{ minWidth: 0, position: "sticky", top: 16 }}>{panel}</Box>}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: { md: 3, xs: 2 } }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ flex: "1 1 280px" }}>
          <ErgPageHeader
            description={m.group && m.period ? [periodRangeLabel(m.group.periods), inputDateToVi(m.date), m.group.subjectName, `${m.students.length} học sinh`].join(" · ") : attendanceCopy.subtitle}
            title={m.group ? `${attendanceCopy.title} lớp ${m.group.className}` : attendanceCopy.title}
          />
        </Box>
        {m.pendingCount > 0 ? <ErgStatusChip label={`${attendanceCopy.offlinePending} (${m.pendingCount})`} tone="warning" /> : null}
        <AttendanceDateField onChange={m.setDate} value={m.date} />
        <ErgButton onClick={openLog} sx={{ borderColor: ergEnterpriseTokens.color.border, color: "primary.main", display: { md: "inline-flex", xs: "none" }, px: "14px" }} variant="outlined">Xem cả tuần</ErgButton>
      </Box>
      {body}
    </Box>
  );
}
