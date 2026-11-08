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
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {
  logoutElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";
import {
  useI18n,
} from "@/platform/i18n";
import {
  useNavigate,
} from "@tanstack/react-router";
import { studentPath } from "@/platform/workspaces/workspace-paths";
import {
  createStudentDashboardLoadingProfile,
  studentDashboardQueryOptions,
} from "@/features/elearning/student-dashboard/api/student-dashboard-query";
import {
  markStudentAnnouncementRead as markStudentAnnouncementReadApi,
} from "@/features/elearning/student-dashboard/api/student-engagement-api";
import {
  DiscussionView,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-view";
import {
  ScoresView,
} from "@/features/elearning/student-dashboard/components/student-dashboard-scores-view";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/use-unread-notification-count";
import { StudentInboxView } from "@/features/elearning/student-dashboard/components/student-inbox-view";
import {
  enCopy,
  viCopy,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import type {
  DashboardCopy,
  StudentDockPageKey,
  StudentPageKey,
  StudentViewState,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import {
  getDiscussionOverviewPreview,
} from "@/features/elearning/student-dashboard/utils/discussion-overview";
import {
  ANNOUNCEMENT_POPUP_SNOOZE_MS,
  getInitials,
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
import { AccountView, AnnouncementsView } from "@/features/elearning/student-dashboard/components/student-dashboard-content-views";
import { AssignmentsView } from "@/features/elearning/student-dashboard/components/student-dashboard-assignments-view";
import {
  StudentQuizAssignmentMissing,
  StudentQuizNotReady,
  StudentQuizSession,
} from "@/features/elearning/student-dashboard/components/student-dashboard-quiz-session";
import { StudentPreviewBanner } from "@/features/elearning/student-dashboard/components/student-preview-banner";
import { useIsStudentPreview } from "@/platform/auth/hooks/use-student-preview";
import { TopMenuShell } from "@/features/elearning/student-dashboard/components/student-dashboard-top-menu";
import { StudentDashboardMobileShell } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-shell";
import { StudentDashboardOverviewSurface } from "@/features/elearning/student-dashboard/components/student-dashboard-overview-surface";
import { useAnnouncementPopup } from "@/features/elearning/student-dashboard/hooks/use-announcement-popup";
import { useDashboardSurface } from "@/features/elearning/student-dashboard/hooks/use-dashboard-surface";
import { useElearningViewerAccount } from "@/features/elearning/student-dashboard/hooks/use-elearning-viewer-account";
import { useStudentDiscussion } from "@/features/elearning/student-dashboard/hooks/use-student-discussion";

export function StudentDashboardWorkspaceRuntime() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const surface = useDashboardSurface();
  const studentPreview = useIsStudentPreview();
  const copy: DashboardCopy = locale === "vi" ? viCopy : enCopy;
  const [activePage, setActivePage] = useState<StudentPageKey>(() => {
    if (typeof window === "undefined") return "overview";
    return initialStudentPage(window.location.search);
  });
  const [viewState, setViewState] = useState<StudentViewState>({ type: "dashboard" });
  const [account, setAccount] = useElearningViewerAccount();
  const fixtureMode = runtimeFixturesEnabled();
  const apiEnabled = hasApiBase() && !fixtureMode;
  const tenantId = getDefaultTenantId();
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const paceStateUpdate = usePacedStateBatch();
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

  const dashboardProfile = studentDashboardQuery.data?.profile ?? createStudentDashboardLoadingProfile(account);
  const assignments = useMemo(
    () => studentDashboardQuery.data?.assignments ?? [],
    [studentDashboardQuery.data?.assignments],
  );
  const teacherAnnouncements = useMemo(
    () => studentDashboardQuery.data?.teacherAnnouncements ?? [],
    [studentDashboardQuery.data?.teacherAnnouncements],
  );
  const discussion = useStudentDiscussion({
    apiEnabled,
    copy,
    engagementScope,
    fixtureMode,
    locale,
    profile: dashboardProfile,
    tenantId,
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
  const { announcementPopupOpen, setAnnouncementPopupOpen } = useAnnouncementPopup(latestAnnouncement, viewState.type === "quiz");
  // The dock/menu badge is the Hộp thư inbox's own unread count (same portal and cache as StudentInboxView), not the old announcements.
  const unreadInboxCount = useUnreadNotificationCount(quizRuntimePortal, Boolean(account)) ?? 0;
  const discussionPreview = useMemo(() => getDiscussionOverviewPreview(discussion.discussionPosts), [discussion.discussionPosts]);

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

  function handleDiscussionNotificationClick(threadId: string, replyId?: string) {
    setActivePage("discussion");
    setNotificationAnchor(null);
    discussion.markNotificationRead(threadId, replyId);
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

  const mobileDockItems = useMemo(() => [
    ...copy.navItems.map((item) => ({ key: item.key as StudentDockPageKey, label: item.label })),
    { key: "account" as const, label: locale === "vi" ? "Hồ sơ" : "Profile", avatarInitials: getInitials(dashboardProfile.name) || undefined },
  ], [copy.navItems, dashboardProfile.name, locale]);

  const backToDashboard = () => setViewState({ type: "dashboard" });

  if (viewState.type === "quiz" && !currentAssignment) {
    return <StudentQuizAssignmentMissing onBack={backToDashboard} />;
  }

  if (viewState.type === "quiz" && currentAssignment && !currentAssignment.quizId) {
    return <StudentQuizNotReady assignment={currentAssignment} onBack={backToDashboard} />;
  }

  if (viewState.type === "quiz" && currentAssignment) {
    return <StudentQuizSession assignment={currentAssignment} copy={copy} runtimePortal={quizRuntimePortal} onBack={backToDashboard} />;
  }

  const handlePageChange = (page: StudentPageKey) => {
    const targetPage = page === "scores" ? "assignments" : page;
    setActivePage(targetPage);
    setViewState({ type: "dashboard" });
  };
  const announcementToast = latestAnnouncement ? (
    <AnnouncementToast
      announcement={latestAnnouncement} copy={copy} open={announcementPopupOpen}
      onClose={() => setAnnouncementPopupOpen(false)} onOpenDetail={openAnnouncementDetail} onSnooze={snoozeAnnouncementPopup}
    />
  ) : null;
  const dashboardViews = (
    <>
      {studentDashboardQuery.isError ? (
        <Alert action={<Button variant="text" color="inherit" onClick={() => void studentDashboardQuery.refetch()} size="small" sx={{ minHeight: 44 }}>Thử lại</Button>} severity="error" sx={{ borderRadius: 2.5, color: "error.dark", mb: 2 }}>Không thể tải bảng học tập từ máy chủ.</Alert>
      ) : null}
      {activePage === "overview" ? (
        <StudentDashboardOverviewSurface
          announcement={pinnedAnnouncement} assignmentsFailed={studentDashboardQuery.isError && openAssignments.length === 0} assignmentsLoading={studentDashboardQuery.isLoading && openAssignments.length === 0}
          completedAssignments={completedAssignments} copy={copy} discussionPreview={discussionPreview}
          openAssignments={openAssignments} overdueAssignments={overdueAssignments} priorityAssignment={priorityAssignment}
          profile={dashboardProfile} surface={surface} onOpenAssignment={openAssignment} onPageChange={setActivePage}
        />
      ) : null}
      {activePage === "assignments" ? (
        <AssignmentsView
          assignments={assignments}
          copy={copy}
          onOpenAssignment={openAssignment}
        />
      ) : null}
      {activePage === "scores" ? <ScoresView assignments={assignments} copy={copy} /> : null}
      {activePage === "discussion" ? (
        <DiscussionView
          copy={copy}
          posts={discussion.discussionPosts}
          studentClass={dashboardProfile.className}
          onAddComment={discussion.addDiscussionComment}
          onCommentReaction={discussion.toggleDiscussionCommentReaction}
          onCreatePost={discussion.createDiscussionPost}
          onPostReaction={discussion.toggleDiscussionPostReaction}
        />
      ) : null}
      {activePage === "announcements" ? (
        <>
          {/* Signed-in viewers only: a guest has no inbox. Same portal as the quiz runtime (teacher preview reads lms). */}
          {account ? <Box sx={{ mb: 3 }}><StudentInboxView portal={quizRuntimePortal} /></Box> : null}
          <AnnouncementsView
            announcements={teacherAnnouncements}
            copy={copy}
            selectedAnnouncementId={selectedAnnouncementId}
          />
        </>
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
          activePage={activePage} announcementUnreadCount={unreadInboxCount}
          dockItems={mobileDockItems} onPageChange={handlePageChange}
        >
          {/* Inside the scroll area: above the 100dvh shell it pushed the page past the viewport. */}
          <Box sx={{ pb: 2.5, pt: 4, px: 2 }}><StudentPreviewBanner inset preview={studentPreview} />{dashboardViews}</Box>
        </StudentDashboardMobileShell>
      </Box>
    );
  }

  return (
    <Box sx={{ color: MUI_TEXT, fontFamily: "var(--font-app)", minHeight: "100vh" }}>
      <StudentPreviewBanner preview={studentPreview} />
      {announcementToast}
      <TopMenuShell
        account={account}
        activePage={activePage}
        copy={copy}
        dashboardProfile={dashboardProfile}
        notificationAnchor={notificationAnchor}
        notifications={discussion.discussionNotifications}
        unreadAnnouncementCount={unreadInboxCount}
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
