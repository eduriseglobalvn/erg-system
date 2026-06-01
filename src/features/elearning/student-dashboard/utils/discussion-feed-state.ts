import type { StudentDiscussionImageAttachment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import type {
  StudentDiscussionAuthor,
  StudentDiscussionComment,
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
  StudentDiscussionReactionSummary,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { socialReactionKeys } from "@/types/social-reactions";

export const discussionReactionKeys: StudentDiscussionReactionKey[] = socialReactionKeys;

export const viDiscussionReactions: Record<StudentDiscussionReactionKey, string> = {
  like: "Thích",
  love: "Yêu thích",
  care: "Cố lên",
  haha: "Haha",
  wow: "Wow",
  sad: "Buồn",
  angry: "Phẫn nộ",
};

export function createReactionSummary(
  labels: Record<StudentDiscussionReactionKey, string> = viDiscussionReactions,
  counts: Partial<Record<StudentDiscussionReactionKey, number>> = {},
): StudentDiscussionReactionSummary {
  return discussionReactionKeys.reduce<StudentDiscussionReactionSummary>((summary, key) => {
    summary[key] = {
      count: counts[key] ?? 0,
      label: labels[key],
    };
    return summary;
  }, {} as StudentDiscussionReactionSummary);
}

export function toggleFeedPostReaction(
  post: StudentDiscussionFeedPost,
  nextReaction: StudentDiscussionReactionKey,
): StudentDiscussionFeedPost {
  return {
    ...post,
    reactions: toggleReactionSummary(post.reactions, post.viewerReaction, nextReaction),
    viewerReaction: post.viewerReaction === nextReaction ? null : nextReaction,
  };
}

export function toggleFeedCommentReaction(
  post: StudentDiscussionFeedPost,
  commentId: string,
  nextReaction: StudentDiscussionReactionKey,
): StudentDiscussionFeedPost {
  return {
    ...post,
    comments: post.comments.map((comment) => toggleCommentReaction(comment, commentId, nextReaction)),
  };
}

export function addFeedComment({
  attachments,
  content,
  createdAtLabel = "Vừa xong",
  moderationWarning,
  parentCommentId,
  post,
  viewer,
}: {
  attachments: StudentDiscussionImageAttachment[];
  content: string;
  createdAtLabel?: string;
  moderationWarning?: boolean;
  parentCommentId?: string;
  post: StudentDiscussionFeedPost;
  viewer: StudentDiscussionAuthor;
}): StudentDiscussionFeedPost {
  const now = Date.now();
  const nextComment = createComment({
    attachments,
    content,
    createdAtLabel,
    createdAtMs: now,
    id: `comment-${post.id}-${now}`,
    moderationWarning,
    viewer,
  });

  if (!parentCommentId) {
    return {
      ...post,
      comments: [...post.comments, nextComment],
    };
  }

  return {
    ...post,
    comments: insertReplyAtMaxDepth(post.comments, parentCommentId, nextComment, 1).comments,
  };
}

export function getCommentCount(comments: StudentDiscussionComment[]): number {
  return comments.reduce((total, comment) => total + 1 + getCommentCount(comment.replies), 0);
}

export function getFeedPostActivityMs(post: StudentDiscussionFeedPost): number {
  return Math.max(post.createdAtMs, getLatestCommentMs(post.comments));
}

function createComment({
  attachments,
  content,
  createdAtLabel,
  createdAtMs,
  id,
  moderationWarning,
  viewer,
}: {
  attachments: StudentDiscussionImageAttachment[];
  content: string;
  createdAtLabel: string;
  createdAtMs: number;
  id: string;
  moderationWarning?: boolean;
  viewer: StudentDiscussionAuthor;
}): StudentDiscussionComment {
  return {
    id,
    attachments,
    authorInitials: viewer.initials,
    authorName: viewer.name,
    content,
    createdAtLabel,
    createdAtMs,
    moderationWarning,
    reactions: createReactionSummary(),
    replies: [],
    viewerReaction: null,
  };
}

function toggleReactionSummary(
  reactions: StudentDiscussionReactionSummary,
  currentReaction: StudentDiscussionReactionKey | null,
  nextReaction: StudentDiscussionReactionKey,
): StudentDiscussionReactionSummary {
  const nextSummary = { ...reactions };

  if (currentReaction) {
    nextSummary[currentReaction] = {
      ...nextSummary[currentReaction],
      count: Math.max(0, nextSummary[currentReaction].count - 1),
    };
  }

  if (currentReaction !== nextReaction) {
    nextSummary[nextReaction] = {
      ...nextSummary[nextReaction],
      count: nextSummary[nextReaction].count + 1,
    };
  }

  return nextSummary;
}

function toggleCommentReaction(
  comment: StudentDiscussionComment,
  commentId: string,
  nextReaction: StudentDiscussionReactionKey,
): StudentDiscussionComment {
  if (comment.id === commentId) {
    return {
      ...comment,
      reactions: toggleReactionSummary(comment.reactions, comment.viewerReaction, nextReaction),
      viewerReaction: comment.viewerReaction === nextReaction ? null : nextReaction,
    };
  }

  return {
    ...comment,
    replies: comment.replies.map((reply) => toggleCommentReaction(reply, commentId, nextReaction)),
  };
}

function insertReplyAtMaxDepth(
  comments: StudentDiscussionComment[],
  parentCommentId: string,
  reply: StudentDiscussionComment,
  depth: number,
): { comments: StudentDiscussionComment[]; inserted: boolean } {
  let inserted = false;

  const nextComments = comments.map((comment) => {
    if (comment.id === parentCommentId) {
      inserted = true;
      return {
        ...comment,
        replies: [...comment.replies, reply],
      };
    }

    const canNestFurther = depth < 2;
    const nextReplies = canNestFurther
      ? insertReplyAtMaxDepth(comment.replies, parentCommentId, reply, depth + 1)
      : { comments: comment.replies, inserted: false };

    if (nextReplies.inserted) {
      inserted = true;
      return {
        ...comment,
        replies: nextReplies.comments,
      };
    }

    const flattenedParent = comment.replies.some((child) => child.id === parentCommentId);
    if (depth === 2 && flattenedParent) {
      inserted = true;
      return {
        ...comment,
        replies: [...comment.replies, reply],
      };
    }

    return comment;
  });

  return { comments: nextComments, inserted };
}

function getLatestCommentMs(comments: StudentDiscussionComment[]): number {
  return comments.reduce(
    (latest, comment) => Math.max(latest, comment.createdAtMs, getLatestCommentMs(comment.replies)),
    0,
  );
}
