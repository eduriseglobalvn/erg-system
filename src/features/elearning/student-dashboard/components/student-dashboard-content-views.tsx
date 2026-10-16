import Bell from "@mui/icons-material/NotificationsNoneRounded";
import BookOpenCheck from "@mui/icons-material/AutoStoriesRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleOutlineRounded";
import ClipboardCheck from "@mui/icons-material/AssignmentTurnedInOutlined";
import Clock3 from "@mui/icons-material/ScheduleRounded";
import GraduationCap from "@mui/icons-material/SchoolRounded";
import Mail from "@mui/icons-material/EmailOutlined";
import LogIn from "@mui/icons-material/LoginRounded";
import LogOut from "@mui/icons-material/LogoutRounded";
import ShieldCheck from "@mui/icons-material/SecurityRounded";
import Sparkles from "@mui/icons-material/AutoAwesomeRounded";
import User from "@mui/icons-material/PersonOutlineRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  type ElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";
import type {
  DashboardCopy,
  StudentPageKey,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  getDiscussionOverviewPreview,
} from "@/features/elearning/student-dashboard/utils/discussion-overview";
import {
  MUI_PRIMARY,
  MUI_TEXT,
  MUI_MUTED,
  MUI_DIVIDER,
  elevatedCardSx,
  primaryButtonSx,
  Stack,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import {
  PageHeader,
  SectionCard,
  PriorityPanel,
  MetricCard,
  AssignmentListItem,
  AnnouncementCard,
  EmptyPanel,
  SkeletonRow,
  StatusChip,
} from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
export function OverviewView({
  announcement,
  assignmentsLoading,
  completedAssignments,
  copy,
  discussionPreview,
  openAssignments,
  overdueAssignments,
  priorityAssignment,
  profile,
  onOpenAssignment,
  onPageChange,
}: {
  announcement: StudentTeacherAnnouncement | undefined;
  assignmentsLoading: boolean;
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  discussionPreview: ReturnType<typeof getDiscussionOverviewPreview>;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
  priorityAssignment?: StudentDashboardAssignment;
  profile: StudentDashboardProfile;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
}) {
  return (
    <Stack spacing={2.5}>
      <Card
        sx={{
          ...elevatedCardSx,
          background: "#fff",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <CardContent sx={{ p: { xs: 2.4, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} justifyContent="space-between">
            <Box sx={{ minWidth: 0, maxWidth: 840 }}>
              <Chip
                label={copy.heroEyebrow}
                size="small"
                sx={{
                  bgcolor: "rgba(15,108,189,0.08)",
                  border: "1px solid rgba(15,108,189,0.16)",
                  color: MUI_PRIMARY,
                  fontWeight: 800,
                }}
              />
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 900, color: MUI_TEXT, lineHeight: 1.22 }}>
                {copy.heroTitle(profile.name.trim() || copy.learnerFallbackName)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, maxWidth: 760, color: MUI_MUTED, lineHeight: 1.7 }}>
                {priorityAssignment ? copy.heroDescription(priorityAssignment.title) : copy.assignmentsDescription}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
                {priorityAssignment ? (
                  <Button
                    variant="contained"
                    disabled={!priorityAssignment.quizId}
                    onClick={() => {
                      if (priorityAssignment.quizId) onOpenAssignment(priorityAssignment.id);
                    }}
                    sx={{
                      ...primaryButtonSx,
                      borderRadius: 2.5,
                      px: 2.2,
                    }}
                  >
                    {priorityAssignment.quizId ? copy.primaryAction : "Assessment chưa sẵn sàng"}
                  </Button>
                ) : null}
                <Button variant="outlined" onClick={() => onPageChange("assignments")} sx={{ borderRadius: 2.5, fontWeight: 800, px: 2.2 }}>
                  {copy.secondaryAction}
                </Button>
              </Stack>
            </Box>
            {priorityAssignment ? <PriorityPanel assignment={priorityAssignment} copy={copy} onOpenAssignment={onOpenAssignment} /> : null}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
        <MetricCard icon={<BookOpenCheck sx={{ fontSize: 20 }} />} label={copy.stats.open} value={openAssignments.length} />
        <MetricCard icon={<Clock3 sx={{ fontSize: 20 }} />} label={copy.stats.overdue} tone="error" value={overdueAssignments.length} />
        <MetricCard icon={<CheckCircle2 sx={{ fontSize: 20 }} />} label={copy.stats.completed} tone="success" value={`${completedAssignments.length}/${openAssignments.length + completedAssignments.length}`} />
        <MetricCard icon={<GraduationCap sx={{ fontSize: 20 }} />} label={copy.stats.average} tone="info" value={profile.averageScore ?? "—"} />
      </Box>

      <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.38fr) minmax(360px, 0.62fr)" } }}>
        <SectionCard
          action={<Button variant="text" onClick={() => onPageChange("assignments")}>{copy.secondaryAction}</Button>}
          title={copy.todayTitle}
        >
          <Stack spacing={1.25}>
            {assignmentsLoading ? (
              Array.from({ length: 3 }).map((_, index) => <SkeletonRow key={index} />)
            ) : (
              openAssignments.slice(0, 4).map((assignment) => (
                <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} onOpenAssignment={onOpenAssignment} />
              ))
            )}
          </Stack>
        </SectionCard>

        <Stack spacing={2}>
          <SectionCard title={copy.announcementTitle}>
            {announcement ? (
              <AnnouncementCard announcement={announcement} selected={false} />
            ) : (
              <EmptyPanel title={copy.announcementHeroTitle} description={copy.announcementHeroEmpty} />
            )}
          </SectionCard>
          <SectionCard
            action={<Button variant="text" onClick={() => onPageChange("discussion")}>{copy.discussionTitle}</Button>}
            title={copy.discussionTitle}
          >
            <Stack spacing={1}>
              {discussionPreview.slice(0, 3).map((post) => (
                <Paper key={post.id} sx={{ p: 1.5, borderColor: MUI_DIVIDER }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: "rgba(15,108,189,0.08)", color: MUI_PRIMARY, width: 30, height: 30 }}>
                      {post.authorName.slice(0, 1)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 700 }}>
                        {post.authorName}
                      </Typography>
                      <Typography noWrap variant="caption" color="text.secondary">
                        {post.commentCount} replies
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 1, color: MUI_MUTED, lineHeight: 1.55 }}>
                    {post.content}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}

export function AssignmentsView({
  assignments,
  completedAssignments,
  copy,
  openAssignments,
  overdueAssignments,
  onOpenAssignment,
}: {
  assignments: StudentDashboardAssignment[];
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
  onOpenAssignment: (assignmentId: string) => void;
}) {
  return (
    <Stack spacing={2}>
      <PageHeader
        description={copy.assignmentsDescription}
        icon={<ClipboardCheck sx={{ fontSize: 20 }} />}
        title={copy.assignmentsTitle}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <MetricCard icon={<BookOpenCheck sx={{ fontSize: 18 }} />} label={copy.stats.open} value={openAssignments.length} />
        <MetricCard icon={<Clock3 sx={{ fontSize: 18 }} />} label={copy.stats.overdue} tone="error" value={overdueAssignments.length} />
        <MetricCard icon={<CheckCircle2 sx={{ fontSize: 18 }} />} label={copy.stats.completed} tone="success" value={`${completedAssignments.length}/${assignments.length}`} />
      </Box>
      <SectionCard title={copy.todayTitle}>
        <Stack spacing={1.25}>
          {assignments.map((assignment) => (
            <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} onOpenAssignment={onOpenAssignment} />
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}

export function AnnouncementsView({
  announcements,
  copy,
  selectedAnnouncementId,
}: {
  announcements: StudentTeacherAnnouncement[];
  copy: DashboardCopy;
  selectedAnnouncementId: string | null;
}) {
  return (
    <Stack spacing={2}>
      <PageHeader description={copy.announcementDescription} icon={<Bell sx={{ fontSize: 20 }} />} title={copy.announcementTitle} />
      <Card sx={elevatedCardSx}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1}>
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                selected={selectedAnnouncementId === announcement.id}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function AccountView({
  account,
  averageAssignmentScore,
  copy,
  openAssignments,
  profile,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  averageAssignmentScore: number | null;
  copy: DashboardCopy;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  return (
    <Stack spacing={2}>
      <PageHeader description={copy.accountDescription} icon={<User sx={{ fontSize: 20 }} />} title={copy.accountTitle} />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" } }}>
        <Card sx={{ ...elevatedCardSx, overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 2, md: 0 } }}>
            <Box
              sx={{
                bgcolor: "#fff",
                borderBottom: { md: `1px solid ${MUI_DIVIDER}` },
                p: { xs: 0, md: 3 },
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: MUI_PRIMARY,
                      boxShadow: "0 12px 28px rgba(15,108,189,0.16)",
                      color: "#fff",
                      fontWeight: 900,
                      height: 62,
                      width: 62,
                    }}
                  >
                    {profile.name.slice(0, 1)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {profile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.className} - {profile.schoolName}
                    </Typography>
                  </Box>
                </Stack>
                <StatusChip status={openAssignments.length > 0 ? "in_progress" : "submitted"} label={openAssignments.length > 0 ? copy.stats.open : copy.stats.completed} />
              </Stack>
            </Box>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, mt: { xs: 2, md: 0 }, p: { xs: 0, md: 3 } }}>
              <MetricCard icon={<Sparkles sx={{ fontSize: 18 }} />} label={copy.stats.average} value={averageAssignmentScore ?? "—"} />
              <MetricCard icon={<CheckCircle2 sx={{ fontSize: 18 }} />} label={copy.stats.completed} tone="success" value={profile.completedAssignments ?? "—"} />
              <MetricCard icon={<BookOpenCheck sx={{ fontSize: 18 }} />} label={copy.assignmentsTitle} value={profile.completedAssignments === null || profile.totalAssignments === null ? "—" : `${profile.completedAssignments}/${profile.totalAssignments}`} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={elevatedCardSx}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box
                sx={{
                  bgcolor: "rgba(15,108,189,0.08)",
                  border: "1px solid rgba(15,108,189,0.14)",
                  borderRadius: 2,
                  color: MUI_PRIMARY,
                  display: "grid",
                  height: 38,
                  placeItems: "center",
                  width: 38,
                }}
              >
                <ShieldCheck sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {copy.loginStateTitle}
              </Typography>
            </Stack>
            <Paper
              sx={{
                bgcolor: "rgba(248,250,252,0.78)",
                border: `1px solid ${MUI_DIVIDER}`,
                borderRadius: 2.5,
                boxShadow: "none",
                mt: 1.5,
                p: 1.8,
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <User sx={{ color: MUI_MUTED, fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {account?.name ?? copy.guestLabel}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Mail sx={{ color: MUI_MUTED, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    {account?.email ?? copy.guestLabel}
                  </Typography>
                </Stack>
                <Chip
                  label={account ? copy.signedInAs : copy.guestLabel}
                  size="small"
                  sx={{ alignSelf: "flex-start", bgcolor: account ? "rgba(34,197,94,0.1)" : "rgba(145,158,171,0.12)", fontWeight: 800 }}
                />
              </Stack>
            </Paper>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Button startIcon={<LogIn sx={{ fontSize: 16 }} />} variant="contained" onClick={onSignIn} sx={{ ...primaryButtonSx, borderRadius: 2.25, minHeight: 42 }}>
                {copy.signIn}
              </Button>
              <Button startIcon={<LogOut sx={{ fontSize: 16 }} />} color="error" variant="outlined" onClick={onSignOut} sx={{ borderRadius: 2.25, fontWeight: 900, minHeight: 42 }}>
                {copy.signOut}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
