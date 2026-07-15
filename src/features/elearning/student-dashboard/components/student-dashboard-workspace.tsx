import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Mail,
  LogIn,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Stack as MuiStack,
  Tab,
  Tabs,
  Tooltip,
  Toolbar,
  Typography,
} from "@mui/material";

import { PlayerShell } from "@/components/quiz/player-shell";
import { localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import { queryKeys } from "@/lib/query-keys";
import { testingSampleQuiz } from "@/lib/sample-quiz";
import {
  getCurrentElearningViewerSession,
  logoutElearningViewerSession,
  type ElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";
import { useI18n } from "@/platform/i18n";
import { useNavigate } from "@/routes/router-compat";
import {
  studentAssignments,
  studentDashboardProfile,
  studentDiscussionThreads,
  studentTeacherAnnouncements,
} from "@/features/elearning/student-dashboard/api/mock-student-dashboard";
import { loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import { DiscussionView } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-view";
import { ScoresView } from "@/features/elearning/student-dashboard/components/student-dashboard-scores-view";
import { enCopy, viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  DashboardCopy,
  StudentDiscussionNotification,
  StudentPageKey,
  StudentViewState,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentAssignmentStatus,
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentDiscussionImageAttachment,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  addFeedComment,
  createReactionSummary,
  toggleFeedCommentReaction,
  toggleFeedPostReaction,
} from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import { getDiscussionOverviewPreview } from "@/features/elearning/student-dashboard/utils/discussion-overview";
import {
  ANNOUNCEMENT_POPUP_SNOOZE_MS,
  createInitialDiscussionFeedPosts,
  createInitialDiscussionNotifications,
  createTimestamp,
  getInitials,
  isAnnouncementPopupSnoozed,
  maskProfanity,
  writeAnnouncementPopupSnooze,
} from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { useDebouncedCallback } from "@/hooks/use-paced-callback";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";

const MUI_PRIMARY = "#0F6CBD";
const MUI_PRIMARY_DARK = "#0B4F8A";
const MUI_RED = "#E31B3F";
const TESTING_DEMO_CLEANUP_MARKER = "erg:testing-demo-cleaned:v1";
const TESTING_DEMO_ASSIGNMENT_ID = "assignment-testing-mode-demo";
const MUI_NAVY = "#172033";
const MUI_TEXT = "#172033";
const MUI_MUTED = "#667085";
const MUI_BORDER = "rgba(16, 24, 40, 0.1)";
const MUI_DIVIDER = "rgba(16, 24, 40, 0.075)";
const MUI_BG = "#F3F6FA";
const MUI_SURFACE = "#FFFFFF";
const MUI_CARD_SHADOW = "0 1px 2px rgba(16,24,40,0.045), 0 18px 44px rgba(16,24,40,0.055)";
const LOGO_URL = "https://media.erg.edu.vn/logo/erg.png";

const elevatedCardSx = {
  bgcolor: MUI_SURFACE,
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "14px",
  boxShadow: MUI_CARD_SHADOW,
};

const elevatedPaperSx = {
  bgcolor: "#fff",
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "12px",
  boxShadow: "0 5px 18px rgba(16,32,51,0.045)",
};

const primaryButtonSx = {
  bgcolor: MUI_PRIMARY,
  boxShadow: `inset 0 -2px 0 rgba(227,27,63,0.24), 0 1px 2px rgba(16,24,40,0.08), 0 12px 22px rgba(15,108,189,0.16)`,
  color: "#fff",
  fontWeight: 900,
  "&:hover": {
    bgcolor: MUI_PRIMARY_DARK,
    boxShadow: `inset 0 -2px 0 rgba(227,27,63,0.32), 0 1px 2px rgba(16,24,40,0.08), 0 14px 26px rgba(15,108,189,0.2)`,
  },
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

export function StudentDashboardWorkspace() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const copy: DashboardCopy = locale === "vi" ? viCopy : enCopy;
  const [activePage, setActivePage] = useState<StudentPageKey>(() => {
    if (typeof window === "undefined") return "overview";
    return new URLSearchParams(window.location.search).get("tab") === "discussion" ? "discussion" : "overview";
  });
  const [viewState, setViewState] = useState<StudentViewState>({ type: "dashboard" });
  const [account, setAccount] = useState<ElearningViewerSession | null>(() => getCurrentElearningViewerSession());
  const apiEnabled = hasApiBase();
  const tenantId = getDefaultTenantId();
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [announcementPopupOpen, setAnnouncementPopupOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const paceStateUpdate = usePacedStateBatch();
  const autoCloseAnnouncementPopup = useDebouncedCallback(() => setAnnouncementPopupOpen(false), 30000);
  const scrollToAnnouncement = useDebouncedCallback((announcementId: string) => {
    document.getElementById(`student-announcement-${announcementId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 120);
  const scrollToDiscussionPost = useDebouncedCallback((threadId: string) => {
    document.getElementById(`student-discussion-post-${threadId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 120);

  const studentDashboardQuery = useQuery({
    queryKey: queryKeys.studentDashboard.workspace(account?.id, tenantId),
    queryFn: loadStudentDashboardData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (typeof window === "undefined" || window.localStorage.getItem(TESTING_DEMO_CLEANUP_MARKER)) {
      return;
    }

    void (async () => {
      await localQuizAttemptStore.clearSession(TESTING_DEMO_ASSIGNMENT_ID, testingSampleQuiz.id);
      await localQuizAttemptStore.clearSessionsForQuiz(testingSampleQuiz.id);
      window.localStorage.setItem(TESTING_DEMO_CLEANUP_MARKER, "1");
    })();
  }, []);

  const dashboardProfile = studentDashboardQuery.data?.profile ?? studentDashboardProfile;
  const assignments = studentDashboardQuery.data?.assignments ?? (apiEnabled ? [] : studentAssignments);
  const teacherAnnouncements = studentDashboardQuery.data
    ? studentDashboardQuery.data.teacherAnnouncements
    : apiEnabled
      ? []
      : studentTeacherAnnouncements;
  const [discussionPosts, setDiscussionPosts] = useState<StudentDiscussionFeedPost[]>(() =>
    createInitialDiscussionFeedPosts(studentDiscussionThreads),
  );
  const [discussionNotifications, setDiscussionNotifications] = useState<StudentDiscussionNotification[]>(() =>
    createInitialDiscussionNotifications(createInitialDiscussionFeedPosts(studentDiscussionThreads), locale),
  );

  const currentAssignment =
    viewState.type === "quiz"
      ? assignments.find((item) => item.id === viewState.assignmentId) ?? assignments[0]
      : assignments[0];
  const quizRuntimePortal = account?.viewerKind === "teacher" ? "lms" : "elearning";
  const openAssignments = assignments.filter((assignment) => assignment.status !== "submitted");
  const overdueAssignments = assignments.filter((assignment) => assignment.status === "overdue");
  const completedAssignments = assignments.filter((assignment) => assignment.status === "submitted");
  const averageAssignmentScore = Math.round(
    completedAssignments.reduce((sum, assignment) => sum + (assignment.score ?? 0), 0) /
      Math.max(completedAssignments.length, 1),
  );
  const priorityAssignment = openAssignments[0] ?? assignments[0];
  const pinnedAnnouncement = teacherAnnouncements.find((announcement) => announcement.isPinned) ?? teacherAnnouncements[0];
  const latestAnnouncement = teacherAnnouncements[0];
  const unreadAnnouncementCount = useMemo(
    () => teacherAnnouncements.filter((announcement) => !readAnnouncementIds.includes(announcement.id)).length,
    [readAnnouncementIds, teacherAnnouncements],
  );
  const discussionPreview = useMemo(() => getDiscussionOverviewPreview(discussionPosts), [discussionPosts]);

  useEffect(() => {
    function refreshViewerSession() {
      const nextSession = getCurrentElearningViewerSession();
      setAccount((currentSession) => {
        if (currentSession?.accessToken === nextSession?.accessToken && currentSession?.email === nextSession?.email) {
          return currentSession;
        }

        return nextSession;
      });
    }

    refreshViewerSession();
    window.addEventListener("focus", refreshViewerSession);
    window.addEventListener("storage", refreshViewerSession);
    window.addEventListener("erg-auth-session-replaced", refreshViewerSession);
    window.addEventListener("erg-auth-session-invalid", refreshViewerSession);

    return () => {
      window.removeEventListener("focus", refreshViewerSession);
      window.removeEventListener("storage", refreshViewerSession);
      window.removeEventListener("erg-auth-session-replaced", refreshViewerSession);
      window.removeEventListener("erg-auth-session-invalid", refreshViewerSession);
    };
  }, []);

  useEffect(() => {
    if (viewState.type === "quiz") {
      paceStateUpdate(() => setAnnouncementPopupOpen(false));
      return;
    }

    if (!latestAnnouncement) return;
    if (isAnnouncementPopupSnoozed(latestAnnouncement.id)) return;
    paceStateUpdate(() => setAnnouncementPopupOpen(true));
  }, [latestAnnouncement, paceStateUpdate, viewState.type]);

  useEffect(() => {
    if (!announcementPopupOpen) {
      autoCloseAnnouncementPopup.cancel();
      return;
    }

    autoCloseAnnouncementPopup.run();
    return () => autoCloseAnnouncementPopup.cancel();
  }, [announcementPopupOpen, autoCloseAnnouncementPopup]);

  useEffect(() => {
    function reopenAnnouncementPopup() {
      if (viewState.type === "quiz") return;
      if (!latestAnnouncement) return;
      if (document.visibilityState !== "visible") return;
      if (isAnnouncementPopupSnoozed(latestAnnouncement.id)) return;
      setAnnouncementPopupOpen(true);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        reopenAnnouncementPopup();
      }
    }

    window.addEventListener("focus", reopenAnnouncementPopup);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", reopenAnnouncementPopup);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [latestAnnouncement, viewState.type]);

  useEffect(() => {
    if (activePage !== "announcements") return;
    if (teacherAnnouncements.length === 0) return;

    paceStateUpdate(() =>
      setReadAnnouncementIds((currentIds) => {
        const nextIds = new Set(currentIds);
        teacherAnnouncements.forEach((announcement) => nextIds.add(announcement.id));
        return Array.from(nextIds);
      }),
    );
  }, [activePage, paceStateUpdate, teacherAnnouncements]);

  useEffect(() => {
    if (activePage !== "announcements" || !selectedAnnouncementId) return;
    scrollToAnnouncement.run(selectedAnnouncementId);
    return () => scrollToAnnouncement.cancel();
  }, [activePage, scrollToAnnouncement, selectedAnnouncementId]);

  useEffect(() => {
    if (activePage !== "discussion") return;
    const sharedPostId = new URLSearchParams(window.location.search).get("post");
    if (!sharedPostId) return;
    scrollToDiscussionPost.run(sharedPostId);
    return () => scrollToDiscussionPost.cancel();
  }, [activePage, scrollToDiscussionPost]);

  function openAssignment(assignmentId: string) {
    setViewState({ type: "quiz", assignmentId });
  }

  function handleSignIn() {
    navigate("/");
  }

  function handleSignOut() {
    logoutElearningViewerSession();
    setAccount(null);
    navigate("/");
  }

  function createDiscussionPost(content: string, attachments: StudentDiscussionImageAttachment[]) {
    const now = createTimestamp();
    const safeContent = maskProfanity(content);
    const postId = `discussion-post-${now}`;
    const nextPost: StudentDiscussionFeedPost = {
      id: postId,
      content: safeContent.value,
      authorName: dashboardProfile.name,
      authorInitials: getInitials(dashboardProfile.name),
      createdAtLabel: locale === "vi" ? "Vua xong" : "Just now",
      createdAtMs: now,
      className: dashboardProfile.className,
      attachments,
      moderationWarning: safeContent.hasProfanity,
      reactions: createReactionSummary(),
      comments: [],
      viewerReaction: null,
    };

    setDiscussionPosts((currentPosts) => [nextPost, ...currentPosts]);
    pushDiscussionNotification({
      id: `notification-${postId}`,
      primaryText: copy.notificationNewThread(nextPost.authorName),
      secondaryText: nextPost.content || copy.notificationImageOnly,
      replyId: undefined,
      threadId: postId,
      timeLabel: locale === "vi" ? "Vua xong" : "Just now",
      unread: true,
    });
  }

  function addDiscussionComment(
    postId: string,
    parentCommentId: string | undefined,
    content: string,
    attachments: StudentDiscussionImageAttachment[],
  ) {
    const safeContent = maskProfanity(content);
    const targetPost = discussionPosts.find((post) => post.id === postId);

    setDiscussionPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? addFeedComment({
              attachments,
              content: safeContent.value,
              createdAtLabel: locale === "vi" ? "Vua xong" : "Just now",
              moderationWarning: safeContent.hasProfanity,
              parentCommentId,
              post,
              viewer: {
                id: dashboardProfile.id,
                initials: getInitials(dashboardProfile.name),
                name: dashboardProfile.name,
              },
            })
          : post,
      ),
    );
    pushDiscussionNotification({
      id: `notification-comment-${postId}-${createTimestamp()}`,
      primaryText: copy.notificationNewReply(dashboardProfile.name),
      secondaryText: copy.notificationTopicContext(targetPost?.content.slice(0, 80) ?? copy.discussionTitle),
      replyId: parentCommentId,
      threadId: postId,
      timeLabel: locale === "vi" ? "Vua xong" : "Just now",
      unread: true,
    });
  }

  function toggleDiscussionPostReaction(postId: string, reaction: StudentDiscussionReactionKey) {
    setDiscussionPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? toggleFeedPostReaction(post, reaction) : post)),
    );
  }

  function toggleDiscussionCommentReaction(postId: string, commentId: string, reaction: StudentDiscussionReactionKey) {
    setDiscussionPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? toggleFeedCommentReaction(post, commentId, reaction) : post)),
    );
  }

  function pushDiscussionNotification(notification: StudentDiscussionNotification) {
    setDiscussionNotifications((currentNotifications) => [notification, ...currentNotifications].slice(0, 8));
  }

  function handleDiscussionNotificationClick(threadId: string, replyId?: string) {
    setActivePage("discussion");
    setNotificationAnchor(null);
    setDiscussionNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.threadId === threadId && notification.replyId === replyId
          ? { ...notification, unread: false }
          : notification,
      ),
    );
    scrollToDiscussionPost.run(threadId);
  }

  function markAnnouncementRead(announcementId: string) {
    setReadAnnouncementIds((currentIds) => (currentIds.includes(announcementId) ? currentIds : [...currentIds, announcementId]));
  }

  function openAnnouncementDetail(announcementId: string) {
    setAnnouncementPopupOpen(false);
    setSelectedAnnouncementId(announcementId);
    markAnnouncementRead(announcementId);
    setActivePage("announcements");
    setViewState({ type: "dashboard" });
  }

  function snoozeAnnouncementPopup(announcementId: string) {
    writeAnnouncementPopupSnooze(announcementId, Date.now() + ANNOUNCEMENT_POPUP_SNOOZE_MS);
    setAnnouncementPopupOpen(false);
  }

  if (viewState.type === "quiz" && currentAssignment) {
    return (
      <Box
        sx={{
          height: "100vh",
          overflow: "hidden",
          bgcolor: "#f3f6ff",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(246,248,255,0.88)), url('https://media.erg.edu.vn/logo/bg.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          color: MUI_TEXT,
          fontFamily: "Manrope Variable, sans-serif",
        }}
      >
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{
            bgcolor: "rgba(255,255,255,0.72)",
            borderBottom: "1px solid rgba(0,0,136,0.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 10px 34px rgba(0,0,136,0.05)",
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 48, md: 46 }, gap: { xs: 1, md: 1.5 }, px: { xs: 1.25, md: 2 } }}>
            <Button
              size="small"
              startIcon={<ArrowLeft size={18} />}
              variant="outlined"
              onClick={() => setViewState({ type: "dashboard" })}
              sx={{
                bgcolor: "rgba(255,255,255,0.64)",
                borderColor: "rgba(0,0,136,0.14)",
                borderRadius: 2,
                color: "#000088",
                fontWeight: 800,
                minHeight: 34,
                px: 1.35,
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.86)",
                  borderColor: "rgba(232,40,40,0.22)",
                },
              }}
            >
              {copy.backToDashboard}
            </Button>
            <Box sx={{ minWidth: 0, flex: 1, textAlign: "right" }}>
              <Typography noWrap variant="subtitle2" sx={{ color: "#000088", fontSize: { xs: 12, md: 13 }, fontWeight: 900, lineHeight: 1.2 }}>
                {currentAssignment.title}
              </Typography>
              <Typography noWrap variant="caption" sx={{ color: "rgba(28,37,46,0.62)", display: { xs: "none", md: "block" }, lineHeight: 1.15 }}>
                {copy.sessionDescription(currentAssignment.subjectLabel, currentAssignment.teacherName, currentAssignment.dueLabel)}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ height: { md: "calc(100vh - 46px)" }, overflow: "hidden", px: { xs: 0.75, md: 1 }, py: { xs: 0.75, md: 0.75 } }}>
          <PlayerShell
            assignmentId={currentAssignment.id}
            quizId={currentAssignment.quizId}
            runtimePortal={quizRuntimePortal}
            welcomeMeta={{
              authorName: currentAssignment.teacherName,
              courseLabel: currentAssignment.title,
              dueLabel: currentAssignment.dueLabel,
              reviewContent: currentAssignment.subtitle,
              subjectLabel: currentAssignment.subjectLabel,
              topics: [currentAssignment.subjectLabel, currentAssignment.statusLabel, currentAssignment.lastActivityLabel],
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: MUI_BG,
        color: MUI_TEXT,
        fontFamily: "Manrope Variable, sans-serif",
      }}
    >
      {latestAnnouncement ? (
        <AnnouncementToast
          announcement={latestAnnouncement}
          copy={copy}
          open={announcementPopupOpen}
          onClose={() => setAnnouncementPopupOpen(false)}
          onOpenDetail={openAnnouncementDetail}
          onSnooze={snoozeAnnouncementPopup}
        />
      ) : null}

      <TopMenuShell
        account={account}
        activePage={activePage}
        copy={copy}
        dashboardProfile={dashboardProfile}
        notificationAnchor={notificationAnchor}
        notifications={discussionNotifications}
        unreadAnnouncementCount={unreadAnnouncementCount}
        onAccountOpen={() => setActivePage("account")}
        onNotificationClose={() => setNotificationAnchor(null)}
        onNotificationClick={handleDiscussionNotificationClick}
        onNotificationOpen={(element) => setNotificationAnchor(element)}
        onPageChange={(page) => {
          setActivePage(page);
          setViewState({ type: "dashboard" });
        }}
        onSignOut={handleSignOut}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          mx: "auto",
          maxWidth: 1480,
          px: { xs: 2, md: 3 },
          py: { xs: 2.5, md: 3.25 },
          width: "100%",
        }}
      >
        {activePage === "overview" ? (
          <OverviewView
            announcement={pinnedAnnouncement}
            assignmentsLoading={studentDashboardQuery.isLoading && openAssignments.length === 0}
            copy={copy}
            discussionPreview={discussionPreview}
            openAssignments={openAssignments}
            overdueAssignments={overdueAssignments}
            completedAssignments={completedAssignments}
            priorityAssignment={priorityAssignment}
            profile={dashboardProfile}
            onOpenAssignment={openAssignment}
            onPageChange={setActivePage}
          />
        ) : null}

        {activePage === "assignments" ? (
          <AssignmentsView
            assignments={assignments}
            completedAssignments={completedAssignments}
            copy={copy}
            openAssignments={openAssignments}
            overdueAssignments={overdueAssignments}
            onOpenAssignment={openAssignment}
          />
        ) : null}

        {activePage === "scores" ? <ScoresView assignments={assignments} copy={copy} /> : null}

        {activePage === "discussion" ? (
          <DiscussionView
            copy={copy}
            posts={discussionPosts}
            studentClass={dashboardProfile.className}
            onAddComment={addDiscussionComment}
            onCommentReaction={toggleDiscussionCommentReaction}
            onCreatePost={createDiscussionPost}
            onPostReaction={toggleDiscussionPostReaction}
          />
        ) : null}

        {activePage === "announcements" ? (
          <AnnouncementsView
            announcements={teacherAnnouncements}
            copy={copy}
            selectedAnnouncementId={selectedAnnouncementId}
          />
        ) : null}

        {activePage === "account" ? (
          <AccountView
            account={account}
            averageAssignmentScore={averageAssignmentScore}
            copy={copy}
            openAssignments={openAssignments}
            profile={dashboardProfile}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        ) : null}
      </Box>

      <ElearningFooter />
    </Box>
  );
}

function TopMenuShell({
  account,
  activePage,
  copy,
  dashboardProfile,
  notificationAnchor,
  notifications,
  unreadAnnouncementCount,
  onAccountOpen,
  onNotificationClose,
  onNotificationClick,
  onNotificationOpen,
  onPageChange,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
  copy: DashboardCopy;
  dashboardProfile: StudentDashboardProfile;
  notificationAnchor: HTMLElement | null;
  notifications: StudentDiscussionNotification[];
  unreadAnnouncementCount: number;
  onAccountOpen: () => void;
  onNotificationClose: () => void;
  onNotificationClick: (threadId: string, replyId?: string) => void;
  onNotificationOpen: (element: HTMLElement) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignOut: () => void;
}) {
  const unreadDiscussionCount = notifications.filter((item) => item.unread).length;
  const totalUnread = unreadAnnouncementCount + unreadDiscussionCount;

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        bgcolor: "rgba(243,246,250,0.82)",
        borderBottom: "none",
        backdropFilter: "blur(22px)",
        boxShadow: "none",
        overflow: "visible",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1, md: 1.15 },
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 68 },
          alignItems: { xs: "center", md: "stretch" },
          bgcolor: "#fff",
          border: `1px solid ${MUI_BORDER}`,
          borderRadius: { xs: "18px", md: "20px" },
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 18px 42px rgba(16,24,40,0.08)",
          flexWrap: { xs: "wrap", md: "nowrap" },
          gap: { xs: 1.25, md: 2 },
          mx: "auto",
          px: { xs: 1.25, md: 1.75 },
          py: { xs: 0.8, md: 0 },
          width: "100%",
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ minWidth: { xs: 0, md: 220 }, order: { xs: 1, md: 0 } }}
        >
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "transparent",
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
              color: MUI_NAVY,
              display: "flex",
              flexShrink: 0,
              fontWeight: 800,
              height: 40,
              justifyContent: "center",
              overflow: "hidden",
              p: 0,
              position: "relative",
              width: 104,
            }}
          >
            <Box
              component="img"
              alt="ERG"
              src={LOGO_URL}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              sx={{ display: "block", height: "100%", objectFit: "contain", width: "100%" }}
            />
          </Box>
        </Stack>

        <Tabs
          value={activePage}
          variant="scrollable"
          scrollButtons="auto"
          onChange={(_, nextValue: StudentPageKey) => onPageChange(nextValue)}
          sx={{
            flex: { xs: "0 0 100%", md: 1 },
            alignSelf: "center",
            bgcolor: "#fff",
            border: "none",
            borderRadius: 0,
            boxShadow: "none",
            minWidth: 0,
            order: { xs: 3, md: 0 },
            px: { xs: 0, md: 0.5 },
            width: { xs: "100%", md: "auto" },
            "& .MuiTabs-indicator": {
              background: `linear-gradient(90deg, ${MUI_PRIMARY} 0%, ${MUI_PRIMARY} 68%, ${MUI_RED} 100%)`,
              borderRadius: 999,
              height: 3,
            },
            "& .MuiTabs-flexContainer": { height: "100%", alignItems: "center" },
            "& .MuiTab-root": {
              mx: { xs: 0.1, md: 0.15 },
              minHeight: { xs: 42, md: 48 },
              borderRadius: "12px",
              color: MUI_MUTED,
              fontWeight: 800,
              whiteSpace: "nowrap",
              px: { xs: 1.15, md: 1.65 },
              transition: "background 180ms ease, color 180ms ease, box-shadow 180ms ease",
              "&:hover": {
                bgcolor: "rgba(15,108,189,0.055)",
                boxShadow: "none",
                color: MUI_NAVY,
              },
              "&.Mui-selected": {
                bgcolor: "transparent",
                boxShadow: "none",
                color: MUI_PRIMARY,
              },
            },
          }}
        >
          {copy.navItems.map((item) => (
            <Tab
              key={item.key}
              icon={<Box component="span" sx={{ display: "inline-flex", lineHeight: 0 }}>{item.icon}</Box>}
              iconPosition="start"
              label={item.label}
              value={item.key}
            />
          ))}
          <Tab icon={<User size={16} />} iconPosition="start" label={copy.accountTitle} value="account" />
        </Tabs>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ flexShrink: 0, ml: "auto", order: { xs: 2, md: 0 } }}
        >
          <Tooltip title={copy.notificationTitle}>
            <IconButton
              aria-label={copy.notificationTitle}
              onClick={(event) => onNotificationOpen(event.currentTarget)}
              sx={{
                border: `1px solid ${MUI_BORDER}`,
                borderRadius: "14px",
                bgcolor: "#fff",
                boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 8px 18px rgba(16,24,40,0.06)",
                color: MUI_PRIMARY,
                "&:hover": {
                  borderColor: "rgba(15,108,189,0.24)",
                  bgcolor: "rgba(15,108,189,0.06)",
                },
              }}
            >
              <Badge color="error" badgeContent={totalUnread}>
                <Bell size={18} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={account ? copy.signOut : copy.accountTitle}>
            <IconButton
              aria-label={account ? copy.signOut : copy.accountTitle}
              onClick={account ? onSignOut : onAccountOpen}
              sx={{ p: 0.25 }}
            >
              <Avatar
                sx={{
                  bgcolor: MUI_NAVY,
                  border: "1px solid rgba(255,255,255,0.86)",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.08), 0 8px 18px rgba(16,24,40,0.14)",
                  color: "#fff",
                  fontWeight: 900,
                }}
              >
                {(account?.name ?? dashboardProfile.name).slice(0, 1)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={onNotificationClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 360,
              maxWidth: "calc(100vw - 24px)",
              borderColor: MUI_DIVIDER,
              boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {copy.notificationTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalUnread ? `${totalUnread} unread updates` : copy.notificationEmpty}
          </Typography>
        </Box>
        <Divider />
        {notifications.length ? (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => onNotificationClick(notification.threadId, notification.replyId)}
              sx={{ alignItems: "flex-start", gap: 1.25, py: 1.25, whiteSpace: "normal" }}
            >
              <Box
                sx={{
                  bgcolor: notification.unread ? "rgba(15,108,189,0.08)" : "rgba(145,158,171,0.12)",
                  borderRadius: 1.5,
                  color: notification.unread ? MUI_PRIMARY : MUI_MUTED,
                  display: "grid",
                  flex: "0 0 32px",
                  height: 32,
                  placeItems: "center",
                  width: 32,
                }}
              >
                <MessageSquare size={16} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: MUI_TEXT, fontWeight: 700, lineHeight: 1.35 }}>
                  {notification.primaryText}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  {notification.secondaryText}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>{copy.notificationEmpty}</MenuItem>
        )}
      </Menu>
    </AppBar>
  );
}

function ElearningFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#F8FAFC",
        mt: "auto",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${MUI_RED} 0%, ${MUI_PRIMARY} 58%, ${MUI_RED} 100%)` }} />
      <Box
        sx={{
          minHeight: { xs: 168, md: 196 },
          px: { xs: 2.25, md: 3 },
          pt: { xs: 3.5, md: 4.5 },
          pb: { xs: 8.5, md: 10 },
          position: "relative",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.8, sm: 2.5 }}
          alignItems={{ xs: "center", sm: "flex-start" }}
          justifyContent={{ xs: "center", sm: "flex-start" }}
          sx={{ maxWidth: 1120, mx: "auto", position: "relative", zIndex: 1 }}
        >
          <Stack spacing={1.2} alignItems={{ xs: "center", sm: "flex-start" }} sx={{ maxWidth: 460, textAlign: { xs: "center", sm: "left" } }}>
            <Stack direction="row" spacing={1.35} alignItems="center">
              <Box component="img" alt="ERG" src={LOGO_URL} sx={{ display: "block", height: { xs: 42, md: 52 }, objectFit: "contain", width: { xs: 108, md: 136 } }} />
              <Typography variant="subtitle1" sx={{ color: "#020B7A", fontWeight: 950, lineHeight: 1.1 }}>
                Elearning
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#30405C", fontWeight: 650, lineHeight: 1.65 }}>
              Không gian học tập trực tuyến ERG, gọn gàng và tập trung cho mỗi buổi học.
            </Typography>
          </Stack>
        </Stack>

        <Box
          component="svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 170"
          aria-hidden="true"
          sx={{
            bottom: 0,
            display: "block",
            height: { xs: 78, md: 104 },
            left: 0,
            position: "absolute",
            width: "100%",
          }}
        >
          <path
            d="M0 62C150 88 306 97 464 80C641 61 734 22 929 44C1125 66 1254 132 1440 101V170H0V62Z"
            fill="#02058F"
          />
          <path
            d="M0 76C158 105 315 111 482 93C666 72 752 37 936 58C1136 81 1268 140 1440 116V170H0V76Z"
            fill="#000778"
            opacity="0.9"
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            bottom: { xs: 14, md: 18 },
            color: "rgba(255,255,255,0.82)",
            fontWeight: 650,
            left: "50%",
            position: "absolute",
            textAlign: "center",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          © 2026 ERG Elearning
        </Typography>
      </Box>
    </Box>
  );
}
function OverviewView({
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
                {copy.heroTitle(profile.name)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, maxWidth: 760, color: MUI_MUTED, lineHeight: 1.7 }}>
                {priorityAssignment ? copy.heroDescription(priorityAssignment.title) : copy.assignmentsDescription}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1 }}>
                {priorityAssignment ? (
                  <Button
                    variant="contained"
                    onClick={() => onOpenAssignment(priorityAssignment.id)}
                    sx={{
                      ...primaryButtonSx,
                      borderRadius: 2.5,
                      px: 2.2,
                    }}
                  >
                    {copy.primaryAction}
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
        <MetricCard icon={<BookOpenCheck size={20} />} label={copy.stats.open} value={openAssignments.length} />
        <MetricCard icon={<Clock3 size={20} />} label={copy.stats.overdue} tone="error" value={overdueAssignments.length} />
        <MetricCard icon={<CheckCircle2 size={20} />} label={copy.stats.completed} tone="success" value={`${completedAssignments.length}/${openAssignments.length + completedAssignments.length}`} />
        <MetricCard icon={<GraduationCap size={20} />} label={copy.stats.average} tone="info" value={profile.averageScore} />
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

function AssignmentsView({
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
        icon={<ClipboardCheck size={20} />}
        title={copy.assignmentsTitle}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <MetricCard icon={<BookOpenCheck size={18} />} label={copy.stats.open} value={openAssignments.length} />
        <MetricCard icon={<Clock3 size={18} />} label={copy.stats.overdue} tone="error" value={overdueAssignments.length} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={copy.stats.completed} tone="success" value={`${completedAssignments.length}/${assignments.length}`} />
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

function AnnouncementsView({
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
      <PageHeader description={copy.announcementDescription} icon={<Bell size={20} />} title={copy.announcementTitle} />
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

function AccountView({
  account,
  averageAssignmentScore,
  copy,
  openAssignments,
  profile,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  averageAssignmentScore: number;
  copy: DashboardCopy;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  return (
    <Stack spacing={2}>
      <PageHeader description={copy.accountDescription} icon={<User size={20} />} title={copy.accountTitle} />
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
              <MetricCard icon={<Sparkles size={18} />} label={copy.stats.average} value={averageAssignmentScore} />
              <MetricCard icon={<CheckCircle2 size={18} />} label={copy.stats.completed} tone="success" value={profile.completedAssignments} />
              <MetricCard icon={<BookOpenCheck size={18} />} label={copy.assignmentsTitle} value={`${profile.completedAssignments}/${profile.totalAssignments}`} />
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
                <ShieldCheck size={18} />
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
                  <User size={16} color={MUI_MUTED} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {account?.name ?? copy.guestLabel}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Mail size={16} color={MUI_MUTED} />
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
              <Button startIcon={<LogIn size={16} />} variant="contained" onClick={onSignIn} sx={{ ...primaryButtonSx, borderRadius: 2.25, minHeight: 42 }}>
                {copy.signIn}
              </Button>
              <Button startIcon={<LogOut size={16} />} color="error" variant="outlined" onClick={onSignOut} sx={{ borderRadius: 2.25, fontWeight: 900, minHeight: 42 }}>
                {copy.signOut}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function PageHeader({ description, icon, title }: { description: string; icon: ReactNode; title: string }) {
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

function SectionCard({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
  return (
    <Card sx={elevatedCardSx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${MUI_DIVIDER}`, px: 2.5, py: 1.85 }}>
        <Typography variant="subtitle1" sx={{ color: MUI_TEXT, fontWeight: 900 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>{children}</CardContent>
    </Card>
  );
}

function PriorityPanel({
  assignment,
  copy,
  onOpenAssignment,
}: {
  assignment: StudentDashboardAssignment;
  copy: DashboardCopy;
  onOpenAssignment: (assignmentId: string) => void;
}) {
  return (
    <Paper
      sx={{
        alignSelf: "stretch",
        bgcolor: MUI_NAVY,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        boxShadow: "0 18px 38px rgba(16,24,40,0.16)",
        color: "#fff",
        minWidth: { md: 360 },
        overflow: "hidden",
        p: 2.2,
        position: "relative",
      }}
    >
      <Chip label={copy.priority.title} size="small" sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 700 }} />
      <Typography variant="subtitle1" sx={{ mt: 1.5, color: "#fff", fontWeight: 800 }}>
        {assignment.title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>
        {copy.priority.detail(assignment.dueLabel)}
      </Typography>
      <LinearProgress
        value={assignment.progressRate}
        variant="determinate"
        sx={{
          height: 10,
          mt: 2,
          bgcolor: "rgba(255,255,255,0.16)",
          borderRadius: 99,
          "& .MuiLinearProgress-bar": { bgcolor: "#8FD0FF", borderRadius: 99 },
        }}
      />
      <Button
        fullWidth
        variant="contained"
        onClick={() => onOpenAssignment(assignment.id)}
        sx={{
          ...primaryButtonSx,
          borderRadius: 2.2,
          mt: 2,
        }}
      >
        {copy.priority.action}
      </Button>
    </Paper>
  );
}

function MetricCard({
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

function AssignmentListItem({
  assignment,
  copy,
  onOpenAssignment,
}: {
  assignment: StudentDashboardAssignment;
  copy: DashboardCopy;
  onOpenAssignment: (assignmentId: string) => void;
}) {
  const statusTone = assignment.status === "overdue" ? "#FF5630" : assignment.status === "submitted" ? "#22C55E" : assignment.status === "in_progress" ? MUI_PRIMARY : "#637381";

  return (
    <Paper
      sx={{
        ...elevatedPaperSx,
        p: { xs: 1.45, md: 1.6 },
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        "&:hover": {
          borderColor: "rgba(15,108,189,0.22)",
          boxShadow: "0 10px 28px rgba(16,32,51,0.07)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 0.75 }}>
            <StatusChip status={assignment.status} label={assignment.statusLabel} />
            <Chip label={assignment.subjectLabel} size="small" variant="outlined" />
          </Stack>
          <Typography variant="subtitle2" sx={{ color: MUI_TEXT, fontWeight: 900 }}>
            {assignment.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
            {assignment.subtitle}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {assignment.teacherName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {assignment.dueLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {assignment.answeredCount}/{assignment.totalQuestions}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ minWidth: { xs: "100%", md: 260 } }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">{copy.progressLabel}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>{assignment.progressRate}%</Typography>
          </Stack>
          <LinearProgress
            value={assignment.progressRate}
            variant="determinate"
            color={assignment.status === "overdue" ? "error" : "primary"}
            sx={{
              height: 10,
              mt: 0.75,
              bgcolor: "rgba(15,108,189,0.1)",
              borderRadius: 99,
              "& .MuiLinearProgress-bar": { bgcolor: statusTone, borderRadius: 99 },
            }}
          />
        </Box>
        <Button
          variant={assignment.status === "submitted" ? "outlined" : "contained"}
          onClick={() => onOpenAssignment(assignment.id)}
          sx={{
            borderRadius: 2.5,
            flexShrink: 0,
            fontWeight: 900,
            minWidth: 128,
            ...(assignment.status === "submitted" ? {} : primaryButtonSx),
          }}
        >
          {copy.assignmentAction(assignment.status)}
        </Button>
      </Stack>
    </Paper>
  );
}

function AnnouncementCard({ announcement, selected }: { announcement: StudentTeacherAnnouncement; selected: boolean }) {
  return (
    <Paper
      id={`student-announcement-${announcement.id}`}
      sx={{
        bgcolor: selected ? "rgba(15,108,189,0.035)" : "#fff",
        border: `1px solid ${selected ? "rgba(15,108,189,0.22)" : MUI_DIVIDER}`,
        borderLeft: `4px solid ${announcement.isPinned ? MUI_PRIMARY : "transparent"}`,
        borderRadius: "14px",
        boxShadow: "none",
        p: { xs: 1.4, md: 1.65 },
        transition: "background 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          bgcolor: "rgba(248,250,252,0.78)",
          borderColor: "rgba(15,108,189,0.18)",
        },
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            {announcement.isPinned ? <Chip label="Pinned" size="small" sx={{ bgcolor: "rgba(15,108,189,0.08)", color: MUI_PRIMARY, fontWeight: 850 }} /> : null}
            <Chip label={announcement.targetLabel} size="small" variant="outlined" />
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 1, color: MUI_TEXT, fontWeight: 900 }}>
            {announcement.title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: MUI_MUTED, lineHeight: 1.7 }}>
            {announcement.content}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: { xs: "left", sm: "right" } }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{announcement.teacherName}</Typography>
          <Typography variant="caption" color="text.secondary">{announcement.createdAtLabel}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function AnnouncementToast({
  announcement,
  copy,
  open,
  onClose,
  onOpenDetail,
  onSnooze,
}: {
  announcement: StudentTeacherAnnouncement;
  copy: DashboardCopy;
  open: boolean;
  onClose: () => void;
  onOpenDetail: (announcementId: string) => void;
  onSnooze: (announcementId: string) => void;
}) {
  if (!open) return null;

  return (
    <Card
      sx={{
        bottom: { xs: 14, sm: 18 },
        border: `1px solid ${MUI_BORDER}`,
        borderRadius: { xs: 2.75, sm: 3 },
        boxShadow: "0 18px 54px rgba(15,23,42,0.16)",
        left: { xs: 14, sm: "auto" },
        maxWidth: "calc(100vw - 32px)",
        position: "fixed",
        right: { xs: 14, sm: 18 },
        width: { xs: "auto", sm: 368 },
        zIndex: 1400,
      }}
    >
      <CardContent sx={{ p: { xs: 1.55, sm: 2.25 } }}>
        <Stack spacing={{ xs: 0.9, sm: 1.15 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={copy.announcementPinnedLabel} color="warning" size="small" />
            <Typography variant="caption" color="text.secondary">{copy.announcementPopupAutoDismiss}</Typography>
          </Stack>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{announcement.title}</Typography>
          <Typography
            variant="body2"
            sx={{
              color: MUI_MUTED,
              display: "-webkit-box",
              lineHeight: 1.55,
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: { xs: 2, sm: 4 },
            }}
          >
            {announcement.content}
          </Typography>
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

function StatusChip({ label, status }: { label: string; status: StudentAssignmentStatus }) {
  const color =
    status === "submitted" ? "success" : status === "overdue" ? "error" : status === "in_progress" ? "info" : "default";
  return <Chip color={color} label={label} size="small" sx={{ borderRadius: 2, fontWeight: 800 }} />;
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <Paper sx={{ ...elevatedPaperSx, p: 2.2, bgcolor: "#F9FAFD" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
    </Paper>
  );
}

function SkeletonRow() {
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
