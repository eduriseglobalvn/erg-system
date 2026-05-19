import type { StudentDiscussionImageAttachment } from "@/features/student-dashboard/types/student-dashboard-types";
import type { SocialReactionKey, SocialReactionSummary } from "@/types/social-reactions";

export type StudentDiscussionReactionKey = SocialReactionKey;

export type StudentDiscussionReactionSummary = SocialReactionSummary;

export type StudentDiscussionAuthor = {
  id: string;
  initials: string;
  name: string;
};

export type StudentDiscussionComment = {
  id: string;
  authorName: string;
  authorInitials: string;
  content: string;
  createdAtLabel: string;
  createdAtMs: number;
  attachments: StudentDiscussionImageAttachment[];
  moderationWarning?: boolean;
  reactions: StudentDiscussionReactionSummary;
  replies: StudentDiscussionComment[];
  viewerReaction: StudentDiscussionReactionKey | null;
};

export type StudentDiscussionFeedPost = {
  id: string;
  authorName: string;
  authorInitials: string;
  className: string;
  content: string;
  createdAtLabel: string;
  createdAtMs: number;
  attachments: StudentDiscussionImageAttachment[];
  relatedAssignmentTitle?: string;
  moderationWarning?: boolean;
  reactions: StudentDiscussionReactionSummary;
  comments: StudentDiscussionComment[];
  viewerReaction: StudentDiscussionReactionKey | null;
};
