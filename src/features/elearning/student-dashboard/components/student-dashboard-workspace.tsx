import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@/routes/router-compat";
import { useQuery } from "@tanstack/react-query";
import {
  User as AccountCircleOutlinedIcon,
  ArrowLeft as ArrowBackOutlinedIcon,
  ClipboardCheck as AssignmentTurnedInOutlinedIcon,
  MessageSquare as ForumOutlinedIcon,
  LogIn as LoginOutlinedIcon,
  LogOut as LogoutOutlinedIcon,
  Bell as NotificationsNoneOutlinedIcon,
  GraduationCap as SchoolOutlinedIcon,
} from "lucide-react";
import { queryKeys } from "@/lib/query-keys";

import { PlayerShell } from "@/components/quiz/player-shell";
import { Button } from "@/components/ui/button";
import {
  getCurrentElearningViewerSession,
  logoutElearningViewerSession,
  type ElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";
import { useI18n } from "@/platform/i18n";
import { StudentAnnouncementPopup } from "@/features/elearning/student-dashboard/components/student-announcement-popup";
import { StudentDashboardMobileApp } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-app";
import { StudentDashboardMobileAccount } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-account";
import { StudentDashboardMobileAnnouncements } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-announcements";
import { StudentDashboardMobileAssignments } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-assignments";
import { StudentDashboardMobileOverview } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-overview";
import { StudentDashboardMobileScores } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-scores";
import { StudentBrandHeader } from "@/features/elearning/student-dashboard/components/student-dashboard-header";
import { enCopy, viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";
import {
  AssignmentCard,
  AssignmentScoreCard,
  CompactBadge,
  PageTitle,
  ProfileStat,
  SectionHeader,
  StatusPill,
  StudentFooter,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-ui";
import { StudentDiscussionFeed } from "@/features/elearning/student-dashboard/components/discussion/student-discussion-feed";
import { useDashboardSurface } from "@/features/elearning/student-dashboard/hooks/use-dashboard-surface";
import {
  studentAssignments,
  studentDashboardProfile,
  studentDiscussionThreads,
  studentTeacherAnnouncements,
} from "@/features/elearning/student-dashboard/api/mock-student-dashboard";
import { loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
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
import type {
  DashboardCopy,
  DiscussionScrollTarget,
  StudentDiscussionNotification,
  StudentPageKey,
  StudentViewState,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
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
import { cn } from "@/lib/utils";


export function StudentDashboardWorkspace() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const surface = useDashboardSurface();
  const isMobile = surface === "mobile-web";
  const copy: DashboardCopy = locale === "vi" ? viCopy : enCopy;
  const [activePage, setActivePage] = useState<StudentPageKey>("overview");
  const [viewState, setViewState] = useState<StudentViewState>({ type: "dashboard" });
  const [account, setAccount] = useState<ElearningViewerSession | null>(() => getCurrentElearningViewerSession());
  const studentDashboardQuery = useQuery({
    queryKey: queryKeys.studentDashboard.workspace(account?.id),
    queryFn: loadStudentDashboardData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const dashboardProfile = studentDashboardQuery.data?.profile ?? studentDashboardProfile;
  const assignments = studentDashboardQuery.data?.assignments ?? studentAssignments;
  const teacherAnnouncements = studentDashboardQuery.data?.teacherAnnouncements.length
    ? studentDashboardQuery.data.teacherAnnouncements
    : studentTeacherAnnouncements;
  const [discussionPosts, setDiscussionPosts] = useState<StudentDiscussionFeedPost[]>(() =>
    createInitialDiscussionFeedPosts(studentDiscussionThreads),
  );
  const [discussionNotifications, setDiscussionNotifications] = useState<StudentDiscussionNotification[]>(() =>
    createInitialDiscussionNotifications(createInitialDiscussionFeedPosts(studentDiscussionThreads), locale),
  );
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

  const currentAssignment =
    viewState.type === "quiz"
      ? assignments.find((item) => item.id === viewState.assignmentId) ?? assignments[0]
      : assignments[0];
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
  const mobileDockItems = useMemo(
    () => [
      copy.navItems.find((item) => item.key === "overview"),
      copy.navItems.find((item) => item.key === "assignments"),
      { key: "scores" as const, label: locale === "vi" ? "Điểm" : "Scores", icon: copy.navItems.find((item) => item.key === "scores")?.icon ?? <SchoolOutlinedIcon fontSize="small" /> },
      { key: "discussion" as const, label: locale === "vi" ? "Trao đổi" : "Talk", icon: copy.navItems.find((item) => item.key === "discussion")?.icon ?? <ForumOutlinedIcon fontSize="small" /> },
      { key: "announcements" as const, label: locale === "vi" ? "Thông báo" : "Notices", icon: copy.navItems.find((item) => item.key === "announcements")?.icon ?? <NotificationsNoneOutlinedIcon fontSize="small" /> },
    ].filter(Boolean) as Array<{ key: "overview" | "assignments" | "scores" | "discussion" | "announcements"; label: string; icon: ReactNode }>,
    [copy.navItems, locale],
  );
  const mobileCurrentPageLabel =
    activePage === "announcements"
      ? copy.announcementTitle
      : mobileDockItems.find((item) => item.key === activePage)?.label ??
        copy.navItems.find((item) => item.key === activePage)?.label ??
        copy.accountTitle;

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

    paceStateUpdate(() => setReadAnnouncementIds((currentIds) => {
      const nextIds = new Set(currentIds);
      teacherAnnouncements.forEach((announcement) => nextIds.add(announcement.id));
      return Array.from(nextIds);
    }));
  }, [activePage, paceStateUpdate, teacherAnnouncements]);

  useEffect(() => {
    if (activePage !== "announcements" || !selectedAnnouncementId) return;

    scrollToAnnouncement.run(selectedAnnouncementId);

    return () => scrollToAnnouncement.cancel();
  }, [activePage, scrollToAnnouncement, selectedAnnouncementId]);

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
      createdAtLabel: locale === "vi" ? "Vừa xong" : "Just now",
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
      timeLabel: locale === "vi" ? "Vừa xong" : "Just now",
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
              createdAtLabel: locale === "vi" ? "Vừa xong" : "Just now",
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
      timeLabel: locale === "vi" ? "Vừa xong" : "Just now",
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

  function handleDiscussionNotificationClick(target: DiscussionScrollTarget) {
    setActivePage("discussion");
    setDiscussionNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.threadId === target.threadId && notification.replyId === target.replyId
          ? { ...notification, unread: false }
          : notification,
      ),
    );
    scrollToDiscussionPost.run(target.threadId);
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
      <main className="min-h-screen bg-[#f7f8fb]">
        <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/96 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-[#696CFF] hover:bg-slate-50"
              onClick={() => setViewState({ type: "dashboard" })}
            >
              <ArrowBackOutlinedIcon fontSize="inherit" />
              {copy.backToDashboard}
            </Button>
            <div className="min-w-0 text-right">
              <div className="truncate text-sm font-semibold text-[#696CFF]">{currentAssignment.title}</div>
              <div className="text-xs text-slate-500">{currentAssignment.subjectLabel}</div>
            </div>
          </div>
        </div>

        <div className="w-full px-2 py-2 sm:px-3 sm:py-3">
          <PlayerShell assignmentId={currentAssignment.id} quizId={currentAssignment.quizId} />
        </div>
      </main>
    );
  }

  const dashboardContent =
    activePage === "overview" ? (
      isMobile ? (
        <StudentDashboardMobileOverview
          announcement={pinnedAnnouncement}
          announcementPinnedLabel={copy.announcementPinnedLabel}
          discussionPosts={discussionPreview}
          discussionSectionTitle={locale === "vi" ? "Câu hỏi học sinh" : "Student questions"}
          heroDescription={copy.heroDescription(priorityAssignment.title)}
          heroEyebrow={copy.heroEyebrow}
          heroTitle={copy.heroTitle(dashboardProfile.name)}
          onOpenAssignment={openAssignment}
          onPageChange={setActivePage}
          openAssignments={openAssignments}
          primaryAction={copy.primaryAction}
          priorityAssignment={priorityAssignment}
          profile={dashboardProfile}
          secondaryAction={copy.secondaryAction}
          todayTitle={copy.todayTitle}
        />
      ) : (
        <OverviewView
          copy={copy}
          announcement={pinnedAnnouncement}
          discussionPosts={discussionPosts}
          onOpenAssignment={openAssignment}
          onPageChange={setActivePage}
          openAssignments={openAssignments}
          profile={dashboardProfile}
          priorityAssignment={priorityAssignment}
        />
      )
    ) : activePage === "assignments" ? (
      isMobile ? (
        <StudentDashboardMobileAssignments
          assignments={assignments}
          completedAssignments={completedAssignments}
          copy={copy}
          onOpenAssignment={openAssignment}
          openAssignments={openAssignments}
          overdueAssignments={overdueAssignments}
        />
      ) : (
        <AssignmentsView
          assignments={assignments}
          completedAssignments={completedAssignments}
          copy={copy}
          onOpenAssignment={openAssignment}
          openAssignments={openAssignments}
          overdueAssignments={overdueAssignments}
        />
      )
    ) : activePage === "scores" ? (
      isMobile ? <StudentDashboardMobileScores assignments={assignments} copy={copy} /> : <ScoresView assignments={assignments} copy={copy} />
    ) : activePage === "discussion" ? (
      <StudentDiscussionFeed
        copy={copy}
        posts={discussionPosts}
        studentClass={dashboardProfile.className}
        studentName={dashboardProfile.name}
        onAddComment={addDiscussionComment}
        onCommentReaction={toggleDiscussionCommentReaction}
        onCreatePost={createDiscussionPost}
        onPostReaction={toggleDiscussionPostReaction}
      />
    ) : activePage === "announcements" ? (
      isMobile ? (
        <StudentDashboardMobileAnnouncements
          announcements={teacherAnnouncements}
          copy={copy}
          selectedAnnouncementId={selectedAnnouncementId}
        />
      ) : (
        <AnnouncementsView
          announcements={teacherAnnouncements}
          copy={copy}
          selectedAnnouncementId={selectedAnnouncementId}
        />
      )
    ) : activePage === "account" ? (
      isMobile ? (
        <StudentDashboardMobileAccount
          account={account}
          averageAssignmentScore={averageAssignmentScore}
          copy={copy}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          openAssignments={openAssignments}
          profile={dashboardProfile}
        />
      ) : (
        <AccountView
          account={account}
          averageAssignmentScore={averageAssignmentScore}
          copy={copy}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          openAssignments={openAssignments}
          profile={dashboardProfile}
        />
      )
    ) : null;

  if (isMobile) {
    return (
      <StudentDashboardMobileApp
        activePage={activePage}
        announcementPopup={
          latestAnnouncement
            ? {
                announcement: latestAnnouncement,
                autoDismissLabel: copy.announcementPopupAutoDismiss,
                ctaLabel: copy.announcementPopupAction,
                dismissLabel: copy.announcementPopupDismiss,
                isOpen: announcementPopupOpen,
                pinnedLabel: copy.announcementPinnedLabel,
                onClose: () => setAnnouncementPopupOpen(false),
                onOpenDetail: openAnnouncementDetail,
                onSnooze: snoozeAnnouncementPopup,
                snoozeLabel: copy.announcementPopupSnooze,
              }
            : null
        }
        announcementUnreadCount={unreadAnnouncementCount}
        currentPageLabel={mobileCurrentPageLabel}
        dockItems={mobileDockItems}
        studentName={dashboardProfile.name}
        onAccountOpen={() => setActivePage("account")}
        onAnnouncementsOpen={() => setActivePage("announcements")}
        onPageChange={setActivePage}
      >
        {dashboardContent}
      </StudentDashboardMobileApp>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      {latestAnnouncement ? (
        <StudentAnnouncementPopup
          announcement={latestAnnouncement}
          autoDismissLabel={copy.announcementPopupAutoDismiss}
          ctaLabel={copy.announcementPopupAction}
          dismissLabel={copy.announcementPopupDismiss}
          isOpen={announcementPopupOpen}
          pinnedLabel={copy.announcementPinnedLabel}
          onClose={() => setAnnouncementPopupOpen(false)}
          onOpenDetail={openAnnouncementDetail}
          onSnooze={snoozeAnnouncementPopup}
          snoozeLabel={copy.announcementPopupSnooze}
        />
      ) : null}
      <StudentBrandHeader
        activePage={activePage}
        account={account}
        announcementUnreadCount={unreadAnnouncementCount}
        copy={copy}
        notifications={discussionNotifications}
        studentName={dashboardProfile.name}
        studentClass={dashboardProfile.className}
        onNotificationClick={handleDiscussionNotificationClick}
        onPageChange={setActivePage}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
      {dashboardContent}
      <StudentFooter />
    </main>
  );
}

function OverviewView({
  announcement,
  copy,
  discussionPosts,
  onOpenAssignment,
  onPageChange,
  openAssignments,
  profile,
  priorityAssignment,
}: {
  announcement: StudentTeacherAnnouncement | undefined;
  copy: DashboardCopy;
  discussionPosts: StudentDiscussionFeedPost[];
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  priorityAssignment: StudentDashboardAssignment;
}) {
  const discussionPreview = getDiscussionOverviewPreview(discussionPosts);

  return (
    <section className="mx-auto max-w-[1480px] px-4 py-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-500">{copy.heroEyebrow}</div>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-[#242424]">
              {copy.heroTitle(profile.name)}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {copy.heroDescription(priorityAssignment.title)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              className="bg-[#696CFF] px-4 text-white hover:bg-[#585BE0]"
              onClick={() => onOpenAssignment(priorityAssignment.id)}
            >
              {copy.primaryAction}
            </Button>
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-[#696CFF] hover:bg-slate-50"
              onClick={() => onPageChange("assignments")}
            >
              {copy.secondaryAction}
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {announcement?.isPinned ? <CompactBadge>{copy.announcementPinnedLabel}</CompactBadge> : null}
                <CompactBadge>{announcement?.targetLabel ?? profile.className}</CompactBadge>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-[#696CFF]">
                {announcement?.title ?? copy.announcementHeroTitle}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                {announcement?.content ?? copy.announcementHeroEmpty}
              </p>
              {announcement ? (
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  {announcement.teacherName} • {announcement.createdAtLabel}
                </div>
              ) : null}
            </div>

            <Button
              variant="outline"
              className="shrink-0 border-slate-200 bg-white text-[#696CFF] hover:bg-slate-50"
              onClick={() => onPageChange("announcements")}
            >
              {copy.announcementTitle}
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white">
        <SectionHeader
          actionLabel={copy.secondaryAction}
          onAction={() => onPageChange("assignments")}
          title={copy.todayTitle}
        />
        <div className="grid gap-2 p-3">
          {openAssignments.slice(0, 3).map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              compact
              copy={copy}
              onOpen={() => onOpenAssignment(assignment.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white">
        <SectionHeader actionLabel={copy.discussionTitle} onAction={() => onPageChange("discussion")} title="Câu hỏi học sinh" />
        <div className="grid gap-3 p-3">
          {discussionPreview.map((post) => (
            <button
              key={post.id}
              type="button"
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-[#696CFF]/20 hover:bg-white"
              onClick={() => onPageChange("discussion")}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-white px-2.5 py-1 text-[#696CFF]">{post.className}</span>
                <span>{post.authorName}</span>
                <span>•</span>
                <span>{post.createdAtLabel}</span>
                <span>•</span>
                <span>{post.commentCount} phản hồi</span>
              </div>
              <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-slate-700">{post.content}</p>
            </button>
          ))}
        </div>
      </section>

    </section>
  );
}

function AssignmentsView({
  assignments,
  completedAssignments,
  copy,
  onOpenAssignment,
  openAssignments,
  overdueAssignments,
}: {
  assignments: StudentDashboardAssignment[];
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  onOpenAssignment: (assignmentId: string) => void;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
}) {
  return (
    <section className="mx-auto max-w-[1480px] px-4 py-6">
      <PageTitle
        description={copy.assignmentsDescription}
        icon={<AssignmentTurnedInOutlinedIcon fontSize="inherit" />}
        title={copy.assignmentsTitle}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ProfileStat label={copy.stats.open} value={`${openAssignments.length}`} />
        <ProfileStat label={copy.stats.overdue} value={`${overdueAssignments.length}`} tone="danger" />
        <ProfileStat label={copy.stats.average} value={`${completedAssignments.length}/${assignments.length}`} />
      </div>

      <div className="mt-4 grid gap-3">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            copy={copy}
            onOpen={() => onOpenAssignment(assignment.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ScoresView({
  assignments,
  copy,
}: {
  assignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
}) {
  const attemptedAssignments = assignments.filter((assignment) => assignment.attempts.length > 0);

  return (
    <section className="mx-auto max-w-[1480px] px-4 py-6">
      <PageTitle
        description={copy.scoresDescription}
        icon={<AssignmentTurnedInOutlinedIcon fontSize="inherit" />}
        title={copy.scoresTitle}
      />

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {attemptedAssignments.map((assignment) => (
          <AssignmentScoreCard key={assignment.id} assignment={assignment} copy={copy} />
        ))}
      </div>
    </section>
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
    <section className="mx-auto max-w-[1480px] px-4 py-6">
      <PageTitle
        description={copy.announcementDescription}
        icon={<NotificationsNoneOutlinedIcon fontSize="inherit" />}
        title={copy.announcementTitle}
      />

      <div className="mt-4 grid gap-3">
        {announcements.map((announcement) => (
          <article
            key={announcement.id}
            id={`student-announcement-${announcement.id}`}
            className={cn(
              "rounded-lg border bg-white p-4 transition",
              selectedAnnouncementId === announcement.id
                ? "border-[#696CFF] shadow-sm ring-2 ring-[#696CFF]/10"
                : "border-slate-200",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.isPinned ? <CompactBadge>{copy.announcementPinnedLabel}</CompactBadge> : null}
                  <CompactBadge>{announcement.targetLabel}</CompactBadge>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-[#696CFF]">{announcement.title}</h2>
                <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{announcement.content}</p>
              </div>
              <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right text-xs text-slate-500">
                <div className="font-semibold text-slate-700">{announcement.teacherName}</div>
                <div className="mt-1">{announcement.createdAtLabel}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccountView({
  account,
  averageAssignmentScore,
  copy,
  onSignIn,
  onSignOut,
  openAssignments,
  profile,
}: {
  account: ElearningViewerSession | null;
  averageAssignmentScore: number;
  copy: DashboardCopy;
  onSignIn: () => void;
  onSignOut: () => void;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
}) {
  return (
    <section className="mx-auto max-w-[1480px] px-4 py-6">
      <PageTitle
        description={copy.accountDescription}
        icon={<AccountCircleOutlinedIcon fontSize="inherit" />}
        title={copy.accountTitle}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-[#696CFF] text-lg font-semibold text-white">
                {profile.name.slice(0, 1)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#242424]">{profile.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {profile.className} • {profile.schoolName}
                </p>
              </div>
            </div>
            <StatusPill status={openAssignments.length > 0 ? "in_progress" : "submitted"} label={openAssignments.length > 0 ? copy.stats.open : copy.stats.average} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ProfileStat label={copy.stats.average} value={`${averageAssignmentScore}`} />
            <ProfileStat label={copy.stats.completed} value={`${profile.completedAssignments}`} />
            <ProfileStat label={copy.assignmentsTitle} value={`${profile.completedAssignments}/${profile.totalAssignments}`} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-[#696CFF]">{copy.loginStateTitle}</h3>
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            <div className="font-semibold text-slate-900">{account?.name ?? copy.guestLabel}</div>
            <div>{account?.email ?? copy.guestLabel}</div>
            <div>{account ? copy.signedInAs : copy.guestLabel}</div>
          </div>

          <h3 className="mt-6 text-lg font-semibold text-[#696CFF]">{copy.accountActionsTitle}</h3>
          <div className="mt-4 grid gap-3">
            <Button className="bg-[#696CFF] text-white hover:bg-[#585BE0]" onClick={onSignIn}>
              <LoginOutlinedIcon fontSize="inherit" />
              {copy.signIn}
            </Button>
            <Button variant="outline" className="border-slate-200 bg-white text-[#FF5630] hover:bg-rose-50" onClick={onSignOut}>
              <LogoutOutlinedIcon fontSize="inherit" />
              {copy.signOut}
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}
