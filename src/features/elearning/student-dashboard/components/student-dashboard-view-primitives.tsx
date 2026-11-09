import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentAssignmentStatus,
  StudentDashboardAssignment,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  MUI_PRIMARY,
  MUI_TEXT,
  MUI_MUTED,
  MUI_BORDER,
  MUI_DIVIDER,
  elevatedCardSx,
  elevatedPaperSx,
  primaryButtonSx,
  Stack,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";

export function PageHeader({ description, icon, title }: { description: string; icon: ReactNode; title: string }) {
  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ py: 2.2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ bgcolor: "rgba(0, 113, 227,0.08)", border: "1px solid rgba(0, 113, 227,0.14)", borderRadius: 2.5, color: MUI_PRIMARY, display: "grid", height: 44, placeItems: "center", width: 44 }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ color: MUI_TEXT, fontWeight: 600, lineHeight: 1.15 }}>{title}</Typography>
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
        <Typography variant="subtitle1" sx={{ color: MUI_TEXT, fontWeight: 600 }}>{title}</Typography>
        {action}
      </Stack>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>{children}</CardContent>
    </Card>
  );
}

export function PriorityPanel({ assignment, copy, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; onOpenAssignment: (assignmentId: string) => void }) {
  return (
    <Paper sx={{ alignSelf: "stretch", bgcolor: "primary.main", border: "1px solid", borderColor: "primary.dark", borderRadius: 3, boxShadow: "none", color: "common.white", minWidth: { md: 360 }, overflow: "hidden", p: 2.2, position: "relative" }}>
      <Chip label={copy.priority.title} size="small" sx={{ bgcolor: (theme) => alpha(theme.palette.common.white, 0.2), color: "common.white", fontWeight: 600 }} />
      <Typography variant="subtitle1" sx={{ mt: 1.5, color: "common.white", fontWeight: 600 }}>{assignment.title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.75, color: (theme) => alpha(theme.palette.common.white, 0.82), lineHeight: 1.55 }}>{copy.priority.detail(assignment.dueLabel)}</Typography>
      {assignment.progressRate === null ? (
        <Typography variant="caption" sx={{ color: (theme) => alpha(theme.palette.common.white, 0.82), display: "block", mt: 2 }}>Chưa có dữ liệu tiến độ</Typography>
      ) : (
        <LinearProgress value={assignment.progressRate} variant="determinate" sx={{ height: 10, mt: 2, bgcolor: (theme) => alpha(theme.palette.common.white, 0.25), borderRadius: 99, "& .MuiLinearProgress-bar": { bgcolor: "common.white", borderRadius: 99 } }} />
      )}
      <Button fullWidth variant="outlined" disabled={!assignment.quizId} onClick={() => { if (assignment.quizId) onOpenAssignment(assignment.id); }} sx={{ bgcolor: "common.white", borderColor: "common.white", color: "primary.main", mt: 2, "&:hover": { bgcolor: "primary.light", borderColor: "primary.light", color: "primary.dark" }, "&.Mui-disabled": { bgcolor: (theme) => alpha(theme.palette.common.white, 0.4), borderColor: "transparent", color: (theme) => alpha(theme.palette.common.white, 0.8) } }}>{copy.priority.action}</Button>
    </Paper>
  );
}

/** The one metric card for desktop and mobile: sentence-case label, border only, token colours. */
export function MetricCard({ icon, label, onClick, tone = "primary", value }: { icon?: ReactNode; label: string; onClick?: () => void; tone?: "primary" | "error" | "success" | "info"; value: string | number }) {
  const pad = { xs: 1.5, md: 2.2 };
  const content = (
    <CardContent sx={{ p: pad, "&:last-child": { pb: pad } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{label}</Typography>
          <Typography variant="h5" sx={{ mt: 0.5, color: "text.primary" }}>{value}</Typography>
        </Box>
        {icon ? <Box sx={{ bgcolor: (theme) => alpha(theme.palette[tone].main, 0.1), borderRadius: 2, color: `${tone}.main`, display: "grid", flexShrink: 0, height: 40, placeItems: "center", width: 40 }}>{icon}</Box> : null}
      </Stack>
    </CardContent>
  );
  return (
    <Card sx={{ ...elevatedCardSx, boxShadow: "none", minWidth: 0 }}>
      {onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}
    </Card>
  );
}

const STATUS_TONE = { submitted: "success", overdue: "error", in_progress: "info", not_started: "neutral" } as const;

/** One assignment card. Only the single most urgent row passes `primary` (contained); every other action is outlined. */
export function AssignmentListItem({ assignment, copy, primary = false, onOpenAssignment }: { assignment: StudentDashboardAssignment; copy: DashboardCopy; primary?: boolean; onOpenAssignment: (assignmentId: string) => void }) {
  const isCompleted = assignment.status === "submitted";
  const due = assignment.dueAt ? formatDateTimeVi(assignment.dueAt) : "";
  const hasScore = assignment.score !== null && assignment.maxScore !== null;
  return (
    <Paper variant="outlined" sx={{ borderRadius: `${ergEnterpriseTokens.radius.md}px`, boxShadow: "none", p: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap", rowGap: 0.5 }}>
            <ErgStatusChip label={assignment.statusLabel} tone={STATUS_TONE[assignment.status]} />
            {assignment.subjectLabel ? <Typography variant="caption" color="text.secondary">{assignment.subjectLabel}</Typography> : null}
          </Stack>
          <Typography variant="subtitle1">{assignment.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {hasScore ? `Điểm: ${assignment.score}/${assignment.maxScore}` : due ? `Hạn nộp: ${due}` : assignment.dueLabel}
          </Typography>
        </Box>
        <Button
          variant={primary ? "contained" : "outlined"}
          disabled={!assignment.quizId}
          onClick={() => { if (assignment.quizId) onOpenAssignment(assignment.id); }}
          sx={{ flexShrink: 0, minHeight: 44, minWidth: { md: 120 } }}
        >
          {isCompleted ? "Làm lại" : copy.assignmentAction(assignment.status)}
        </Button>
      </Stack>
    </Paper>
  );
}

export function AnnouncementCard({ announcement, selected }: { announcement: StudentTeacherAnnouncement; selected: boolean }) {
  return (
    <Paper id={`student-announcement-${announcement.id}`} sx={{ bgcolor: selected ? "rgba(0, 113, 227,0.035)" : "#fff", border: `1px solid ${selected ? "rgba(0, 113, 227,0.22)" : MUI_DIVIDER}`, borderLeft: `4px solid ${announcement.isPinned ? MUI_PRIMARY : "transparent"}`, borderRadius: "14px", boxShadow: "none", p: { xs: 1.4, md: 1.65 }, transition: "background 160ms ease, border-color 160ms ease", "&:hover": { bgcolor: "rgba(248,250,252,0.78)", borderColor: "rgba(0, 113, 227,0.18)" } }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            {announcement.isPinned ? <Chip label="Pinned" size="small" sx={{ bgcolor: "rgba(0, 113, 227,0.08)", color: MUI_PRIMARY, fontWeight: 850 }} /> : null}
            {announcement.targetLabel ? <Chip label={announcement.targetLabel} size="small" variant="outlined" /> : null}
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 1, color: MUI_TEXT, fontWeight: 600 }}>{announcement.title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: MUI_MUTED, lineHeight: 1.7 }}>{announcement.content}</Typography>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: { xs: "left", sm: "right" } }}>
          {announcement.teacherName ? <Typography variant="body2" sx={{ fontWeight: 600 }}>{announcement.teacherName}</Typography> : null}
          <Typography variant="caption" color="text.secondary">{announcement.createdAtLabel}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export function AnnouncementToast({ announcement, copy, open, onClose, onOpenDetail, onSnooze }: { announcement: StudentTeacherAnnouncement; copy: DashboardCopy; open: boolean; onClose: () => void; onOpenDetail: (announcementId: string) => void; onSnooze: (announcementId: string) => void }) {
  if (!open) return null;
  return (
    <Card sx={{ bottom: { xs: ergMobileDockAnchor(8), md: 18 }, border: `1px solid ${MUI_BORDER}`, borderRadius: { xs: 2.75, sm: 3 }, boxShadow: "0 18px 54px rgba(15,23,42,0.16)", left: { xs: 14, sm: "auto" }, maxWidth: "calc(100vw - 32px)", position: "fixed", right: { xs: 14, sm: 18 }, width: { xs: "auto", sm: 368 }, zIndex: 1400 }}>
      <CardContent sx={{ p: { xs: 1.55, sm: 2.25 } }}>
        <Stack spacing={{ xs: 0.9, sm: 1.15 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={copy.announcementPinnedLabel} color="warning" size="small" />
            <Typography variant="caption" color="text.secondary">{copy.announcementPopupAutoDismiss}</Typography>
          </Stack>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{announcement.title}</Typography>
          <Typography variant="body2" sx={{ color: MUI_MUTED, display: "-webkit-box", lineHeight: 1.55, overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: { xs: 2, sm: 4 } }}>{announcement.content}</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Button size="small" variant="text" onClick={() => onSnooze(announcement.id)} sx={{ borderRadius: 999, display: { xs: "none", sm: "inline-flex" }, fontWeight: 600 }}>{copy.announcementPopupSnooze}</Button>
            <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: 999, fontWeight: 600 }}>{copy.announcementPopupDismiss}</Button>
            <Button size="small" variant="contained" onClick={() => onOpenDetail(announcement.id)} sx={{ ...primaryButtonSx, borderRadius: 999 }}>{copy.announcementPopupAction}</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function StatusChip({ label, status }: { label: string; status: StudentAssignmentStatus }) {
  const color = status === "submitted" ? "success" : status === "overdue" ? "error" : status === "in_progress" ? "info" : "default";
  return <Chip color={color} label={label} size="small" sx={{ borderRadius: 2, fontWeight: 600 }} />;
}

export function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <Paper sx={{ ...elevatedPaperSx, p: 2.2, bgcolor: "#F9FAFD" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
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
