import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { ErgFooter } from "@/components/erg-footer";
import { PlayerShell } from "@/components/quiz/player-shell";
import { Badge, Button, Card, ProgressBar } from "@/components/ui/dashboard-kit";
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
import { StudentDiscussionFeed } from "@/features/elearning/student-dashboard/components/discussion/student-discussion-feed";
import { useDashboardSurface } from "@/features/elearning/student-dashboard/hooks/use-dashboard-surface";
import {
  studentAssignments,
  studentDashboardProfile,
  studentDiscussionThreads,
  studentTeacherAnnouncements,
} from "@/features/elearning/student-dashboard/api/mock-student-dashboard";
import { loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import profanityWords from "@/features/elearning/student-dashboard/config/profanity-words.json";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  StudentAssignmentAttempt,
  StudentAssignmentStatus,
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentDiscussionImageAttachment,
  StudentDiscussionThread,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  addFeedComment,
  createReactionSummary,
  getCommentCount,
  getFeedPostActivityMs,
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
import { cn } from "@/lib/utils";

const ANNOUNCEMENT_POPUP_SNOOZE_KEY = "student-dashboard-announcement-popup-snooze";
const ANNOUNCEMENT_POPUP_SNOOZE_MS = 2 * 60 * 60 * 1000;

export function StudentDashboardWorkspace() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const surface = useDashboardSurface();
  const isMobile = surface === "mobile-web";
  const copy: DashboardCopy = locale === "vi" ? viCopy : enCopy;
  const [activePage, setActivePage] = useState<StudentPageKey>("overview");
  const [viewState, setViewState] = useState<StudentViewState>({ type: "dashboard" });
  const [account, setAccount] = useState<ElearningViewerSession | null>(() => getCurrentElearningViewerSession());
  const [dashboardProfile, setDashboardProfile] = useState<StudentDashboardProfile>(studentDashboardProfile);
  const [assignments, setAssignments] = useState<StudentDashboardAssignment[]>(studentAssignments);
  const [teacherAnnouncements, setTeacherAnnouncements] =
    useState<StudentTeacherAnnouncement[]>(studentTeacherAnnouncements);
  const [discussionPosts, setDiscussionPosts] = useState<StudentDiscussionFeedPost[]>(() =>
    createInitialDiscussionFeedPosts(studentDiscussionThreads),
  );
  const [discussionNotifications, setDiscussionNotifications] = useState<StudentDiscussionNotification[]>(() =>
    createInitialDiscussionNotifications(createInitialDiscussionFeedPosts(studentDiscussionThreads), locale),
  );
  const [announcementPopupOpen, setAnnouncementPopupOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const announcementPopupTimerRef = useRef<number | null>(null);

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

  const studentDashboardQuery = useQuery({
    queryKey: ["student-dashboard", account?.id ?? "anonymous"],
    queryFn: loadStudentDashboardData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const data = studentDashboardQuery.data;
    if (!data) return;
        setDashboardProfile(data.profile);
        setAssignments(data.assignments);
        setTeacherAnnouncements(data.teacherAnnouncements.length ? data.teacherAnnouncements : studentTeacherAnnouncements);
  }, [studentDashboardQuery.data]);

  useEffect(() => {
    if (viewState.type === "quiz") {
      setAnnouncementPopupOpen(false);
      return;
    }

    if (!latestAnnouncement) return;
    if (isAnnouncementPopupSnoozed(latestAnnouncement.id)) return;
    setAnnouncementPopupOpen(true);
  }, [latestAnnouncement, viewState.type]);

  useEffect(() => {
    if (!announcementPopupOpen) {
      if (announcementPopupTimerRef.current) {
        window.clearTimeout(announcementPopupTimerRef.current);
        announcementPopupTimerRef.current = null;
      }
      return;
    }

    announcementPopupTimerRef.current = window.setTimeout(() => {
      setAnnouncementPopupOpen(false);
      announcementPopupTimerRef.current = null;
    }, 30000);

    return () => {
      if (announcementPopupTimerRef.current) {
        window.clearTimeout(announcementPopupTimerRef.current);
        announcementPopupTimerRef.current = null;
      }
    };
  }, [announcementPopupOpen]);

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

    setReadAnnouncementIds((currentIds) => {
      const nextIds = new Set(currentIds);
      teacherAnnouncements.forEach((announcement) => nextIds.add(announcement.id));
      return Array.from(nextIds);
    });
  }, [activePage, teacherAnnouncements]);

  useEffect(() => {
    if (activePage !== "announcements" || !selectedAnnouncementId) return;

    const timeoutId = window.setTimeout(() => {
      document.getElementById(`student-announcement-${selectedAnnouncementId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePage, selectedAnnouncementId]);

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
    window.setTimeout(() => {
      document
        .getElementById(`student-discussion-post-${target.threadId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
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
              className="border-slate-200 bg-white text-[var(--erg-blue)] hover:bg-slate-50"
              onClick={() => setViewState({ type: "dashboard" })}
            >
              <ArrowBackOutlinedIcon fontSize="inherit" />
              {copy.backToDashboard}
            </Button>
            <div className="min-w-0 text-right">
              <div className="truncate text-sm font-semibold text-[var(--erg-blue)]">{currentAssignment.title}</div>
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
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-500">{copy.heroEyebrow}</div>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-[var(--erg-blue)] sm:text-3xl">
              {copy.heroTitle(profile.name)}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {copy.heroDescription(priorityAssignment.title)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              className="bg-[var(--erg-blue)] px-4 text-white hover:bg-[#060b7a]"
              onClick={() => onOpenAssignment(priorityAssignment.id)}
            >
              {copy.primaryAction}
            </Button>
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-[var(--erg-blue)] hover:bg-slate-50"
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
              <h2 className="mt-2 text-lg font-semibold text-[var(--erg-blue)]">
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
              className="shrink-0 border-slate-200 bg-white text-[var(--erg-blue)] hover:bg-slate-50"
              onClick={() => onPageChange("announcements")}
            >
              {copy.announcementTitle}
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white">
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

      <section className="mt-4 rounded-xl border border-slate-200 bg-white">
        <SectionHeader actionLabel={copy.discussionTitle} onAction={() => onPageChange("discussion")} title="Câu hỏi học sinh" />
        <div className="grid gap-3 p-3">
          {discussionPreview.map((post) => (
            <button
              key={post.id}
              type="button"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-[var(--erg-blue)]/20 hover:bg-white"
              onClick={() => onPageChange("discussion")}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-white px-2.5 py-1 text-[var(--erg-blue)]">{post.className}</span>
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

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
              "rounded-xl border bg-white p-4 transition",
              selectedAnnouncementId === announcement.id
                ? "border-[var(--erg-blue)] shadow-[0_20px_48px_-32px_rgba(11,16,138,0.55)] ring-2 ring-[var(--erg-blue)]/10"
                : "border-slate-200",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.isPinned ? <CompactBadge>{copy.announcementPinnedLabel}</CompactBadge> : null}
                  <CompactBadge>{announcement.targetLabel}</CompactBadge>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-[var(--erg-blue)]">{announcement.title}</h2>
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
              <div className="grid h-16 w-16 place-items-center rounded-lg bg-[var(--erg-blue)] text-xl font-semibold text-white">
                {profile.name.slice(0, 1)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--erg-blue)]">{profile.name}</h2>
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
          <h3 className="text-lg font-semibold text-[var(--erg-blue)]">{copy.loginStateTitle}</h3>
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            <div className="font-semibold text-slate-900">{account?.name ?? copy.guestLabel}</div>
            <div>{account?.email ?? copy.guestLabel}</div>
            <div>{account ? copy.signedInAs : copy.guestLabel}</div>
          </div>

          <h3 className="mt-6 text-lg font-semibold text-[var(--erg-blue)]">{copy.accountActionsTitle}</h3>
          <div className="mt-4 grid gap-3">
            <Button className="bg-[var(--erg-blue)] text-white hover:bg-[#060b7a]" onClick={onSignIn}>
              <LoginOutlinedIcon fontSize="inherit" />
              {copy.signIn}
            </Button>
            <Button variant="outline" className="border-slate-200 bg-white text-[var(--erg-red)] hover:bg-rose-50" onClick={onSignOut}>
              <LogoutOutlinedIcon fontSize="inherit" />
              {copy.signOut}
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}

function StudentBrandHeader({
  account,
  activePage,
  announcementUnreadCount,
  copy,
  notifications,
  studentName,
  studentClass,
  onNotificationClick,
  onPageChange,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
  announcementUnreadCount: number;
  copy: DashboardCopy;
  notifications: StudentDiscussionNotification[];
  studentName: string;
  studentClass: string;
  onNotificationClick: (target: DiscussionScrollTarget) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <BrandWordmark />
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <NotificationMenu
                copy={copy}
                menuOpen={notificationMenuOpen}
                notifications={notifications}
                onMenuOpenChange={setNotificationMenuOpen}
                onNotificationClick={(target) => {
                  setNotificationMenuOpen(false);
                  onNotificationClick(target);
                }}
              />
              <ProfileMenu
                account={account}
                copy={copy}
                menuOpen={accountMenuOpen}
                studentClass={studentClass}
                studentName={studentName}
                onMenuOpenChange={setAccountMenuOpen}
                onPageChange={onPageChange}
                onSignIn={onSignIn}
                onSignOut={onSignOut}
              />
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
          {copy.navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                activePage === item.key
                  ? "bg-slate-100 text-[var(--erg-blue)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[var(--erg-blue)]",
              )}
              onClick={() => onPageChange(item.key)}
            >
              {item.icon}
              {item.label}
              {item.key === "announcements" && announcementUnreadCount > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-[var(--erg-red)] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(233,45,74,0.95)]">
                  {announcementUnreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <NotificationMenu
            copy={copy}
            menuOpen={notificationMenuOpen}
            notifications={notifications}
            onMenuOpenChange={setNotificationMenuOpen}
            onNotificationClick={(target) => {
              setNotificationMenuOpen(false);
              onNotificationClick(target);
            }}
          />
          <ProfileMenu
            account={account}
            copy={copy}
            menuOpen={accountMenuOpen}
            studentClass={studentClass}
            studentName={studentName}
            onMenuOpenChange={setAccountMenuOpen}
            onPageChange={onPageChange}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
}

function ProfileMenu({
  account,
  copy,
  menuOpen,
  studentClass,
  studentName,
  onMenuOpenChange,
  onPageChange,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  copy: DashboardCopy;
  menuOpen: boolean;
  studentClass: string;
  studentName: string;
  onMenuOpenChange: (open: boolean) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const initial = studentName.trim().slice(0, 1).toUpperCase();
  const signedInLabel = account ? copy.signedInAs : copy.guestLabel;

  function handleAccountClick() {
    onPageChange("account");
    onMenuOpenChange(false);
  }

  function handleAuthClick() {
    onMenuOpenChange(false);
    if (account) {
      onSignOut();
      return;
    }
    onSignIn();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={menuOpen}
        className={cn(
          "flex min-w-[148px] items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left transition hover:border-[var(--erg-blue)]/25 hover:bg-slate-50",
          menuOpen ? "border-[var(--erg-blue)]/30 ring-4 ring-[var(--erg-blue)]/6" : "border-slate-200",
        )}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--erg-blue)] text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block max-w-[98px] truncate text-sm font-semibold leading-4 text-[var(--erg-blue)]">{studentName}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-4 text-slate-500">
            <span>{studentClass}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span className="max-w-[76px] truncate">{signedInLabel}</span>
          </span>
        </span>
        <ExpandMoreOutlinedIcon
          className={cn("shrink-0 text-slate-400 transition", menuOpen ? "rotate-180" : "rotate-0")}
          fontSize="small"
        />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_64px_-32px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="text-sm font-semibold text-slate-950">{studentName}</div>
            <div className="mt-1 text-xs text-slate-500">{studentClass}</div>
          </div>

          <div className="grid gap-1 p-2">
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[var(--erg-blue)]"
              onClick={handleAccountClick}
            >
              <SettingsOutlinedIcon fontSize="small" />
              {copy.accountTitle}
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:bg-slate-50",
                account ? "text-[var(--erg-red)]" : "text-[var(--erg-blue)]",
              )}
              onClick={handleAuthClick}
            >
              {account ? <LogoutOutlinedIcon fontSize="small" /> : <LoginOutlinedIcon fontSize="small" />}
              {account ? copy.signOut : copy.signIn}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationMenu({
  copy,
  menuOpen,
  notifications,
  onMenuOpenChange,
  onNotificationClick,
}: {
  copy: DashboardCopy;
  menuOpen: boolean;
  notifications: StudentDiscussionNotification[];
  onMenuOpenChange: (open: boolean) => void;
  onNotificationClick: (target: DiscussionScrollTarget) => void;
}) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-label={copy.notificationTitle}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-lg border bg-white text-[var(--erg-blue)] transition hover:border-[var(--erg-blue)]/25 hover:bg-slate-50",
          menuOpen ? "border-[var(--erg-blue)]/30 ring-4 ring-[var(--erg-blue)]/6" : "border-slate-200",
        )}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <NotificationsNoneOutlinedIcon fontSize="small" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--erg-red)] px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_64px_-32px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="text-sm font-semibold text-[var(--erg-blue)]">{copy.notificationTitle}</div>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50",
                    notification.unread ? "bg-[var(--erg-blue)]/5" : "bg-white",
                  )}
                  onClick={() =>
                    onNotificationClick({
                      replyId: notification.replyId,
                      threadId: notification.threadId,
                    })
                  }
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        notification.unread ? "bg-[var(--erg-red)]" : "bg-slate-300",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold leading-5 text-slate-900">
                        {notification.primaryText}
                      </span>
                      <span className="mt-0.5 block truncate text-xs leading-5 text-slate-500">
                        {notification.secondaryText}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{notification.timeLabel}</span>
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-slate-500">{copy.notificationEmpty}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BrandWordmark() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex items-end text-3xl font-black leading-none">
        <span className="text-[var(--erg-blue)]">ER</span>
        <span className="text-[var(--erg-red)]">G</span>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-xl font-semibold leading-none text-[var(--erg-blue)]">EDURISE GLOBAL</div>
        <div className="mt-1 text-[11px] font-semibold uppercase text-slate-400">Learn today, lead tomorrow</div>
      </div>
    </div>
  );
}

function PageTitle({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-[var(--erg-blue)]">
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--erg-blue)]">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <h2 className="text-lg font-semibold text-[var(--erg-blue)]">{title}</h2>
      <button type="button" className="text-sm font-semibold text-[var(--erg-blue)]" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

function AssignmentScoreCard({ assignment, copy }: { assignment: StudentDashboardAssignment; copy: DashboardCopy }) {
  const bestAttempt = getBestAttempt(assignment.attempts);
  const recentAttempts = assignment.attempts.slice(0, 3);

  return (
    <article className="border-b border-slate-100 p-4 last:border-b-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={assignment.status} label={assignment.statusLabel} />
            <CompactBadge>{assignment.subjectLabel}</CompactBadge>
            <span className="text-sm text-slate-500">{assignment.dueLabel}</span>
          </div>

          <h2 className="mt-2 text-lg font-semibold leading-snug text-[var(--erg-blue)]">{assignment.title}</h2>
        </div>

        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:w-[148px] md:text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">{copy.bestScoreLabel}</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--erg-blue)]">
            {bestAttempt ? copy.scoreBadge(bestAttempt.score, bestAttempt.maxScore) : copy.pendingScore}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
          <span>{copy.recentResultsTitle}</span>
          <span>{recentAttempts.length}/{Math.min(assignment.attempts.length, 3)}</span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {recentAttempts.map((attempt) => (
            <AttemptResultRow key={attempt.id} attempt={attempt} copy={copy} />
          ))}
        </div>
      </div>
    </article>
  );
}

function AttemptResultRow({ attempt, copy }: { attempt: StudentAssignmentAttempt; copy: DashboardCopy }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-950">{attempt.completedAtLabel}</div>
        <div className="mt-1 text-xs text-slate-500">
          {copy.attemptDurationLabel}: {attempt.durationLabel}
        </div>
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--erg-blue)]">{copy.scoreBadge(attempt.score, attempt.maxScore)}</div>
    </div>
  );
}

function AssignmentCard({
  assignment,
  compact = false,
  copy,
  onOpen,
}: {
  assignment: StudentDashboardAssignment;
  compact?: boolean;
  copy: DashboardCopy;
  onOpen: () => void;
}) {
  const statusMeta = assignmentStatusMeta[assignment.status];
  const actionable = assignment.status !== "submitted";

  return (
    <Card className={cn("rounded-xl border bg-white shadow-none", statusMeta.cardClassName)}>
      <div className={compact ? "p-3" : "p-4"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={assignment.status} label={assignment.statusLabel} />
              <CompactBadge>{assignment.subjectLabel}</CompactBadge>
            </div>

            <h3 className={cn("mt-2 font-semibold leading-snug text-[var(--erg-blue)]", compact ? "text-base" : "text-lg")}>{assignment.title}</h3>
            {!compact ? (
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                <span>{assignment.teacherName}</span>
                <span>•</span>
                <span>{assignment.dueLabel}</span>
                <span>•</span>
                <span>{assignment.lastActivityLabel}</span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">{assignment.dueLabel}</div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {assignment.score !== null ? (
              <Badge className="border-[var(--erg-blue)]/10 bg-[var(--erg-blue)]/5 text-[var(--erg-blue)]" tone="outline">
                {copy.scoreLabel}: {copy.scoreBadge(assignment.score, assignment.maxScore)}
              </Badge>
            ) : null}

            <Button
              variant={actionable ? "default" : "outline"}
              className={cn(
                actionable
                  ? assignment.status === "overdue"
                    ? "bg-[var(--erg-red)] text-white hover:bg-[#b0001d]"
                    : "bg-[var(--erg-blue)] text-white hover:bg-[#060b7a]"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
              )}
              onClick={actionable ? onOpen : undefined}
              disabled={!actionable}
            >
              {copy.assignmentAction(assignment.status)}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_112px_112px]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase text-slate-400">{copy.progressLabel}</span>
              <span className="text-sm font-semibold text-slate-900">{assignment.progressRate}%</span>
            </div>
            <ProgressBar value={assignment.progressRate} className="mt-2 h-2.5 bg-slate-100" indicatorClassName={statusMeta.progressClassName} />
            {!compact ? <p className="mt-2 text-sm leading-6 text-slate-500">{assignment.focusNote}</p> : null}
          </div>

          {!compact ? (
            <>
              <CompactStat label={copy.questionCountLabel} value={`${assignment.answeredCount}/${assignment.totalQuestions}`} />
              <CompactStat label={copy.scoreLabel} value={assignment.score !== null ? `${assignment.score}` : copy.pendingScore} />
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function CompactBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase text-slate-600">
      {children}
    </span>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--erg-blue)]">{value}</div>
    </div>
  );
}

function ProfileStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold", tone === "danger" ? "text-[var(--erg-red)]" : "text-[var(--erg-blue)]")}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status, label }: { status: StudentAssignmentStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold uppercase", assignmentStatusMeta[status].chipClassName)}>
      {label}
    </span>
  );
}

function StudentFooter() {
  return <ErgFooter />;
}

function getBestAttempt(attempts: StudentAssignmentAttempt[]) {
  return attempts.reduce<StudentAssignmentAttempt | null>(
    (bestAttempt, attempt) => (!bestAttempt || attempt.score > bestAttempt.score ? attempt : bestAttempt),
    null,
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}
function createInitialDiscussionFeedPosts(threads: StudentDiscussionThread[]): StudentDiscussionFeedPost[] {
  return threads.map((thread) => ({
    id: thread.id,
    authorName: thread.authorName,
    authorInitials: thread.authorInitials,
    className: thread.className,
    content: `${thread.title}\n${thread.content}`,
    createdAtLabel: thread.createdAtLabel,
    createdAtMs: thread.createdAtMs,
    attachments: thread.attachments,
    relatedAssignmentTitle: thread.relatedAssignmentTitle,
    moderationWarning: thread.moderationWarning,
    reactions: createReactionSummary(undefined, thread.isResolved ? { like: 4, care: 1 } : { like: 2 }),
    comments: thread.replies.map((reply) => ({
      id: reply.id,
      authorName: reply.authorName,
      authorInitials: reply.authorInitials,
      content: reply.content,
      createdAtLabel: reply.createdAtLabel,
      createdAtMs: reply.createdAtMs,
      attachments: reply.attachments,
      moderationWarning: reply.moderationWarning,
      reactions: createReactionSummary(undefined, { like: 1 }),
      replies: [],
      viewerReaction: null,
    })),
    viewerReaction: null,
  }));
}

function createTimestamp() {
  return Date.now();
}

function createInitialDiscussionNotifications(
  posts: StudentDiscussionFeedPost[],
  locale: string,
): StudentDiscussionNotification[] {
  return [...posts]
    .sort((left, right) => getFeedPostActivityMs(right) - getFeedPostActivityMs(left))
    .slice(0, 3)
    .map((post) => {
      const commentCount = getCommentCount(post.comments);

      return {
        id: `notification-${post.id}`,
        primaryText:
          locale === "vi"
            ? commentCount > 0
              ? `${post.authorName} có thảo luận đang sôi nổi`
              : `${post.authorName} đã tạo bài viết mới`
            : commentCount > 0
              ? `${post.authorName} has an active discussion`
              : `${post.authorName} created a new post`,
        secondaryText: post.content,
        replyId: undefined,
        threadId: post.id,
        timeLabel: post.createdAtLabel,
        unread: true,
      };
    });
}
function maskProfanity(value: string) {
  const maskedValue = profanityWords.reduce((currentValue, word) => {
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(word)})(?=$|[^\\p{L}\\p{N}])`, "giu");
    return currentValue.replace(pattern, "$1***");
  }, value);

  return {
    value: maskedValue,
    hasProfanity: maskedValue !== value,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readAnnouncementPopupSnoozes() {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(ANNOUNCEMENT_POPUP_SNOOZE_KEY);
    if (!rawValue) return {};
    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as Record<string, number>;
  } catch {
    return {};
  }
}

function writeAnnouncementPopupSnooze(announcementId: string, snoozeUntil: number) {
  if (typeof window === "undefined") return;

  const currentSnoozes = readAnnouncementPopupSnoozes();
  currentSnoozes[announcementId] = snoozeUntil;
  window.localStorage.setItem(ANNOUNCEMENT_POPUP_SNOOZE_KEY, JSON.stringify(currentSnoozes));
}

function isAnnouncementPopupSnoozed(announcementId: string) {
  const currentSnoozes = readAnnouncementPopupSnoozes();
  const snoozeUntil = currentSnoozes[announcementId];

  if (!snoozeUntil) {
    return false;
  }

  if (snoozeUntil <= Date.now()) {
    delete currentSnoozes[announcementId];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ANNOUNCEMENT_POPUP_SNOOZE_KEY, JSON.stringify(currentSnoozes));
    }
    return false;
  }

  return true;
}


const assignmentStatusMeta: Record<
  StudentAssignmentStatus,
  {
    chipClassName: string;
    progressClassName: string;
    cardClassName: string;
  }
> = {
  not_started: {
    chipClassName: "border-slate-200 bg-slate-50 text-slate-600",
    progressClassName: "bg-slate-400",
    cardClassName: "border-slate-200",
  },
  in_progress: {
    chipClassName: "border-amber-200 bg-amber-50 text-amber-700",
    progressClassName: "bg-amber-500",
    cardClassName: "border-amber-100",
  },
  submitted: {
    chipClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    progressClassName: "bg-emerald-500",
    cardClassName: "border-emerald-100",
  },
  overdue: {
    chipClassName: "border-rose-200 bg-rose-50 text-rose-700",
    progressClassName: "bg-rose-500",
    cardClassName: "border-rose-100",
  },
};

const viCopy: DashboardCopy = {
  navItems: [
    { key: "overview", label: "Tổng quan", icon: <HomeOutlinedIcon fontSize="small" /> },
    { key: "assignments", label: "Bài tập", icon: <AssignmentTurnedInOutlinedIcon fontSize="small" /> },
    { key: "scores", label: "Điểm bài tập", icon: <SchoolOutlinedIcon fontSize="small" /> },
    { key: "discussion", label: "Thảo luận", icon: <ForumOutlinedIcon fontSize="small" /> },
    { key: "announcements", label: "Thông báo", icon: <NotificationsNoneOutlinedIcon fontSize="small" /> },
  ],
  heroEyebrow: "Bảng học tập",
  heroTitle: (name: string) => `Chào ${name}, chọn bài cần làm hôm nay.`,
  heroDescription: (taskTitle: string) =>
    `Ưu tiên của bạn là "${taskTitle}". Màn hình này gom bài tập, tiến độ và điểm số vào từng trang rõ ràng để bạn không phải tìm lâu.`,
  primaryAction: "Làm bài ưu tiên",
  secondaryAction: "Xem bài tập",
  stats: {
    open: "Bài đang mở",
    overdue: "Bài quá hạn",
    average: "Điểm trung bình",
    completed: "Bài đã hoàn thành",
  },
  priority: {
    title: "Việc nên làm ngay",
    action: "Vào làm bài",
    detail: (dueLabel: string) => `Hạn: ${dueLabel}. Hoàn thành bài này trước để giữ nhịp học.`,
  },
  todayTitle: "Bài cần xử lý hôm nay",
  assignmentsTitle: "Bài tập",
  assignmentsDescription: "Tất cả bài được giao, trạng thái quá hạn, tiến độ hoàn thành và điểm số.",
  scoresTitle: "Điểm bài tập",
  scoresDescription: "Theo dõi điểm cao nhất và 3 kết quả gần đây của từng bài tập đã được giao.",
  bestScoreLabel: "Điểm cao nhất",
  recentResultsTitle: "Kết quả gần đây",
  noRecentResults: "Chưa có lần làm nào cho bài tập này.",
  attemptDurationLabel: "Thời gian làm bài",
  discussionTitle: "Thảo luận lớp",
  discussionDescription: "Hỏi bài và trao đổi với các bạn trong cùng lớp, giống diễn đàn lớp học.",
  discussionComposerTitle: "Đặt câu hỏi mới",
  discussionTitlePlaceholder: "Bạn đang vướng phần nào?",
  discussionBodyPlaceholder: "Viết rõ câu hỏi, cách bạn đã thử làm hoặc phần chưa hiểu...",
  discussionAttachmentAction: "Chèn ảnh",
  discussionAttachmentHint: "Có thể thêm nhiều ảnh minh họa.",
  discussionRemoveAttachment: "Bỏ ảnh",
  discussionModerationWarning: "Nội dung này có từ không phù hợp nên đã được hệ thống thay bằng ***.",
  discussionPostAction: "Đăng câu hỏi",
  discussionReplyPlaceholder: "Viết phản hồi cho chủ đề này...",
  discussionReplyAction: "Trả lời",
  discussionRepliesLabel: (count: number) => `${count} phản hồi`,
  discussionResolvedLabel: "Đã giải đáp",
  discussionRelatedLabel: "Bài liên quan",
  discussionEmptyTitle: "Chưa có thảo luận nào",
  discussionEmptyDescription: "Bạn có thể mở chủ đề đầu tiên để hỏi bài cùng lớp.",
  discussionPageLabel: (page: number, totalPages: number) => `Trang ${page}/${totalPages}`,
  discussionPreviousPage: "Trước",
  discussionNextPage: "Tiếp",
  announcementTitle: "Thông báo giáo viên",
  announcementDescription: "Tất cả thông báo từ giáo viên gửi riêng cho bạn hoặc gửi chung cho lớp.",
  announcementHeroTitle: "Chưa có thông báo mới",
  announcementHeroEmpty: "Khi giáo viên gửi thông báo, nội dung quan trọng sẽ hiển thị tại đây.",
  announcementPinnedLabel: "Quan trọng",
  announcementPopupAutoDismiss: "Tự tắt sau 30 giây",
  announcementPopupAction: "Xem chi tiết",
  announcementPopupDismiss: "Tắt thông báo",
  announcementPopupSnooze: "Không nhận thông báo này trong 2 giờ",
  notificationTitle: "Thông báo",
  notificationEmpty: "Chưa có thông báo mới.",
  notificationNewTopicLabel: "Chủ đề mới",
  notificationImageOnly: "Đã gửi ảnh",
  notificationNewThread: (authorName: string) => `${authorName} đã tạo chủ đề mới`,
  notificationNewReply: (authorName: string) => `${authorName} đã trả lời bạn`,
  notificationTopicContext: (title: string) => `trong "${title}"`,
  accountTitle: "Quản lý tài khoản",
  accountDescription: "Thông tin hồ sơ học sinh, trạng thái đăng nhập và các thao tác tài khoản.",
  learningProfileTitle: "Hồ sơ học tập",
  loginStateTitle: "Trạng thái đăng nhập",
  accountActionsTitle: "Thao tác tài khoản",
  progressLabel: "Tiến độ",
  questionCountLabel: "Câu đã làm",
  scoreLabel: "Điểm",
  scoreBadge: (score: number, maxScore: number) => `${score}/${maxScore}`,
  pendingScore: "Chờ chấm",
  assignmentAction: (status: StudentAssignmentStatus) =>
    status === "in_progress" ? "Làm tiếp" : status === "overdue" ? "Làm ngay" : status === "submitted" ? "Đã nộp" : "Bắt đầu",
  signedInAs: "Đã đăng nhập",
  guestLabel: "Chưa đăng nhập",
  signIn: "Đăng nhập",
  signOut: "Đăng xuất",
  footerTitle: "ERG Edurise Global",
  footerSubtitle: "Learn today, lead tomorrow",
  sessionBadge: "Quiz session",
  sessionEyebrow: "Phiên làm bài",
  sessionDescription: (subject: string, teacher: string, dueLabel: string) =>
    `${subject} • ${teacher} • ${dueLabel}. Hoàn thành trọn phiên để hệ thống cập nhật tiến độ và điểm số.`,
  backToDashboard: "Quay lại",
};

const enCopy: DashboardCopy = {
  navItems: [
    { key: "overview", label: "Overview", icon: <HomeOutlinedIcon fontSize="small" /> },
    { key: "assignments", label: "Assignments", icon: <AssignmentTurnedInOutlinedIcon fontSize="small" /> },
    { key: "scores", label: "Assignment scores", icon: <SchoolOutlinedIcon fontSize="small" /> },
    { key: "discussion", label: "Discussion", icon: <ForumOutlinedIcon fontSize="small" /> },
    { key: "announcements", label: "Notices", icon: <NotificationsNoneOutlinedIcon fontSize="small" /> },
  ],
  heroEyebrow: "Learning board",
  heroTitle: (name: string) => `Hi ${name}, choose what to finish today.`,
  heroDescription: (taskTitle: string) =>
    `Your priority is "${taskTitle}". Assignments, progress, and scores are separated into clear pages so students can find the next action quickly.`,
  primaryAction: "Open priority task",
  secondaryAction: "View assignments",
  stats: {
    open: "Open tasks",
    overdue: "Overdue",
    average: "Average score",
    completed: "Completed tasks",
  },
  priority: {
    title: "Best next action",
    action: "Start task",
    detail: (dueLabel: string) => `Due: ${dueLabel}. Finish this first to keep your learning pace.`,
  },
  todayTitle: "Tasks to handle today",
  assignmentsTitle: "Assignments",
  assignmentsDescription: "All assigned tasks, overdue status, completion progress, and score.",
  scoresTitle: "Assignment scores",
  scoresDescription: "Review the best score and 3 most recent results for each assigned task.",
  bestScoreLabel: "Best score",
  recentResultsTitle: "Recent results",
  noRecentResults: "No attempts have been recorded for this assignment yet.",
  attemptDurationLabel: "Attempt time",
  discussionTitle: "Class discussion",
  discussionDescription: "Ask questions and exchange ideas with classmates, like a simple classroom forum.",
  discussionComposerTitle: "Start a new question",
  discussionTitlePlaceholder: "What part are you stuck on?",
  discussionBodyPlaceholder: "Write the question, what you tried, or the exact step you do not understand...",
  discussionAttachmentAction: "Add image",
  discussionAttachmentHint: "You can attach multiple reference images.",
  discussionRemoveAttachment: "Remove",
  discussionModerationWarning: "This message had inappropriate words and they were replaced with ***.",
  discussionPostAction: "Post question",
  discussionReplyPlaceholder: "Write a reply for this topic...",
  discussionReplyAction: "Reply",
  discussionRepliesLabel: (count: number) => `${count} replies`,
  discussionResolvedLabel: "Resolved",
  discussionRelatedLabel: "Related task",
  discussionEmptyTitle: "No discussions yet",
  discussionEmptyDescription: "Start the first topic to ask classmates for help.",
  discussionPageLabel: (page: number, totalPages: number) => `Page ${page}/${totalPages}`,
  discussionPreviousPage: "Previous",
  discussionNextPage: "Next",
  announcementTitle: "Teacher notices",
  announcementDescription: "All teacher notices sent directly to you or to your class.",
  announcementHeroTitle: "No new notices",
  announcementHeroEmpty: "Important teacher notices will appear here when they are posted.",
  announcementPinnedLabel: "Important",
  announcementPopupAutoDismiss: "Auto closes in 30 seconds",
  announcementPopupAction: "Open detail",
  announcementPopupDismiss: "Dismiss notice",
  announcementPopupSnooze: "Hide this notice for 2 hours",
  notificationTitle: "Notifications",
  notificationEmpty: "No new notifications.",
  notificationNewTopicLabel: "New topic",
  notificationImageOnly: "Sent an image",
  notificationNewThread: (authorName: string) => `${authorName} created a new topic`,
  notificationNewReply: (authorName: string) => `${authorName} replied to you`,
  notificationTopicContext: (title: string) => `in "${title}"`,
  accountTitle: "Manage account",
  accountDescription: "Student profile, login state, and account actions.",
  learningProfileTitle: "Learning profile",
  loginStateTitle: "Login state",
  accountActionsTitle: "Account actions",
  progressLabel: "Progress",
  questionCountLabel: "Questions",
  scoreLabel: "Score",
  scoreBadge: (score: number, maxScore: number) => `${score}/${maxScore}`,
  pendingScore: "Pending",
  assignmentAction: (status: StudentAssignmentStatus) =>
    status === "in_progress" ? "Continue" : status === "overdue" ? "Do now" : status === "submitted" ? "Submitted" : "Start",
  signedInAs: "Signed in",
  guestLabel: "Not signed in",
  signIn: "Sign in",
  signOut: "Sign out",
  footerTitle: "ERG Edurise Global",
  footerSubtitle: "Learn today, lead tomorrow",
  sessionBadge: "Quiz session",
  sessionEyebrow: "Quiz mode",
  sessionDescription: (subject: string, teacher: string, dueLabel: string) =>
    `${subject} • ${teacher} • ${dueLabel}. Finish the full session to refresh progress and score.`,
  backToDashboard: "Back",
};
