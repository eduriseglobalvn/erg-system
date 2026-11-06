import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";

import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import type { AssignmentRun, ClassroomSnapshot } from "@/domain/school/classroom-types";
import { TodayLessonsPanel } from "@/features/lms/components/lms-home-today-lessons";
import { formatDateVi, todayInput } from "@/domain/formatters/format-date";

export function greetingFor(hour: number) {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function LmsHomeDashboard({
  classes = [],
  runs,
  selectedClass,
  selectedSchoolName,
  teacherName,
  unreadNotificationCount,
  onAssign,
  onClassChange,
  onOpenHomework,
  onOpenNotifications,
  onOpenProgress,
  onOpenSchedule,
}: {
  classes?: ClassroomSnapshot[];
  runs: AssignmentRun[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
  unreadNotificationCount: number;
  onAssign: () => void;
  onClassChange?: (classId: string) => void;
  onOpenHomework: () => void;
  onOpenNotifications?: () => void;
  onOpenProgress?: () => void;
  onOpenSchedule: () => void;
}) {
  const [classMenuAnchor, setClassMenuAnchor] = useState<HTMLElement | null>(null);
  const activeRuns = runs.slice(0, 3);
  const completionAverage = activeRuns.length
    ? Math.round(activeRuns.reduce((sum, run) => sum + run.completionRate, 0) / activeRuns.length)
    : null;
  const supportCount = selectedClass?.riskStudents ?? activeRuns.reduce((sum, run) => sum + run.needsReviewCount, 0);
  const today = formatDateVi(todayInput());

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100%", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 1440, mx: "auto" }}>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
          <Box>
            <Typography component="h1" variant="h5">
              {greetingFor(new Date().getHours())}, {teacherName}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
              {today ? `Hôm nay, ${today} · ` : ""}
              {selectedSchoolName} · {selectedClass?.className ?? "Chưa chọn lớp"} · {selectedClass?.studentCount ?? 0} học sinh
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
            {!selectedClass && onClassChange ? (
              <>
                <Button
                  disabled={classes.length === 0}
                  onClick={(event) => setClassMenuAnchor(event.currentTarget)}
                  sx={{ minHeight: 44 }}
                  variant="outlined"
                >
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
            <Button onClick={onOpenSchedule} sx={{ minHeight: 44 }} variant="outlined">
              Xem lịch
            </Button>
            <Button onClick={onAssign} sx={{ minHeight: 44 }} variant="contained">
              Giao bài tập
            </Button>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <HomeMetricCard empty={runs.length === 0} emptyHint="Giao bài đầu tiên" label="Hoạt động đang mở" onClick={onOpenHomework} tone="primary" value={String(runs.length)} />
          <HomeMetricCard empty={completionAverage === null} emptyHint="Chưa có dữ liệu" label="Hoàn thành trung bình" onClick={onOpenProgress ?? onOpenHomework} tone="success" value={completionAverage === null ? "—" : `${completionAverage}%`} />
          <HomeMetricCard empty={supportCount === 0} emptyHint="Chưa có học sinh cần hỗ trợ" label="Cần hỗ trợ" onClick={onOpenProgress ?? onOpenHomework} tone="warning" value={String(supportCount)} />
          <HomeMetricCard empty={unreadNotificationCount === 0} emptyHint="Không có thông báo mới" label="Thông báo mới" onClick={onOpenNotifications} tone="error" value={String(unreadNotificationCount)} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(360px, 0.65fr)" } }}>
          <Panel>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography component="h2" variant="subtitle1">Bài tập cần theo dõi</Typography>
              <Button onClick={onOpenHomework} size="small" sx={{ minHeight: 44 }} variant="text">
                Xem tất cả
              </Button>
            </Box>
            {activeRuns.length === 0 ? (
              <ErgEmptyState
                action={<Button onClick={onAssign} variant="outlined">Giao bài</Button>}
                description="Giao bài cho lớp để theo dõi tiến độ nộp bài tại đây."
                icon={<AssignmentRoundedIcon />}
                title="Chưa có bài tập đang mở"
              />
            ) : (
              <Stack spacing={1}>
                {activeRuns.map((run) => (
                  <Box key={run.id} sx={{ alignItems: { xs: "stretch", sm: "center" }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, display: "grid", gap: { xs: 1, sm: 2 }, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 150px 110px" }, px: 2, py: 1.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap variant="subtitle2">{run.title}</Typography>
                      <Typography color="text.secondary" noWrap variant="caption">{run.subjectLabel} · {run.targetLevel}</Typography>
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="caption">{run.completionRate}% hoàn thành</Typography>
                      <Box sx={{ bgcolor: "action.hover", borderRadius: 4, height: 6, mt: 0.75, overflow: "hidden" }}>
                        <Box sx={{ bgcolor: "success.main", height: "100%", width: `${run.completionRate}%` }} />
                      </Box>
                    </Box>
                    <Typography color={run.needsReviewCount ? "warning.dark" : "text.secondary"} variant="caption" sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      {run.needsReviewCount} cần xem
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Panel>

          <TodayLessonsPanel onOpenSchedule={onOpenSchedule} />
        </Box>
      </Box>
    </Box>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, minWidth: 0, p: 2 }}>{children}</Box>;
}

function HomeMetricCard({ empty, emptyHint, label, onClick, tone, value }: {
  empty: boolean;
  emptyHint: string;
  label: string;
  onClick?: () => void;
  tone: "primary" | "success" | "warning" | "error";
  value: string;
}) {
  return (
    <ButtonBase
      aria-label={`${label}: ${value}`}
      disabled={!onClick}
      onClick={onClick}
      sx={{ alignItems: "flex-start", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, display: "flex", flexDirection: "column", minHeight: 44, p: 2, textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
    >
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography color={`${tone}.dark`} component="span" variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
      {empty ? <Typography color="text.secondary" variant="caption" sx={{ mt: 0.5 }}>{emptyHint}</Typography> : null}
    </ButtonBase>
  );
}
