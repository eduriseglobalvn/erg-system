import type { ReactNode } from "react";

import type { StudentAssignmentStatus } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export type StudentViewState =
  | { type: "dashboard" }
  | {
      type: "quiz";
      assignmentId: string;
    };

export type StudentPageKey = "overview" | "assignments" | "scores" | "discussion" | "ranking" | "announcements" | "account";

// Same words as the sidebar: the views switch without a URL change, so the browser tab title follows them.
export const STUDENT_PAGE_TITLES: Record<StudentPageKey, string> = {
  overview: "Tổng quan",
  assignments: "Bài tập",
  scores: "Điểm số",
  ranking: "Thi đua",
  discussion: "Thảo luận",
  announcements: "Hộp thư",
  account: "Tài khoản",
};

export type StudentDockPageKey = "overview" | "assignments" | "scores" | "discussion" | "ranking" | "announcements" | "account";

export type DiscussionScrollTarget = {
  replyId?: string;
  threadId: string;
};

export type StudentDiscussionNotification = DiscussionScrollTarget & {
  id: string;
  primaryText: string;
  secondaryText: string;
  timeLabel: string;
  unread: boolean;
};

export type DashboardCopy = {
  navItems: Array<{ key: StudentPageKey; label: string; icon: ReactNode }>;
  heroTitle: (name: string) => string;
  heroDescription: (taskTitle: string, dueDate: string) => string;
  heroAllDone: string;
  heroEmpty: string;
  greetingOpen: (count: number) => string;
  todayEmptyDescription: string;
  todayDoneDescription: string;
  primaryAction: string;
  secondaryAction: string;
  stats: {
    open: string;
    overdue: string;
    dueDone: string;
    nextDue: string;
    completed: string;
  };
  todayTitle: string;
  assignmentsTitle: string;
  assignmentsDescription: string;
  scoresDescription: string;
  bestScoreLabel: string;
  recentResultsTitle: string;
  noRecentResults: string;
  attemptDurationLabel: string;
  discussionTitle: string;
  discussionDescription: string;
  discussionComposerTitle: string;
  discussionTitlePlaceholder: string;
  discussionBodyPlaceholder: string;
  discussionAttachmentAction: string;
  discussionAttachmentHint: string;
  discussionRemoveAttachment: string;
  discussionModerationWarning: string;
  discussionPostAction: string;
  discussionReplyPlaceholder: string;
  discussionReplyAction: string;
  discussionRepliesLabel: (count: number) => string;
  discussionResolvedLabel: string;
  discussionRelatedLabel: string;
  discussionEmptyTitle: string;
  discussionEmptyDescription: string;
  discussionPageLabel: (page: number, totalPages: number) => string;
  discussionPreviousPage: string;
  discussionNextPage: string;
  announcementTitle: string;
  announcementDescription: string;
  announcementHeroTitle: string;
  announcementHeroEmpty: string;
  announcementPinnedLabel: string;
  announcementPopupAutoDismiss: string;
  announcementPopupAction: string;
  announcementPopupDismiss: string;
  announcementPopupSnooze: string;
  notificationTitle: string;
  notificationEmpty: string;
  notificationNewTopicLabel: string;
  notificationImageOnly: string;
  notificationNewThread: (authorName: string) => string;
  notificationNewReply: (authorName: string) => string;
  notificationTopicContext: (title: string) => string;
  accountTitle: string;
  loginStateTitle: string;
  progressLabel: string;
  questionCountLabel: string;
  scoreLabel: string;
  scoreBadge: (score: number, maxScore: number) => string;
  pendingScore: string;
  assignmentAction: (status: StudentAssignmentStatus) => string;
  signedInAs: string;
  guestLabel: string;
  signIn: string;
  signOut: string;
  footerTitle: string;
  footerSubtitle: string;
  sessionBadge: string;
  sessionEyebrow: string;
  sessionDescription: (subject: string, teacher: string, dueLabel: string) => string;
  backToDashboard: string;
  ranking: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    errorTitle: string;
    errorDescription: string;
  };
};
