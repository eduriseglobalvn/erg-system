import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import ArrowLeft from "@mui/icons-material/ArrowBackRounded";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  PlayerShell,
} from "@/components/quiz/player-shell";
import {
  getCurrentElearningViewerSession,
  logoutElearningViewerSession,
  type ElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";
import {
  useI18n,
} from "@/platform/i18n";
import {
  useNavigate,
} from "@tanstack/react-router";
import { studentPath } from "@/platform/workspaces/workspace-paths";
import { studentDiscussionThreads } from "@/features/elearning/student-dashboard/api/mock-student-dashboard";
import {
  createStudentDashboardLoadingProfile,
  studentDashboardQueryOptions,
} from "@/features/elearning/student-dashboard/api/student-dashboard-query";
import {
  createStudentDiscussion,
  markStudentAnnouncementRead as markStudentAnnouncementReadApi,
  replyStudentDiscussion,
  setStudentDiscussionReaction,
} from "@/features/elearning/student-dashboard/api/student-engagement-api";
import {
  studentDiscussionFeedQueryOptions,
  studentEngagementQueryKeys,
} from "@/features/elearning/student-dashboard/api/student-engagement-query";
import {
  DiscussionView,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-view";
import {
  ScoresView,
} from "@/features/elearning/student-dashboard/components/student-dashboard-scores-view";
import {
  enCopy,
  viCopy,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  DashboardCopy,
  StudentDockPageKey,
  StudentDiscussionNotification,
  StudentPageKey,
  StudentViewState,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDiscussionImageAttachment,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  addFeedComment,
  createReactionSummary,
  toggleFeedCommentReaction,
  toggleFeedPostReaction,
} from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import {
  getDiscussionOverviewPreview,
} from "@/features/elearning/student-dashboard/utils/discussion-overview";
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
import {
  useDebouncedCallback,
} from "@/hooks/use-paced-callback";
import {
  usePacedStateBatch,
} from "@/hooks/use-paced-state-batch";
import {
  hasApiBase,
} from "@/lib/api-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import {
  getDefaultTenantId,
} from "@/lib/graphql-client";
import {
  MUI_TEXT,
  MUI_BG,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import { AnnouncementToast } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import { AccountView, AnnouncementsView, AssignmentsView } from "@/features/elearning/student-dashboard/components/student-dashboard-content-views";
import { TopMenuShell } from "@/features/elearning/student-dashboard/components/student-dashboard-top-menu";
import { StudentDashboardMobileShell } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-shell";
import { StudentDashboardOverviewSurface } from "@/features/elearning/student-dashboard/components/student-dashboard-overview-surface";
import { useDashboardSurface } from "@/features/elearning/student-dashboard/hooks/use-dashboard-surface";

export function StudentDashboardWorkspaceRuntime() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const surface = useDashboardSurface();
  const copy: DashboardCopy = locale === "vi" ? viCopy : enCopy;
  const [activePage, setActivePage] = useState<StudentPageKey>(() => {
    if (typeof window === "undefined") return "overview";
    return initialStudentPage(window.location.search);
  });
  const [viewState, setViewState] = useState<StudentViewState>({ type: "dashboard" });
  const [account, setAccount] = useState<ElearningViewerSession | null>(() => getCurrentElearningViewerSession());
  const fixtureMode = runtimeFixturesEnabled();
  const apiEnabled = hasApiBase() && !fixtureMode;
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

  const studentDashboardQuery = useQuery(studentDashboardQueryOptions({
    accountId: account?.id,
    tenantId,
  }));
  const engagementScope = { accountId: account?.id, tenantId };
  const discussionFeedQuery = useQuery(studentDiscussionFeedQueryOptions(engagementScope));

  const dashboardProfile = studentDashboardQuery.data?.profile ?? createStudentDashboardLoadingProfile(account);
  const assignments = useMemo(
    () => studentDashboardQuery.data?.assignments ?? [],
    [studentDashboardQuery.data?.assignments],
  );
  const teacherAnnouncements = useMemo(
    () => studentDashboardQuery.data?.teacherAnnouncements ?? [],
    [studentDashboardQuery.data?.teacherAnnouncements],
  );
  const [discussionPosts, setDiscussionPosts] = useState<StudentDiscussionFeedPost[]>(() =>
    fixtureMode ? createInitialDiscussionFeedPosts(studentDiscussionThreads) : [],
  );
  const [discussionNotifications, setDiscussionNotifications] = useState<StudentDiscussionNotification[]>(() =>
    fixtureMode
      ? createInitialDiscussionNotifications(createInitialDiscussionFeedPosts(studentDiscussionThreads), locale)
      : [],
  );
  const discussionCommandMutation = useMutation({
    mutationFn: (command: { apply: () => void; execute: () => Promise<unknown> }) => command.execute(),
    onError: (_error, _command, context) => {
      if (context?.previousPosts) setDiscussionPosts(context.previousPosts);
    },
    onMutate: (command: { apply: () => void; execute: () => Promise<unknown> }) => {
      const previousPosts = discussionPosts;
      command.apply();
      return { previousPosts };
    },
    onSettled: () => queryClient.invalidateQueries({
      exact: true,
      queryKey: studentEngagementQueryKeys.feed(engagementScope),
    }),
  });
  const announcementReadMutation = useMutation({
    mutationFn: (announcementId: string) => markStudentAnnouncementReadApi({ announcementId, tenantId }),
    onError: (_error, announcementId, context) => {
      if (!context?.wasRead) setReadAnnouncementIds((ids) => ids.filter((id) => id !== announcementId));
    },
    onMutate: (announcementId: string) => {
      const wasRead = readAnnouncementIds.includes(announcementId);
      setReadAnnouncementIds((ids) => (ids.includes(announcementId) ? ids : [...ids, announcementId]));
      return { wasRead };
    },
    onSettled: () => queryClient.invalidateQueries({
      exact: true,
      queryKey: studentDashboardQueryOptions(engagementScope).queryKey,
    }),
  });
  const markAnnouncementReadOnServer = announcementReadMutation.mutate;

  useEffect(() => {
    if (!apiEnabled || !discussionFeedQuery.data) return;
    setDiscussionPosts(discussionFeedQuery.data.items);
  }, [apiEnabled, discussionFeedQuery.data]);

  const currentAssignment = viewState.type === "quiz"
    ? assignments.find((item) => item.id === viewState.assignmentId)
    : undefined;
  const quizRuntimePortal = account?.viewerKind === "teacher" ? "lms" : "elearning";
  const openAssignments = assignments.filter((assignment) => assignment.status !== "submitted");
  const overdueAssignments = assignments.filter((assignment) => assignment.status === "overdue");
  const completedAssignments = assignments.filter((assignment) => assignment.status === "submitted");
  const averageAssignmentScore = dashboardProfile.averageScore;
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

    if (apiEnabled) {
      teacherAnnouncements
        .filter((announcement) => !readAnnouncementIds.includes(announcement.id))
        .forEach((announcement) => markAnnouncementReadOnServer(announcement.id));
      return;
    }

    paceStateUpdate(() =>
      setReadAnnouncementIds((currentIds) => {
        const nextIds = new Set(currentIds);
        teacherAnnouncements.forEach((announcement) => nextIds.add(announcement.id));
        return Array.from(nextIds);
      }),
    );
  }, [activePage, apiEnabled, markAnnouncementReadOnServer, paceStateUpdate, readAnnouncementIds, teacherAnnouncements]);

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
    void navigate({ href: studentPath("/") });
  }

  function handleSignOut() {
    logoutElearningViewerSession();
    setAccount(null);
    void navigate({ href: studentPath("/") });
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

    const apply = () => setDiscussionPosts((currentPosts) => [nextPost, ...currentPosts]);
    if (apiEnabled) {
      discussionCommandMutation.mutate({
        apply,
        execute: () => createStudentDiscussion({
          attachmentIds: attachments.map((attachment) => attachment.id),
          content: safeContent.value,
          idempotencyKey: postId,
          tenantId,
          title: safeContent.value.slice(0, 120) || copy.discussionTitle,
        }),
      });
    } else {
      apply();
    }
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

    const apply = () => setDiscussionPosts((currentPosts) =>
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
    if (apiEnabled) {
      discussionCommandMutation.mutate({
        apply,
        execute: () => replyStudentDiscussion({
          attachmentIds: attachments.map((attachment) => attachment.id),
          content: safeContent.value,
          idempotencyKey: `reply-${postId}-${createTimestamp()}`,
          parentCommentId,
          postId,
          tenantId,
        }),
      });
    } else {
      apply();
    }
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
    const apply = () => setDiscussionPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? toggleFeedPostReaction(post, reaction) : post)),
    );
    if (apiEnabled) {
      discussionCommandMutation.mutate({
        apply,
        execute: () => setStudentDiscussionReaction({ reaction, targetId: postId, targetType: "POST", tenantId }),
      });
    } else {
      apply();
    }
  }

  function toggleDiscussionCommentReaction(postId: string, commentId: string, reaction: StudentDiscussionReactionKey) {
    const apply = () => setDiscussionPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? toggleFeedCommentReaction(post, commentId, reaction) : post)),
    );
    if (apiEnabled) {
      discussionCommandMutation.mutate({
        apply,
        execute: () => setStudentDiscussionReaction({ reaction, targetId: commentId, targetType: "COMMENT", tenantId }),
      });
    } else {
      apply();
    }
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
    if (apiEnabled) {
      if (!readAnnouncementIds.includes(announcementId)) markAnnouncementReadOnServer(announcementId);
      return;
    }
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

  if (viewState.type === "quiz" && !currentAssignment) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: MUI_BG, p: 3 }}>
        <Box sx={{ maxWidth: 520, width: "100%", bgcolor: "#fff", border: "1px solid rgba(16,24,40,0.1)", borderRadius: 3, p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Không tìm thấy bài được giao</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bài này không còn trong dữ liệu tài khoản hiện tại. Không thể mở bằng một bài khác.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={() => setViewState({ type: "dashboard" })}>
            Quay lại bảng học tập
          </Button>
        </Box>
      </Box>
    );
  }

  if (viewState.type === "quiz" && currentAssignment && !currentAssignment.quizId) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: MUI_BG, p: 3 }}>
        <Box sx={{ maxWidth: 560, width: "100%", bgcolor: "#fff", border: "1px solid rgba(16,24,40,0.1)", borderRadius: 3, p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Assessment chưa sẵn sàng</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Backend chưa trả về quiz gắn với “{currentAssignment.title}”. Hệ thống không tự suy đoán quiz từ assignment id.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={() => setViewState({ type: "dashboard" })}>
            Quay lại bảng học tập
          </Button>
        </Box>
      </Box>
    );
  }

  if (viewState.type === "quiz" && currentAssignment) {
    const subjectLabel = currentAssignment.subjectLabel ?? "Chưa có môn học";
    const teacherName = currentAssignment.teacherName ?? "Chưa có giáo viên";
    const subtitle = currentAssignment.subtitle ?? "Chưa có mô tả";
    const lastActivityLabel = currentAssignment.lastActivityLabel ?? "Chưa có hoạt động";
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
          fontFamily: "var(--font-app)",
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
              startIcon={<ArrowLeft sx={{ fontSize: 18 }} />}
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
                {copy.sessionDescription(subjectLabel, teacherName, currentAssignment.dueLabel)}
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
              authorName: teacherName,
              courseLabel: currentAssignment.title,
              dueLabel: currentAssignment.dueLabel,
              reviewContent: subtitle,
              subjectLabel,
              topics: [subjectLabel, currentAssignment.statusLabel, lastActivityLabel],
            }}
          />
        </Box>
      </Box>
    );
  }

  const handlePageChange = (page: StudentPageKey) => {
    setActivePage(page);
    setViewState({ type: "dashboard" });
  };
  const mobileDockItems = useMemo(() => [
    ...copy.navItems.map((item) => ({ ...item, key: item.key as StudentDockPageKey, label: item.key === "scores" ? (locale === "vi" ? "Khóa học" : "Courses") : item.key === "assignments" ? (locale === "vi" ? "Bài tập" : "Tasks") : item.label })),
    { key: "account" as const, label: locale === "vi" ? "Hồ sơ" : "Profile", icon: null },
  ], [copy.navItems, locale]);
  const currentPageLabel = activePage === "account" ? copy.accountTitle : copy.navItems.find((item) => item.key === activePage)?.label ?? copy.heroEyebrow;
  const announcementToast = latestAnnouncement ? (
    <AnnouncementToast
      announcement={latestAnnouncement} copy={copy} open={announcementPopupOpen}
      onClose={() => setAnnouncementPopupOpen(false)} onOpenDetail={openAnnouncementDetail} onSnooze={snoozeAnnouncementPopup}
    />
  ) : null;
  const dashboardViews = (
    <>
      {studentDashboardQuery.isError ? (
        <Alert action={<Button color="inherit" onClick={() => void studentDashboardQuery.refetch()} size="small" sx={{ color: "error.dark", fontWeight: 800 }}>Thử lại</Button>} severity="error" sx={{ borderRadius: 2.5, color: "error.dark", mb: 2 }}>Không thể tải bảng học tập từ máy chủ.</Alert>
      ) : null}
      {activePage === "overview" ? (
        <StudentDashboardOverviewSurface
          announcement={pinnedAnnouncement} assignmentsLoading={studentDashboardQuery.isLoading && openAssignments.length === 0}
          completedAssignments={completedAssignments} copy={copy} discussionPreview={discussionPreview}
          openAssignments={openAssignments} overdueAssignments={overdueAssignments} priorityAssignment={priorityAssignment}
          profile={dashboardProfile} surface={surface} onOpenAssignment={openAssignment} onPageChange={setActivePage}
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
    </>
  );

  if (surface === "mobile-web") {
    return (
      <Box sx={{ bgcolor: MUI_BG, color: MUI_TEXT, fontFamily: "var(--font-app)", minHeight: "100vh" }}>
        {announcementToast}
        <StudentDashboardMobileShell
          activePage={activePage} announcementUnreadCount={unreadAnnouncementCount} currentPageLabel={currentPageLabel}
          dockItems={mobileDockItems} studentName={account?.name ?? dashboardProfile.name}
          onAccountOpen={() => handlePageChange("account")} onAnnouncementsOpen={() => handlePageChange("announcements")} onPageChange={handlePageChange}
        >
          <Box sx={{ px: 2, py: 2.5 }}>{dashboardViews}</Box>
        </StudentDashboardMobileShell>
      </Box>
    );
  }

  return (
    <Box sx={{ color: MUI_TEXT, fontFamily: "var(--font-app)", minHeight: "100vh" }}>
      {announcementToast}
      <TopMenuShell
        account={account}
        activePage={activePage}
        copy={copy}
        dashboardProfile={dashboardProfile}
        notificationAnchor={notificationAnchor}
        notifications={discussionNotifications}
        unreadAnnouncementCount={unreadAnnouncementCount}
        onAccountOpen={() => handlePageChange("account")}
        onNotificationClose={() => setNotificationAnchor(null)}
        onNotificationClick={handleDiscussionNotificationClick}
        onNotificationOpen={(element) => setNotificationAnchor(element)}
        onPageChange={handlePageChange}
        onSignOut={handleSignOut}
      >
        {dashboardViews}
      </TopMenuShell>
    </Box>
  );
}

function initialStudentPage(search: string): StudentPageKey {
  const page = new URLSearchParams(search).get("tab");
  return page === "assignments" || page === "scores" || page === "discussion" || page === "announcements" || page === "account" ? page : "overview";
}
