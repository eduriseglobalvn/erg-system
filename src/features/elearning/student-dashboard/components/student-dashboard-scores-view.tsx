import { useState, type ReactNode } from "react";
import CheckCircle2 from "@mui/icons-material/CheckCircleOutlineRounded";
import Clock3 from "@mui/icons-material/ScheduleRounded";
import GraduationCap from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import MuiStack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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
  const bestScore = attemptedAssignments.reduce<number | null>(
    (best, assignment) => {
      const assignmentScore = assignment.score ?? assignment.attempts.reduce<number | null>(
        (attemptBest, attempt) => attemptBest === null ? attempt.score : Math.max(attemptBest, attempt.score),
        null,
      );
      if (assignmentScore === null) return best;
      return best === null ? assignmentScore : Math.max(best, assignmentScore);
    },
    null,
  );
  const totalAttempts = assignments.reduce((total, assignment) => total + assignment.attempts.length, 0);

  const [courseFilter, setCourseFilter] = useState<"all" | "in_progress" | "not_started" | "completed">("all");

  return (
    <Stack spacing={2.5}>
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
          {copy.scoresTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.4, fontWeight: 550 }}>
          1 khóa học
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, maxWidth: "100%", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {[
          { key: "all", label: "Tất cả", count: 1 },
          { key: "in_progress", label: "Đang học", count: 0 },
          { key: "not_started", label: "Chưa học", count: 0 },
          { key: "completed", label: "Đã hoàn thành", count: 1 },
        ].map((tab) => {
          const active = courseFilter === tab.key;
          return (
            <Box
              key={tab.key}
              component="button"
              onClick={() => setCourseFilter(tab.key as any)}
              sx={{
                alignItems: "center",
                bgcolor: active ? "#2563EB" : "#FFFFFF",
                border: `1px solid ${active ? "#2563EB" : "#E2E8F0"}`,
                borderRadius: "99px",
                boxShadow: active ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                color: active ? "#FFFFFF" : "#475569",
                cursor: "pointer",
                display: "inline-flex",
                flexShrink: 0,
                fontSize: 13,
                fontWeight: active ? 700 : 550,
                gap: 0.8,
                outline: "none",
                px: 1.8,
                py: 0.6,
                transition: "all 140ms ease",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: active ? "#1D4ED8" : "#F8FAFC",
                  borderColor: active ? "#1D4ED8" : "#CBD5E1",
                  color: active ? "#FFFFFF" : "#0F172A",
                },
              }}
            >
              <span>{tab.label}</span>
              <Box
                component="span"
                sx={{
                  bgcolor: active ? "rgba(255,255,255,0.24)" : "#F1F5F9",
                  borderRadius: "99px",
                  color: active ? "#FFFFFF" : "#64748B",
                  fontSize: 11,
                  fontWeight: 700,
                  px: 0.85,
                  py: 0.1,
                }}
              >
                {tab.count}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Paper
        sx={{
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
          p: { xs: 1.8, md: 2.2 },
          transition: "all 180ms ease",
          "&:hover": { boxShadow: "0 8px 24px rgba(15,23,42,0.06)", borderColor: "#CBD5E1" },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              alignItems: "center",
              background: "linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #4F46E5 100%)",
              borderRadius: "14px",
              color: "#FFFFFF",
              display: "flex",
              flexShrink: 0,
              height: 52,
              justifyContent: "center",
              width: 52,
            }}
          >
            <GraduationCap sx={{ fontSize: 26 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.4 }}>
              <Typography variant="subtitle1" noWrap sx={{ color: "#0F172A", fontSize: 15, fontWeight: 800 }}>
                [Tập huấn 2026] IC3 GS6
              </Typography>
              <Box
                sx={{
                  bgcolor: "#ECFDF5",
                  border: "1px solid #D1FAE5",
                  borderRadius: "99px",
                  color: "#059669",
                  fontSize: 11,
                  fontWeight: 700,
                  px: 1.15,
                  py: 0.25,
                }}
              >
                Hoàn thành
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: "#64748B", fontSize: 12.5, fontWeight: 500, mb: 1 }}>
              Tự do · 4 bài học
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ flex: 1, bgcolor: "#E2E8F0", borderRadius: 99, height: 5, overflow: "hidden" }}>
                <Box sx={{ bgcolor: "#10B981", borderRadius: 99, height: "100%", width: "100%" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "#10B981", fontSize: 12, fontWeight: 800 }}>
                100%
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <ScoreMetricCard icon={<GraduationCap sx={{ fontSize: 18 }} />} label={copy.bestScoreLabel} tone="success" value={bestScore ?? "—"} />
        <ScoreMetricCard icon={<CheckCircle2 sx={{ fontSize: 18 }} />} label={copy.stats.completed} value={attemptedAssignments.length} />
        <ScoreMetricCard icon={<Clock3 sx={{ fontSize: 18 }} />} label={copy.recentResultsTitle} tone="info" value={totalAttempts} />
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
  const bestScore = assignment.score ?? assignment.attempts.reduce<number | null>(
    (best, attempt) => best === null ? attempt.score : Math.max(best, attempt.score),
    null,
  );
  const scorePercent = bestScore !== null && assignment.maxScore && assignment.maxScore > 0
    ? Math.round((bestScore / assignment.maxScore) * 100)
    : null;
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
              {assignment.subjectLabel ? <Chip label={assignment.subjectLabel} size="small" variant="outlined" sx={{ borderRadius: "7px", fontWeight: 850, height: 28 }} /> : null}
              <Chip
                label={assignment.attempts.length ? `${assignment.attempts.length} lượt làm` : "Chưa làm"}
                size="small"
                sx={{ bgcolor: "#F0F2F5", borderRadius: "7px", color: MUI_MUTED, fontWeight: 850, height: 28 }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: MUI_MUTED, fontWeight: 750 }}>
              {assignment.teacherName ?? "Chưa có giáo viên"}
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
            {bestScore === null || assignment.maxScore === null ? "—" : copy.scoreBadge(bestScore, assignment.maxScore)}
          </Typography>
          {scorePercent === null ? (
            <Typography variant="caption" sx={{ color: MUI_MUTED, display: "block", mt: 1.2 }}>
              Chưa có dữ liệu điểm chi tiết.
            </Typography>
          ) : (
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
          )}
          <Typography variant="caption" sx={{ color: MUI_MUTED, display: "block", fontWeight: 850, mt: 0.75 }}>
            {scorePercent === null ? "Chưa có dữ liệu" : `${scorePercent}% hoàn thành`}
          </Typography>
        </Box>
      </Box>
    </Paper>
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
