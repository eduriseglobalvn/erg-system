import { useMemo, useState } from "react";
import Bell from "@mui/icons-material/NotificationsNoneRounded";
import BookOpenCheck from "@mui/icons-material/AutoStoriesRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleOutlineRounded";
import Clock3 from "@mui/icons-material/ScheduleRounded";
import GraduationCap from "@mui/icons-material/SchoolRounded";
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
import { PageHeader, SectionCard, PriorityPanel, MetricCard, AssignmentListItem, AnnouncementCard, EmptyPanel, SkeletonRow } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";

export function OverviewView({ announcement, assignmentsLoading, completedAssignments, copy, discussionPreview, openAssignments, overdueAssignments, priorityAssignment, profile, onOpenAssignment, onPageChange }: { announcement: StudentTeacherAnnouncement | undefined; assignmentsLoading: boolean; completedAssignments: StudentDashboardAssignment[]; copy: DashboardCopy; discussionPreview: ReturnType<typeof getDiscussionOverviewPreview>; openAssignments: StudentDashboardAssignment[]; overdueAssignments: StudentDashboardAssignment[]; priorityAssignment?: StudentDashboardAssignment; profile: StudentDashboardProfile; onOpenAssignment: (assignmentId: string) => void; onPageChange: (page: StudentPageKey) => void; }) {
  return (
    <Stack spacing={2.5}>
      <Card sx={{ ...elevatedCardSx, background: "#fff", overflow: "hidden", position: "relative" }}>
        <CardContent sx={{ p: { xs: 2.4, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} justifyContent="space-between">
            <Box sx={{ minWidth: 0, maxWidth: 840 }}>
              <Chip label={copy.heroEyebrow} size="small" sx={{ bgcolor: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.16)", color: MUI_PRIMARY, fontWeight: 700 }} />
              <Typography variant="h4" sx={{ mt: 1.25, color: MUI_TEXT, fontWeight: 900, lineHeight: 1.15, fontSize: { xs: 24, md: 30 } }}>{copy.heroTitle(profile.name)}</Typography>
              <Typography variant="body1" sx={{ mt: 1.25, color: MUI_MUTED, lineHeight: 1.65 }}>{copy.heroDescription(priorityAssignment?.title ?? "Bài tập tuần")}</Typography>
              <Stack direction="row" spacing={1.25} sx={{ mt: 2.5, flexWrap: "wrap", rowGap: 1 }}>
                <Button variant="contained" disabled={!priorityAssignment?.quizId} onClick={() => { if (priorityAssignment?.quizId) onOpenAssignment(priorityAssignment.id); }} sx={{ ...primaryButtonSx, borderRadius: 2.5, px: 2.6, py: 1 }}>{copy.primaryAction}</Button>
                <Button variant="outlined" onClick={() => onPageChange("assignments")} sx={{ borderRadius: 2.5, borderColor: MUI_DIVIDER, color: MUI_TEXT, fontWeight: 800, px: 2.2, "&:hover": { borderColor: MUI_PRIMARY, bgcolor: "rgba(37,99,235,0.04)" } }}>{copy.secondaryAction}</Button>
              </Stack>
            </Box>
            {priorityAssignment ? <PriorityPanel assignment={priorityAssignment} copy={copy} onOpenAssignment={onOpenAssignment} /> : null}
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } }}>
        <MetricCard icon={<BookOpenCheck sx={{ fontSize: 18 }} />} label={copy.stats.open} value={openAssignments.length} />
        <MetricCard icon={<Clock3 sx={{ fontSize: 18 }} />} label={copy.stats.overdue} tone="error" value={overdueAssignments.length} />
        <MetricCard icon={<GraduationCap sx={{ fontSize: 18 }} />} label={copy.stats.average} value={profile.averageScore === null ? "—" : `${profile.averageScore}%`} />
        <MetricCard icon={<CheckCircle2 sx={{ fontSize: 18 }} />} label={copy.stats.completed} tone="success" value={`${completedAssignments.length}/${profile.totalAssignments}`} />
      </Box>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" }, alignItems: "start" }}>
        <SectionCard action={<Button color="primary" onClick={() => onPageChange("assignments")} size="small" sx={{ fontWeight: 800 }}>Xem tất cả</Button>} title={copy.todayTitle}>
          <Stack spacing={1.25}>
            {assignmentsLoading ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />) : openAssignments.slice(0, 3).map((assignment) => <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} onOpenAssignment={onOpenAssignment} />)}
            {!assignmentsLoading && openAssignments.length === 0 ? <EmptyPanel description="Tất cả bài tập đã được nộp. Tuyệt vời!" title="Không có bài tập cần làm" /> : null}
          </Stack>
        </SectionCard>
        <Stack spacing={2.5}>
          {announcement ? (
            <SectionCard action={<Button color="primary" onClick={() => onPageChange("announcements")} size="small" sx={{ fontWeight: 800 }}>Xem thêm</Button>} title={copy.announcementTitle}>
              <AnnouncementCard announcement={announcement} selected={false} />
            </SectionCard>
          ) : null}
          <SectionCard action={<Button color="primary" onClick={() => onPageChange("discussion")} size="small" sx={{ fontWeight: 800 }}>Mở diễn đàn</Button>} title={copy.discussionTitle}>
            <Stack spacing={1}>
              {discussionPreview.map((post) => (
                <Paper key={post.id} sx={{ bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: "12px", p: 1.4 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: MUI_PRIMARY, height: 28, width: 28, fontSize: 11, fontWeight: 800 }}>{post.authorName.slice(0, 1)}</Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 700 }}>{post.authorName}</Typography>
                      <Typography noWrap variant="caption" color="text.secondary">{post.commentCount} replies</Typography>
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

export function AssignmentsView({ assignments, completedAssignments, copy, openAssignments, overdueAssignments, onOpenAssignment }: { assignments: StudentDashboardAssignment[]; completedAssignments: StudentDashboardAssignment[]; copy: DashboardCopy; openAssignments: StudentDashboardAssignment[]; overdueAssignments: StudentDashboardAssignment[]; onOpenAssignment: (assignmentId: string) => void; }) {
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "assignment" | "exam">("all");

  const inProgressList = openAssignments;
  const completedList = completedAssignments;
  const expiredList = overdueAssignments;

  const filteredList = useMemo(() => {
    let list = assignments;
    if (statusFilter === "in_progress") list = inProgressList;
    else if (statusFilter === "completed") list = completedList;
    else if (statusFilter === "expired") list = expiredList;
    return list;
  }, [assignments, inProgressList, completedList, expiredList, statusFilter]);

  const activeSectionTitle = statusFilter === "completed" ? "Đã hoàn thành" : statusFilter === "in_progress" ? "Đang diễn ra" : statusFilter === "expired" ? "Đã kết thúc" : "Đã hoàn thành";

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Bài tập & thi</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>Theo dõi bài tập và lịch thi sắp tới của bạn.</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, maxWidth: "100%", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          {[
            { key: "all", label: "Tất cả", count: assignments.length },
            { key: "in_progress", label: "Đang diễn ra", count: inProgressList.length },
            { key: "completed", label: "Đã hoàn thành", count: completedList.length },
            { key: "expired", label: "Đã kết thúc", count: expiredList.length },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <Button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                sx={{
                  bgcolor: active ? "#2563EB" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#475569",
                  border: `1px solid ${active ? "#2563EB" : "#E2E8F0"}`,
                  borderRadius: "99px",
                  boxShadow: active ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: active ? 700 : 550,
                  px: 1.8,
                  py: 0.6,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    bgcolor: active ? "#1D4ED8" : "#F8FAFC",
                    borderColor: active ? "#1D4ED8" : "#CBD5E1",
                    color: active ? "#FFFFFF" : "#0F172A",
                  },
                }}
              >
                {tab.label}
                <Box
                  component="span"
                  sx={{
                    bgcolor: active ? "rgba(255,255,255,0.24)" : "#F1F5F9",
                    borderRadius: "99px",
                    color: active ? "#FFFFFF" : "#64748B",
                    fontSize: 11,
                    fontWeight: 700,
                    ml: 0.8,
                    px: 0.9,
                    py: 0.15,
                  }}
                >
                  {tab.count}
                </Box>
              </Button>
            );
          })}
        </Box>
        <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "99px", display: "inline-flex", gap: "2px", p: "3px" }}>
          {[
            { key: "all", label: "Tất cả loại" },
            { key: "assignment", label: "Bài tập" },
            { key: "exam", label: "Bài thi" },
          ].map((type) => {
            const active = typeFilter === type.key;
            return (
              <Button
                key={type.key}
                onClick={() => setTypeFilter(type.key as any)}
                sx={{
                  bgcolor: active ? "#1E293B" : "transparent",
                  borderRadius: "99px",
                  color: active ? "#FFFFFF" : "#64748B",
                  fontSize: 12,
                  fontWeight: active ? 700 : 550,
                  px: 1.6,
                  py: 0.45,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    bgcolor: active ? "#0F172A" : "rgba(241, 245, 249, 0.7)",
                    color: active ? "#FFFFFF" : "#0F172A",
                  },
                }}
              >
                {type.label}
              </Button>
            );
          })}
        </Box>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", fontSize: 15 }}>{activeSectionTitle}</Typography>
        <Box sx={{ bgcolor: "#F1F5F9", color: "#475569", borderRadius: "99px", px: 1, py: 0.1, fontSize: 12, fontWeight: 700 }}>{filteredList.length}</Box>
      </Stack>
      <Stack spacing={1.5}>
        {filteredList.map((assignment) => (
          <AssignmentListItem key={assignment.id} assignment={assignment} copy={copy} onOpenAssignment={onOpenAssignment} />
        ))}
        {filteredList.length === 0 ? <EmptyPanel description="Không có bài tập nào phù hợp với bộ lọc này." title="Không có dữ liệu" /> : null}
      </Stack>
    </Box>
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
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{copy.learningProfileTitle}</Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Avatar sx={{ bgcolor: MUI_PRIMARY, height: 56, width: 56, fontSize: 20, fontWeight: 900 }}>{(account?.name ?? profile.name).slice(0, 1)}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{account?.name ?? profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">{account?.email ?? profile.className}</Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: "12px" }}>
                <Typography variant="caption" color="text.secondary">{copy.stats.average}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{averageAssignmentScore === null ? "—" : `${averageAssignmentScore}%`}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: "12px" }}>
                <Typography variant="caption" color="text.secondary">{copy.stats.open}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{openAssignments.length}</Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
        <Card sx={elevatedCardSx}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{copy.accountActionsTitle}</Typography>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {isGuest ? (
                <Button fullWidth variant="contained" startIcon={<LogIn />} onClick={onSignIn} sx={{ ...primaryButtonSx, borderRadius: 2 }}>{copy.signIn}</Button>
              ) : (
                <Button fullWidth variant="outlined" color="error" startIcon={<LogOut />} onClick={onSignOut} sx={{ borderRadius: 2, fontWeight: 700 }}>{copy.signOut}</Button>
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
