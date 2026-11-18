import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";

import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgMetricStrip } from "@/components/erg-mui/erg-metric-card";
import type { AssignmentRun, ClassroomSnapshot } from "@/domain/school/classroom-types";
import { TodayLessonsPanel } from "@/features/lms/components/lms-home-today-lessons";
import { knownStudentCount } from "@/features/lms/components/lms-teacher-shell-utils";
import { LmsHomeMobile } from "@/features/lms/components/lms-home-mobile";
import { TeacherPageFrame } from "@/features/lms/components/teacher-page-frame";
import { weekdayDateVi } from "@/features/timekeeping/components/punch/punch-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { radius } = ergEnterpriseTokens;

export function LmsHomeDashboard({
  canPunch = false,
  classes = [],
  mobile = false,
  runs,
  selectedClass,
  selectedSchoolName,
  teacherName,
  unreadNotificationCount,
  onAssign,
  onClassChange,
  onNavigate,
  onOpenClassLog,
  onOpenHomework,
  onOpenNotifications,
  onOpenProgress,
  onOpenSchedule,
  onOpenTimekeeping,
}: {
  canPunch?: boolean;
  classes?: ClassroomSnapshot[];
  /** Phone layout (design N1); the desktop grid below is unchanged. */
  mobile?: boolean;
  runs: AssignmentRun[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
  unreadNotificationCount: number;
  onAssign: () => void;
  onClassChange?: (classId: string) => void;
  onNavigate?: (href: string) => void;
  onOpenClassLog?: () => void;
  onOpenHomework: () => void;
  onOpenNotifications?: () => void;
  onOpenProgress?: () => void;
  onOpenSchedule: () => void;
  onOpenTimekeeping?: () => void;
}) {
  const [classMenuAnchor, setClassMenuAnchor] = useState<HTMLElement | null>(null);
  const activeRuns = runs.slice(0, 3);
  const completionAverage = activeRuns.length
    ? Math.round(activeRuns.reduce((sum, run) => sum + run.completionRate, 0) / activeRuns.length)
    : null;
  const supportCount = selectedClass?.riskStudents ?? activeRuns.reduce((sum, run) => sum + run.needsReviewCount, 0);
  const today = weekdayDateVi(new Date());

  if (mobile && onNavigate) {
    return (
      <LmsHomeMobile
        canPunch={canPunch}
        runsOpen={runs.length}
        supportCount={supportCount}
        teacherName={teacherName}
        onAssign={onAssign}
        onNavigate={onNavigate}
        onOpenClassLog={onOpenClassLog ?? onOpenSchedule}
        onOpenHomework={onOpenHomework}
        onOpenProgress={onOpenProgress ?? onOpenHomework}
        onOpenSchedule={onOpenSchedule}
        onOpenTimekeeping={onOpenTimekeeping ?? onOpenSchedule}
      />
    );
  }

  const classLabel = selectedClass?.className;
  const scope = [today, selectedSchoolName, classLabel ?? "Chưa chọn lớp", knownStudentCount(selectedClass) === undefined ? "" : `${knownStudentCount(selectedClass)} học sinh`].filter(Boolean).join(" · ");

  return (
    <TeacherPageFrame
      actions={
        <>
          {!selectedClass && onClassChange ? (
            <>
              <Button disabled={classes.length === 0} onClick={(event) => setClassMenuAnchor(event.currentTarget)} variant="outlined">
                Chọn lớp
              </Button>
              <Menu anchorEl={classMenuAnchor} open={Boolean(classMenuAnchor)} onClose={() => setClassMenuAnchor(null)}>
                {classes.map((classroom) => (
                  <MenuItem
                    key={classroom.id}
                    onClick={() => {
                      setClassMenuAnchor(null);
                      onClassChange(classroom.id);
                    }}
                    sx={{ minHeight: 44 }}
                  >
                    {classroom.className}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : null}
          <Button onClick={onOpenSchedule} variant="outlined">Xem lịch dạy</Button>
          <Button onClick={onAssign} variant="contained">Giao bài</Button>
        </>
      }
      description={scope}
      title={classLabel ? `Hôm nay của lớp ${classLabel}` : "Hôm nay"}
    >
      <TodayLessonsPanel noSchool={!selectedSchoolName} onOpenSchedule={onOpenSchedule} />

      <ErgMetricStrip
        items={[
          { label: "Bài đang mở", onClick: onOpenHomework, value: runs.length },
          { label: "Hoàn thành trung bình", onClick: onOpenProgress ?? onOpenHomework, value: completionAverage === null ? null : `${completionAverage}%` },
          { label: "Học sinh cần hỗ trợ", onClick: onOpenProgress ?? onOpenHomework, value: supportCount },
          { label: "Tin chưa đọc", onClick: onOpenNotifications, value: unreadNotificationCount },
        ]}
      />

      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, minWidth: 0 }}>
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: 2.5, py: 1.5 }}>
          <Typography component="h2" variant="subtitle1">Bài đang mở</Typography>
          <Button onClick={onOpenHomework} size="small" variant="text">Xem tất cả</Button>
        </Box>
        {activeRuns.length === 0 ? (
          <Box sx={{ pb: 2.5, px: 2.5 }}>
            <ErgEmptyState
              action={<Button onClick={onAssign} variant="outlined">Giao bài</Button>}
              description="Giao bài cho lớp để theo dõi tiến độ nộp bài tại đây."
              icon={<AssignmentRoundedIcon />}
              title={classLabel ? `Lớp ${classLabel} chưa có bài đang mở` : "Chưa có bài đang mở"}
            />
          </Box>
        ) : (
          activeRuns.map((run) => (
            <Box key={run.id} sx={{ alignItems: "center", borderTop: 1, borderTopColor: "divider", display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr) 160px 48px", px: 2.5, py: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap variant="subtitle2">{run.title}</Typography>
                <Typography color="text.secondary" component="div" noWrap variant="caption">
                  {[run.subjectLabel, run.dueLabel, run.needsReviewCount ? `${run.needsReviewCount} cần xem` : ""].filter(Boolean).join(" · ")}
                </Typography>
              </Box>
              <Box aria-hidden sx={{ bgcolor: "action.hover", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <Box sx={{ bgcolor: run.completionRate >= 100 ? "success.main" : "primary.main", height: "100%", width: `${run.completionRate}%` }} />
              </Box>
              <Typography color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }} variant="caption">
                {run.completionRate}%
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </TeacherPageFrame>
  );
}
