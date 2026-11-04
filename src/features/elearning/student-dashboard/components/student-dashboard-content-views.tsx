import Bell from "@mui/icons-material/NotificationsNoneRounded";
import LogIn from "@mui/icons-material/LoginRounded";
import LogOut from "@mui/icons-material/LogoutRounded";
import User from "@mui/icons-material/PersonOutlineRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { type ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment, StudentDashboardProfile, StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getDiscussionOverviewPreview } from "@/features/elearning/student-dashboard/utils/discussion-overview";
import { MUI_PRIMARY, MUI_TEXT, MUI_MUTED, MUI_DIVIDER, elevatedCardSx, primaryButtonSx, Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import { OverviewHeroActions, OverviewMetrics } from "@/features/elearning/student-dashboard/components/student-dashboard-overview-shared";
import { PageHeader, SectionCard, PriorityPanel, AssignmentListItem, AnnouncementCard, EmptyPanel, SkeletonRow } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import { formatAverageScore, resolveOverviewHero } from "@/features/elearning/student-dashboard/utils/student-overview-hero";

export function OverviewView({ announcement, assignmentsFailed, assignmentsLoading, completedAssignments, copy, discussionPreview, openAssignments, overdueAssignments, priorityAssignment, profile, onOpenAssignment, onPageChange }: { announcement: StudentTeacherAnnouncement | undefined; assignmentsFailed: boolean; assignmentsLoading: boolean; completedAssignments: StudentDashboardAssignment[]; copy: DashboardCopy; discussionPreview: ReturnType<typeof getDiscussionOverviewPreview>; openAssignments: StudentDashboardAssignment[]; overdueAssignments: StudentDashboardAssignment[]; priorityAssignment?: StudentDashboardAssignment; profile: StudentDashboardProfile; onOpenAssignment: (assignmentId: string) => void; onPageChange: (page: StudentPageKey) => void; }) {
  const hero = resolveOverviewHero(priorityAssignment, copy);
  return (
    <Stack spacing={2.5}>
      <Card sx={{ ...elevatedCardSx, background: "#fff", overflow: "hidden", position: "relative" }}>
        <CardContent sx={{ p: { xs: 2.4, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} justifyContent="space-between">
            <Box sx={{ minWidth: 0, maxWidth: 840 }}>
              <Chip label={copy.heroEyebrow} size="small" sx={{ bgcolor: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.16)", color: MUI_PRIMARY, fontWeight: 600 }} />
              <Typography variant="h4" sx={{ mt: 1.25, color: MUI_TEXT, fontWeight: 600, lineHeight: 1.15, fontSize: { xs: 24, md: 30 } }}>{copy.heroTitle(profile.name)}</Typography>
              <Typography variant="body1" sx={{ mt: 1.25, color: MUI_MUTED, lineHeight: 1.65 }}>{hero.description}</Typography>
              <Box sx={{ mt: 2.5 }}>
                <OverviewHeroActions copy={copy} hero={hero} onOpenAssignment={onOpenAssignment} onPageChange={onPageChange} />
              </Box>
            </Box>
            {priorityAssignment && hero.primaryAssignmentId ? <PriorityPanel assignment={priorityAssignment} copy={copy} onOpenAssignment={onOpenAssignment} /> : null}
          </Stack>
        </CardContent>
      </Card>
      <OverviewMetrics
        columns={{ xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }}
        completedAssignments={completedAssignments}
        copy={copy}
        openAssignments={openAssignments}
        overdueAssignments={overdueAssignments}
        profile={profile}
      />
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" }, alignItems: "start" }}>
        <SectionCard action={<Button variant="text" onClick={() => onPageChange("assignments")} size="small">Xem tất cả</Button>} title={copy.todayTitle}>
          <Stack spacing={1.25}>
            {assignmentsLoading ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />) : openAssignments.slice(0, 3).map((assignment) => <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} onOpenAssignment={onOpenAssignment} />)}
            {!assignmentsLoading && !assignmentsFailed && openAssignments.length === 0 ? <EmptyPanel description="Tất cả bài tập đã được nộp. Tuyệt vời!" title="Không có bài tập cần làm" /> : null}
          </Stack>
        </SectionCard>
        <Stack spacing={2.5}>
          {announcement ? (
            <SectionCard action={<Button variant="text" onClick={() => onPageChange("announcements")} size="small">Xem thêm</Button>} title={copy.announcementTitle}>
              <AnnouncementCard announcement={announcement} selected={false} />
            </SectionCard>
          ) : null}
          <SectionCard action={<Button variant="text" onClick={() => onPageChange("discussion")} size="small">Mở diễn đàn</Button>} title={copy.discussionTitle}>
            <Stack spacing={1}>
              {discussionPreview.map((post) => (
                <Paper key={post.id} sx={{ bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: "12px", p: 1.4 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: MUI_PRIMARY, height: 28, width: 28, fontSize: 11, fontWeight: 600 }}>{post.authorName.slice(0, 1)}</Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>{post.authorName}</Typography>
                      <Typography noWrap variant="caption" color="text.secondary">{copy.discussionRepliesLabel(post.commentCount)}</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 1, color: MUI_MUTED, lineHeight: 1.55 }}>{post.content}</Typography>
                </Paper>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}

export function AnnouncementsView({ announcements, copy, selectedAnnouncementId }: { announcements: StudentTeacherAnnouncement[]; copy: DashboardCopy; selectedAnnouncementId: string | null; }) {
  return (
    <Stack spacing={2}>
      <PageHeader description={copy.announcementDescription} icon={<Bell sx={{ fontSize: 20 }} />} title={copy.announcementTitle} />
      <Card sx={elevatedCardSx}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1}>
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} selected={selectedAnnouncementId === announcement.id} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function AccountView({ account, averageAssignmentScore, copy, openAssignments, profile, onSignIn, onSignOut }: { account: ElearningViewerSession | null; averageAssignmentScore: number | null; copy: DashboardCopy; openAssignments: StudentDashboardAssignment[]; profile: StudentDashboardProfile; onSignIn: () => void; onSignOut: () => void; }) {
  const isGuest = !account;
  return (
    <Stack spacing={2.5}>
      <PageHeader description={copy.accountDescription} icon={<User sx={{ fontSize: 20 }} />} title={copy.accountTitle} />
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" } }}>
        <Card sx={elevatedCardSx}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{copy.learningProfileTitle}</Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Avatar sx={{ bgcolor: MUI_PRIMARY, height: 56, width: 56, fontSize: 20, fontWeight: 600 }}>{(account?.name ?? profile.name).slice(0, 1)}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{account?.name ?? profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">{account?.email ?? profile.className}</Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: "12px" }}>
                <Typography variant="caption" color="text.secondary">{copy.stats.average}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatAverageScore(averageAssignmentScore, profile.completedAssignments)}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: "12px" }}>
                <Typography variant="caption" color="text.secondary">{copy.stats.open}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{openAssignments.length}</Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
        <Card sx={elevatedCardSx}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{copy.accountActionsTitle}</Typography>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {isGuest ? (
                <Button fullWidth variant="contained" startIcon={<LogIn />} onClick={onSignIn} sx={{ ...primaryButtonSx, borderRadius: 2 }}>{copy.signIn}</Button>
              ) : (
                <Button fullWidth variant="outlined" color="error" startIcon={<LogOut />} onClick={onSignOut} sx={{ borderRadius: 2, fontWeight: 600 }}>{copy.signOut}</Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function Divider({ sx }: { sx?: unknown }) {
  return <Box sx={[{ height: 1, bgcolor: MUI_DIVIDER }, sx] as never} />;
}
