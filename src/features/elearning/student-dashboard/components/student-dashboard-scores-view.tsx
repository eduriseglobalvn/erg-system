import type { ReactNode } from "react";
import { CheckCircle2, Clock3, GraduationCap } from "lucide-react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack as MuiStack,
  Typography,
} from "@mui/material";

import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

const MUI_PRIMARY = "#0F6CBD";
const MUI_TEXT = "#172033";
const MUI_MUTED = "#667085";
const MUI_BORDER = "rgba(16, 24, 40, 0.1)";
const MUI_DIVIDER = "rgba(16, 24, 40, 0.075)";
const MUI_SURFACE = "#FFFFFF";
const MUI_CARD_SHADOW = "0 1px 2px rgba(16,24,40,0.045), 0 18px 44px rgba(16,24,40,0.055)";

const elevatedCardSx = {
  bgcolor: MUI_SURFACE,
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "14px",
  boxShadow: MUI_CARD_SHADOW,
};

function Stack({
  alignItems,
  justifyContent,
  sx,
  ...props
}: {
  alignItems?: unknown;
  children?: ReactNode;
  direction?: unknown;
  justifyContent?: unknown;
  spacing?: unknown;
  sx?: unknown;
  [key: string]: unknown;
}) {
  const layoutSx = {
    ...(alignItems !== undefined ? { alignItems } : {}),
    ...(justifyContent !== undefined ? { justifyContent } : {}),
  };

  return (
    <MuiStack
      {...(props as Record<string, unknown>)}
      sx={[Object.keys(layoutSx).length ? layoutSx : null, sx].filter(Boolean) as never}
    />
  );
}

export function ScoresView({ assignments, copy }: { assignments: StudentDashboardAssignment[]; copy: DashboardCopy }) {
  const attemptedAssignments = assignments.filter((assignment) => assignment.attempts.length > 0);
  const bestScore = attemptedAssignments.reduce((best, assignment) => Math.max(best, assignment.score ?? 0), 0);
  const totalAttempts = assignments.reduce((total, assignment) => total + assignment.attempts.length, 0);

  return (
    <Stack spacing={2}>
      <ScoresPageHeader description={copy.scoresDescription} icon={<GraduationCap size={20} />} title={copy.scoresTitle} />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <ScoreMetricCard icon={<GraduationCap size={18} />} label={copy.bestScoreLabel} tone="success" value={bestScore} />
        <ScoreMetricCard icon={<CheckCircle2 size={18} />} label={copy.stats.completed} value={attemptedAssignments.length} />
        <ScoreMetricCard icon={<Clock3 size={18} />} label={copy.recentResultsTitle} tone="info" value={totalAttempts} />
      </Box>
      <Card sx={elevatedCardSx}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          sx={{ borderBottom: `1px solid ${MUI_DIVIDER}`, px: { xs: 2, md: 2.5 }, py: 1.8 }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ color: MUI_TEXT, fontWeight: 950 }}>
              {copy.recentResultsTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: MUI_MUTED, mt: 0.25 }}>
              {attemptedAssignments.length}/{assignments.length} bài đã có kết quả, {totalAttempts} lượt làm được ghi nhận.
            </Typography>
          </Box>
        </Stack>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1}>
            {assignments.map((assignment) => (
              <ScoreRow key={assignment.id} assignment={assignment} copy={copy} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function ScoreRow({ assignment, copy }: { assignment: StudentDashboardAssignment; copy: DashboardCopy }) {
  const bestScore = assignment.attempts.reduce((best, attempt) => Math.max(best, attempt.score), assignment.score ?? 0);
  const scorePercent = assignment.maxScore > 0 ? Math.round((bestScore / assignment.maxScore) * 100) : 0;
  const latestAttempts = assignment.attempts.slice(0, 3);

  return (
    <Paper
      sx={{
        bgcolor: "#fff",
        border: `1px solid ${MUI_DIVIDER}`,
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(16,24,40,0.03)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 210px" } }}>
        <Box sx={{ minWidth: 0, p: { xs: 1.45, md: 1.75 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
            <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap", rowGap: 0.65 }}>
              <Chip label={assignment.subjectLabel} size="small" variant="outlined" sx={{ borderRadius: "7px", fontWeight: 850, height: 28 }} />
              <Chip
                label={assignment.attempts.length ? `${assignment.attempts.length} lượt làm` : "Chưa làm"}
                size="small"
                sx={{ bgcolor: "#F0F2F5", borderRadius: "7px", color: MUI_MUTED, fontWeight: 850, height: 28 }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: MUI_MUTED, fontWeight: 750 }}>
              {assignment.teacherName}
            </Typography>
          </Stack>

          <Typography variant="subtitle2" sx={{ color: MUI_TEXT, fontWeight: 950, lineHeight: 1.35, mt: 1 }}>
            {assignment.title}
          </Typography>

          <Box sx={{ mt: 1.45 }}>
            <Typography variant="caption" sx={{ color: MUI_MUTED, display: "block", fontWeight: 850, mb: 0.65, textTransform: "uppercase" }}>
              3 kết quả gần nhất
            </Typography>
            {latestAttempts.length ? (
              <Box sx={{ border: `1px solid ${MUI_DIVIDER}`, borderRadius: "10px", overflow: "hidden" }}>
                {latestAttempts.map((attempt, index) => (
                  <Box
                    key={attempt.id}
                    sx={{
                      alignItems: "center",
                      bgcolor: index % 2 ? "#fff" : "#F8FAFC",
                      borderTop: index ? `1px solid ${MUI_DIVIDER}` : "none",
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: { xs: "1fr", sm: "150px minmax(0, 1fr) 72px" },
                      px: 1.15,
                      py: 0.85,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: MUI_TEXT, fontWeight: 850 }}>
                      {attempt.completedAtLabel}
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUI_MUTED }}>
                      {copy.attemptDurationLabel}: {attempt.durationLabel}
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUI_PRIMARY, fontWeight: 950, textAlign: { sm: "right" } }}>
                      {copy.scoreBadge(attempt.score, attempt.maxScore)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ bgcolor: "#F8FAFC", border: `1px dashed ${MUI_BORDER}`, borderRadius: "10px", px: 1.25, py: 1 }}>
                <Typography variant="body2" sx={{ color: MUI_MUTED }}>
                  {copy.noRecentResults}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            alignSelf: "stretch",
            bgcolor: "#F8FAFC",
            borderLeft: { md: `1px solid ${MUI_DIVIDER}` },
            borderTop: { xs: `1px solid ${MUI_DIVIDER}`, md: "none" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: { xs: 1.45, md: 1.7 },
          }}
        >
          <Typography variant="caption" sx={{ color: MUI_MUTED, fontWeight: 850, textTransform: "uppercase" }}>
            {copy.bestScoreLabel}
          </Typography>
          <Typography variant="h4" sx={{ color: MUI_TEXT, fontWeight: 950, lineHeight: 1.1, mt: 0.55 }}>
            {copy.scoreBadge(bestScore, assignment.maxScore)}
          </Typography>
          <LinearProgress
            value={scorePercent}
            variant="determinate"
            sx={{
              bgcolor: "rgba(15,108,189,0.1)",
              borderRadius: 99,
              height: 8,
              mt: 1.2,
              "& .MuiLinearProgress-bar": { bgcolor: MUI_PRIMARY, borderRadius: 99 },
            }}
          />
          <Typography variant="caption" sx={{ color: MUI_MUTED, display: "block", fontWeight: 850, mt: 0.75 }}>
            {scorePercent}% hoàn thành
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function ScoresPageHeader({ description, icon, title }: { description: string; icon: ReactNode; title: string }) {
  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ py: 2.6 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              bgcolor: "rgba(15,108,189,0.08)",
              border: "1px solid rgba(15,108,189,0.14)",
              borderRadius: 2.5,
              color: MUI_PRIMARY,
              display: "grid",
              height: 48,
              placeItems: "center",
              width: 48,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ color: MUI_TEXT, fontWeight: 900, lineHeight: 1.15 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: MUI_MUTED, mt: 0.35 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ScoreMetricCard({
  icon,
  label,
  tone = "primary",
  value,
}: {
  icon?: ReactNode;
  label: string;
  tone?: "primary" | "success" | "error" | "info";
  value: ReactNode;
}) {
  const colors = {
    error: "#FF5630",
    info: "#00B8D9",
    primary: MUI_PRIMARY,
    success: "#22C55E",
  };
  const color = colors[tone];

  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="caption" sx={{ color: MUI_MUTED, fontWeight: 800, textTransform: "uppercase" }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.75, color: MUI_TEXT, fontWeight: 800 }}>
              {value}
            </Typography>
          </Box>
          {icon ? (
            <Box
              sx={{
                bgcolor: `${color}1F`,
                border: `1px solid ${color}24`,
                borderRadius: 3,
                color,
                display: "grid",
                height: 40,
                placeItems: "center",
                width: 40,
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
