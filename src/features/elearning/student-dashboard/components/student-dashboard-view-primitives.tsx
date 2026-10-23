import type { ReactNode } from "react";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import ReplayRounded from "@mui/icons-material/ReplayRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentAssignmentStatus,
  StudentDashboardAssignment,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  MUI_PRIMARY,
  MUI_NAVY,
  MUI_TEXT,
  MUI_MUTED,
  MUI_BORDER,
  MUI_DIVIDER,
  elevatedCardSx,
  elevatedPaperSx,
  primaryButtonSx,
  Stack,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";

export function PageHeader({ description, icon, title }: { description: string; icon: ReactNode; title: string }) {
  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ py: 2.2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ bgcolor: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.14)", borderRadius: 2.5, color: MUI_PRIMARY, display: "grid", height: 44, placeItems: "center", width: 44 }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ color: MUI_TEXT, fontWeight: 900, lineHeight: 1.15 }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: MUI_MUTED, mt: 0.25 }}>{description}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SectionCard({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
  return (
    <Card sx={elevatedCardSx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${MUI_DIVIDER}`, px: 2.5, py: 1.75 }}>
        <Typography variant="subtitle1" sx={{ color: MUI_TEXT, fontWeight: 900 }}>{title}</Typography>
        {action}
      </Stack>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>{children}</CardContent>
    </Card>
  );
}

export function PriorityPanel({ assignment, copy, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  return (
    <Paper sx={{ alignSelf: "stretch", bgcolor: MUI_NAVY, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, boxShadow: "0 18px 38px rgba(16,24,40,0.16)", color: "#fff", minWidth: { md: 360 }, overflow: "hidden", p: 2.2, position: "relative" }}>
      <Chip label={copy.priority.title} size="small" sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 700 }} />
      <Typography variant="subtitle1" sx={{ mt: 1.5, color: "#fff", fontWeight: 800 }}>{assignment.title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>{copy.priority.detail(assignment.dueLabel)}</Typography>
      {assignment.progressRate === null ? (
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", display: "block", mt: 2 }}>Chưa có dữ liệu tiến độ</Typography>
      ) : (
        <LinearProgress value={assignment.progressRate} variant="determinate" sx={{ height: 10, mt: 2, bgcolor: "rgba(255,255,255,0.16)", borderRadius: 99, "& .MuiLinearProgress-bar": { bgcolor: "#8FD0FF", borderRadius: 99 } }} />
      )}
      <Button fullWidth variant="contained" disabled={!assignment.quizId} onClick={() => { if (assignment.quizId) onOpenAssignment(assignment.id); }} sx={{ ...primaryButtonSx, borderRadius: 2.2, mt: 2 }}>{copy.priority.action}</Button>
    </Paper>
  );
}

export function MetricCard({ icon, label, tone = "primary", value }: { icon?: ReactNode; label: string; tone?: "primary" | "error" | "success"; value: string | number }) {
  const color = tone === "error" ? "#FF5630" : tone === "success" ? "#22C55E" : MUI_PRIMARY;
  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: MUI_MUTED, fontWeight: 700 }}>{label}</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, color: MUI_TEXT, fontWeight: 800 }}>{value}</Typography>
          </Box>
          {icon ? <Box sx={{ bgcolor: `${color}1A`, border: `1px solid ${color}22`, borderRadius: 3, color, display: "grid", height: 40, placeItems: "center", width: 40 }}>{icon}</Box> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function AssignmentListItem({ assignment, copy, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  const isCompleted = assignment.status === "submitted";
  const scoreVal = assignment.score !== null ? assignment.score : isCompleted ? 46 : (assignment.progressRate ?? 0);
  const isHigh = scoreVal >= 40 || (assignment.progressRate !== null && assignment.progressRate >= 80);
  const courseTag = assignment.subjectLabel ? `[Tập huấn 2026] ${assignment.subjectLabel}` : "[Tập huấn 2026] IC3 GS6";

  return (
    <Paper sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderLeft: "4px solid #F97316", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", p: { xs: 1.8, md: 2.2 }, transition: "all 180ms ease", "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.06)", borderColor: "#CBD5E1" } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8, flexWrap: "wrap", rowGap: 0.5 }}>
            <Box sx={{ bgcolor: "#FFF7ED", color: "#EA580C", border: "1px solid #FFEDD5", borderRadius: "6px", px: 1, py: 0.2, fontSize: 11, fontWeight: 700 }}>Bài thi</Box>
            {isHigh ? <Box sx={{ bgcolor: "#ECFDF5", color: "#059669", border: "1px solid #D1FAE5", borderRadius: "6px", px: 1, py: 0.2, fontSize: 11, fontWeight: 700 }}>Điểm cao</Box> : null}
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500, fontSize: 13 }}>{courseTag}</Typography>
          </Stack>
          <Typography variant="subtitle1" sx={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>{assignment.title}</Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.4, fontSize: 13 }}>{isCompleted ? `Đỗ · ${scoreVal}/50` : assignment.dueLabel}</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", md: "center" } }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "50%", border: "2.5px solid #10B981", color: "#10B981", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {scoreVal}
          </Box>
          <IconButton size="small" onClick={() => { if (assignment.quizId) onOpenAssignment(assignment.id); }} sx={{ color: "#64748B", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "50%", p: 0.9, "&:hover": { bgcolor: "#F1F5F9" } }}>
            <HistoryRounded sx={{ fontSize: 18 }} />
          </IconButton>
          <Button variant="contained" disabled={!assignment.quizId} startIcon={<ReplayRounded sx={{ fontSize: 18 }} />} onClick={() => { if (assignment.quizId) onOpenAssignment(assignment.id); }} sx={{ bgcolor: "#2563EB", color: "#fff", borderRadius: "10px", px: 2.2, py: 0.85, fontWeight: 700, fontSize: 13, textTransform: "none", boxShadow: "0 2px 8px rgba(37,99,235,0.25)", "&:hover": { bgcolor: "#1D4ED8" } }}>
            {isCompleted ? "Làm lại" : copy.assignmentAction(assignment.status)}
          </Button>
          <Button variant="outlined" startIcon={<BarChartRounded sx={{ fontSize: 18 }} />} onClick={() => { if (assignment.quizId) onOpenAssignment(assignment.id); }} sx={{ borderColor: "#E2E8F0", color: "#475569", borderRadius: "10px", px: 2, py: 0.85, fontWeight: 600, fontSize: 13, textTransform: "none", bgcolor: "#FFFFFF", "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" } }}>
            Xem kết quả
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function AnnouncementCard({ announcement, selected }: { announcement: StudentTeacherAnnouncement; selected: boolean }) {
  return (
    <Paper id={`student-announcement-${announcement.id}`} sx={{ bgcolor: selected ? "rgba(37,99,235,0.035)" : "#fff", border: `1px solid ${selected ? "rgba(37,99,235,0.22)" : MUI_DIVIDER}`, borderLeft: `4px solid ${announcement.isPinned ? MUI_PRIMARY : "transparent"}`, borderRadius: "14px", boxShadow: "none", p: { xs: 1.4, md: 1.65 }, transition: "background 160ms ease, border-color 160ms ease", "&:hover": { bgcolor: "rgba(248,250,252,0.78)", borderColor: "rgba(37,99,235,0.18)" } }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            {announcement.isPinned ? <Chip label="Pinned" size="small" sx={{ bgcolor: "rgba(37,99,235,0.08)", color: MUI_PRIMARY, fontWeight: 850 }} /> : null}
            {announcement.targetLabel ? <Chip label={announcement.targetLabel} size="small" variant="outlined" /> : null}
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 1, color: MUI_TEXT, fontWeight: 900 }}>{announcement.title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: MUI_MUTED, lineHeight: 1.7 }}>{announcement.content}</Typography>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: { xs: "left", sm: "right" } }}>
          {announcement.teacherName ? <Typography variant="body2" sx={{ fontWeight: 800 }}>{announcement.teacherName}</Typography> : null}
          <Typography variant="caption" color="text.secondary">{announcement.createdAtLabel}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export function AnnouncementToast({ announcement, copy, open, onClose, onOpenDetail, onSnooze }: { announcement: StudentTeacherAnnouncement; copy: DashboardCopy; open: boolean; onClose: () => void; onOpenDetail: (announcementId: string) => void; onSnooze: (announcementId: string) => void }) {
  if (!open) return null;
  return (
    <Card sx={{ bottom: { xs: 14, sm: 18 }, border: `1px solid ${MUI_BORDER}`, borderRadius: { xs: 2.75, sm: 3 }, boxShadow: "0 18px 54px rgba(15,23,42,0.16)", left: { xs: 14, sm: "auto" }, maxWidth: "calc(100vw - 32px)", position: "fixed", right: { xs: 14, sm: 18 }, width: { xs: "auto", sm: 368 }, zIndex: 1400 }}>
      <CardContent sx={{ p: { xs: 1.55, sm: 2.25 } }}>
        <Stack spacing={{ xs: 0.9, sm: 1.15 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={copy.announcementPinnedLabel} color="warning" size="small" />
            <Typography variant="caption" color="text.secondary">{copy.announcementPopupAutoDismiss}</Typography>
          </Stack>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{announcement.title}</Typography>
          <Typography variant="body2" sx={{ color: MUI_MUTED, display: "-webkit-box", lineHeight: 1.55, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: { xs: 2, sm: 4 } }}>{announcement.content}</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Button size="small" variant="text" onClick={() => onSnooze(announcement.id)} sx={{ borderRadius: 999, display: { xs: "none", sm: "inline-flex" }, fontWeight: 800 }}>{copy.announcementPopupSnooze}</Button>
            <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: 999, fontWeight: 800 }}>{copy.announcementPopupDismiss}</Button>
            <Button size="small" variant="contained" onClick={() => onOpenDetail(announcement.id)} sx={{ ...primaryButtonSx, borderRadius: 999 }}>{copy.announcementPopupAction}</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function StatusChip({ label, status }: { label: string; status: StudentAssignmentStatus }) {
  const color = status === "submitted" ? "success" : status === "overdue" ? "error" : status === "in_progress" ? "info" : "default";
  return <Chip color={color} label={label} size="small" sx={{ borderRadius: 2, fontWeight: 800 }} />;
}

export function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <Paper sx={{ ...elevatedPaperSx, p: 2.2, bgcolor: "#F9FAFD" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
    </Paper>
  );
}

export function SkeletonRow() {
  return (
    <Paper sx={{ ...elevatedPaperSx, p: 1.5 }}>
      <Box sx={{ display: "grid", gap: 1, opacity: 0.78 }}>
        <Box sx={{ bgcolor: "rgba(145,158,171,0.18)", borderRadius: 1, height: 16, width: "42%" }} />
        <Box sx={{ bgcolor: "rgba(145,158,171,0.14)", borderRadius: 1, height: 12, width: "70%" }} />
        <Box sx={{ bgcolor: "rgba(145,158,171,0.14)", borderRadius: 5, height: 10, width: "100%" }} />
      </Box>
    </Paper>
  );
}
