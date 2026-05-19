import type { ReactNode } from "react";

import type { StudentAssignmentStatus } from "@/features/student-dashboard/types/student-dashboard-types";

export type StudentViewState =
  | { type: "dashboard" }
  | {
      type: "quiz";
      assignmentId: string;
    };

export type StudentPageKey = "overview" | "assignments" | "scores" | "discussion" | "announcements" | "account";

export type StudentDockPageKey = "overview" | "assignments" | "scores" | "discussion" | "announcements";

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
  heroEyebrow: string;
  heroTitle: (name: string) => string;
  heroDescription: (taskTitle: string) => string;
  primaryAction: string;
  secondaryAction: string;
  stats: {
    open: string;
    overdue: string;
    average: string;
    completed: string;
  };
  priority: {
    title: string;
    action: string;
    detail: (dueLabel: string) => string;
  };
  todayTitle: string;
  assignmentsTitle: string;
  assignmentsDescription: string;
  scoresTitle: string;
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
  accountDescription: string;
  learningProfileTitle: string;
  loginStateTitle: string;
  accountActionsTitle: string;
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
};
