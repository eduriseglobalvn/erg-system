import GradeIcon from "@mui/icons-material/GradeOutlined";
import HelpIcon from "@mui/icons-material/HelpOutlineRounded";
import StairsIcon from "@mui/icons-material/StairsRounded";
import Bell from "@mui/icons-material/NotificationsNoneRounded";
import LogIn from "@mui/icons-material/LoginRounded";
import LogOut from "@mui/icons-material/LogoutRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { nameInitials, nameWithoutTags } from "@/domain/formatters/format-initials";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { type ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment, StudentDashboardProfile, StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getDiscussionOverviewPreview } from "@/features/elearning/student-dashboard/utils/discussion-overview";
import { score10, submittedStats, todoHeadline } from "@/features/elearning/student-dashboard/utils/assignment-board";
import { serverAverageTen } from "@/features/elearning/student-dashboard/utils/student-overview-hero";
import { elevatedCardSx, Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import type { AssignmentFilter } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import { PageHeader, SectionCard, MetricCard, AssignmentListItem, AnnouncementCard, EmptyPanel, SkeletonRow } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";

/** Desktop overview (mockup hoc-sinh-tong-quan): to-do first, border-only cards, one contained button (the most urgent row). */
export function OverviewView({ announcement, assignmentsFailed, assignmentsLoading, completedAssignments, copy, discussionPreview, openAssignments, profile, onOpenAssignment, onPageChange }: { announcement: StudentTeacherAnnouncement | undefined; assignmentsFailed: boolean; assignmentsLoading: boolean; completedAssignments: StudentDashboardAssignment[]; copy: DashboardCopy; discussionPreview: ReturnType<typeof getDiscussionOverviewPreview>; openAssignments: StudentDashboardAssignment[]; overdueAssignments: StudentDashboardAssignment[]; priorityAssignment?: StudentDashboardAssignment; profile: StudentDashboardProfile; onOpenAssignment: (assignmentId: string) => void; onPageChange: (page: StudentPageKey, assignmentFilter?: AssignmentFilter) => void; }) {
  const todo = [...openAssignments].sort((a, b) => Number(b.status === "overdue") - Number(a.status === "overdue")).slice(0, 4);
  const [now] = useState(() => Date.now());
  // The server's average covers every assignment; the loaded page is only the fallback.
  const loadedStats = submittedStats(completedAssignments);
  const average = (loadedStats.count > 0 ? serverAverageTen(profile)?.averageTen : undefined) ?? loadedStats.averageTen;
  const recentScores = completedAssignments.filter((a) => score10(a)).sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")).slice(0, 3);
  const subtitle = [profile.className, todoHeadline([], now)].filter(Boolean).join(" · ");
  const show = (value: string | number) => (assignmentsFailed ? "—" : value);
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography component="h1" variant="h1" sx={t.type.pageTitle}>Việc cần làm hôm nay</Typography>
        <Typography color="text.secondary" sx={{ ...t.type.pageLead, mt: 0.5 }}>{subtitle}</Typography>
      </Box>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <MetricCard label="Cần làm" onClick={() => onPageChange("assignments", "todo")} value={show(openAssignments.length)} />
        <MetricCard label="Đã nộp" onClick={() => onPageChange("assignments", "submitted")} value={show(completedAssignments.length)} />
        <MetricCard label="Điểm trung bình (thang 10)" onClick={() => onPageChange("scores")} value={show(average || "—")} />
      </Box>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" }, alignItems: "start" }}>
        <SectionCard action={<Button variant="text" onClick={() => onPageChange("assignments")} size="small">Tất cả bài tập</Button>} title="Bài sắp hết hạn">
          <Stack spacing={1.25}>
            {assignmentsLoading ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />) : todo.map((assignment, index) => <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} primary={index === 0} onOpenAssignment={onOpenAssignment} />)}
            {assignmentsFailed ? <EmptyPanel description="Tải lại trang sau ít phút. Nếu vẫn lỗi thì báo giáo viên." title="Chưa tải được bài tập" /> : null}
            {!assignmentsLoading && !assignmentsFailed && openAssignments.length === 0 ? (completedAssignments.length > 0
              ? <EmptyPanel description={copy.todayDoneDescription} title={copy.heroAllDone} />
              : <EmptyPanel description={copy.todayEmptyDescription} title={copy.heroEmpty} />) : null}
          </Stack>
        </SectionCard>
        <Stack spacing={2.5}>
          <SectionCard action={<Button variant="text" onClick={() => onPageChange("scores")} size="small">Xem điểm số</Button>} title="Điểm mới">
            <Stack spacing={1}>
              {recentScores.length === 0 ? <EmptyPanel description="Nộp bài xong, điểm sẽ hiện ở đây." title="Chưa có điểm" /> : null}
              {recentScores.map((a) => (
                <Stack key={a.id} direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{a.title}</Typography>
                  <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>{score10(a)}/10</Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
          {announcement ? (
            <SectionCard action={<Button variant="text" onClick={() => onPageChange("announcements")} size="small">Xem thêm</Button>} title={copy.announcementTitle}>
              <AnnouncementCard announcement={announcement} selected={false} />
            </SectionCard>
          ) : null}
          <SectionCard action={<Button variant="text" onClick={() => onPageChange("discussion")} size="small">Mở diễn đàn</Button>} title={copy.discussionTitle}>
            <Stack spacing={1}>
              {discussionPreview.length === 0 ? <EmptyPanel description={copy.discussionEmptyDescription} title={copy.discussionEmptyTitle} /> : null}
              {discussionPreview.map((post) => (
                <Box key={post.id} sx={{ bgcolor: t.color.surfaceMuted, border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.control}px`, p: 1.4 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.main", height: 28, width: 28, typography: "caption" }}>{nameInitials(post.authorName)}</Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap variant="subtitle2">{post.authorName}</Typography>
                      <Typography noWrap variant="caption" color="text.secondary">{copy.discussionRepliesLabel(post.commentCount)}</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>{post.content}</Typography>
                </Box>
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

const accountCardSx = { border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, boxShadow: "none", p: { xs: 2, md: 3 } };

/** Student account (mockup hoc-sinh-tai-khoan): one narrow column, school-issued facts only; students never change their own password. */
export function AccountView({ account, className, copy, profile, onHelpOpen, onScoresOpen, onSignIn, onSignOut, onTierOpen }: { account: ElearningViewerSession | null; /** Class from the class board; the session's own class is a job title for accounts that sign in through the staff login. */ className: string; copy: DashboardCopy; profile: StudentDashboardProfile; /** Phones reach the help guide from here (the bottom nav stays as it is). */ onHelpOpen?: () => void; /** Phones reach "Điểm số" from here (no dock slot). */ onScoresOpen?: () => void; onSignIn: () => void; onSignOut: () => void; /** Phones reach the tier page (H15m) from here. */ onTierOpen?: () => void; }) {
  const isGuest = !account;
  const name = nameWithoutTags(account?.name ?? profile.name);
  const isStudentSession = account?.viewerKind === "student";
  const classLine = [className ||(isStudentSession ? profile.className : ""), isStudentSession ? account?.schoolName : ""].filter(Boolean).join(" · ");
  const lastLogin = account ? formatDateTimeVi(account.loggedInAt) : "";
  const facts = [
    { label: "Mã đăng nhập", value: account?.email ?? "" },
    { label: "Giáo viên chủ nhiệm", value: account?.viewerKind === "student" ? profile.homeroomTeacher : "" },
    { label: "Đăng nhập gần nhất", value: lastLogin },
  ].filter((fact) => fact.value);
  return (
    <Stack spacing={2.5} sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
      <Box>
        <Typography component="h1" variant="h1" sx={t.type.pageTitle}>{copy.accountTitle}</Typography>
        <Typography color="text.secondary" sx={{ ...t.type.pageLead, mt: 0.5 }}>Thông tin do nhà trường cấp. Sai thông tin thì báo giáo viên.</Typography>
      </Box>
      <Paper sx={accountCardSx}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main", height: 56, width: 56 }}>{nameInitials(account?.name ?? profile.name) || "HS"}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>{name}</Typography>
            {classLine ? <Typography variant="body2" color="text.secondary">{classLine}</Typography> : null}
          </Box>
        </Stack>
        {facts.length ? (
          <Box component="dl" sx={{ m: 0, mt: 2.5, borderTop: `1px solid ${t.color.divider}` }}>
            {facts.map((fact) => (
              <Stack key={fact.label} direction="row" justifyContent="space-between" spacing={2} sx={{ borderBottom: `1px solid ${t.color.divider}`, py: 1.5 }}>
                <Typography component="dt" variant="body2" color="text.secondary">{fact.label}</Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: "right", wordBreak: "break-word" }}>{fact.value}</Typography>
              </Stack>
            ))}
          </Box>
        ) : null}
      </Paper>
      {isGuest ? null : (
        <Paper sx={accountCardSx}>
          <Typography variant="subtitle1">Mật khẩu</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Em không tự đổi mật khẩu được. Quên mật khẩu thì báo giáo viên để được cấp lại.</Typography>
        </Paper>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
        {isGuest ? (
          <Button variant="contained" startIcon={<LogIn />} onClick={onSignIn}>{copy.signIn}</Button>
        ) : (
          <>
            {onScoresOpen ? <Button variant="outlined" startIcon={<GradeIcon />} onClick={onScoresOpen}>Điểm số</Button> : null}
            {onTierOpen ? <Button variant="outlined" startIcon={<StairsIcon />} onClick={onTierOpen}>Bậc của tôi</Button> : null}
            {onHelpOpen ? <Button variant="outlined" startIcon={<HelpIcon />} onClick={onHelpOpen}>Hướng dẫn sử dụng</Button> : null}
            {/* The theme paints every outlined button in text colour; sign-out keeps the danger colour. */}
            <Button variant="outlined" color="error" startIcon={<LogOut />} onClick={onSignOut} sx={{ borderColor: "error.main", color: "error.main" }}>{copy.signOut}</Button>
          </>
        )}
      </Stack>
    </Stack>
  );
}

