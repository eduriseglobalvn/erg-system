import profanityWords from "@/features/elearning/student-dashboard/config/profanity-words.json";
import type { StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type { StudentAssignmentAttempt, StudentDiscussionThread } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import type { StudentDiscussionNotification } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { createReactionSummary, getCommentCount, getFeedPostActivityMs } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import { getPersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";

export const ANNOUNCEMENT_POPUP_SNOOZE_MS = 2 * 60 * 60 * 1000;
const ANNOUNCEMENT_POPUP_SNOOZE_KEY = "student-dashboard-announcement-popup-snooze";

export function getBestAttempt(attempts: StudentAssignmentAttempt[]) {
  return attempts.reduce<StudentAssignmentAttempt | null>(
    (bestAttempt, attempt) => (!bestAttempt || attempt.score > bestAttempt.score ? attempt : bestAttempt),
    null,
  );
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}
export function createInitialDiscussionFeedPosts(threads: StudentDiscussionThread[]): StudentDiscussionFeedPost[] {
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

export function createTimestamp() {
  return Date.now();
}

export function createInitialDiscussionNotifications(
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
export function maskProfanity(value: string) {
  const maskedValue = profanityWords.reduce((currentValue, word) => {
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(word)})(?=$|[^\\p{L}\\p{N}])`, "giu");
    return currentValue.replace(pattern, "$1***");
  }, value);

  return {
    value: maskedValue,
    hasProfanity: maskedValue !== value,
  };
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readAnnouncementPopupSnoozes() {
  const snoozes = getPersistedJsonValue<Record<string, number>>(ANNOUNCEMENT_POPUP_SNOOZE_KEY, {});
  return snoozes && typeof snoozes === "object" && !Array.isArray(snoozes) ? snoozes : {};
}

export function writeAnnouncementPopupSnooze(announcementId: string, snoozeUntil: number) {
  const currentSnoozes = readAnnouncementPopupSnoozes();
  currentSnoozes[announcementId] = snoozeUntil;
  setPersistedJsonValue(ANNOUNCEMENT_POPUP_SNOOZE_KEY, currentSnoozes);
}

export function isAnnouncementPopupSnoozed(announcementId: string) {
  const currentSnoozes = readAnnouncementPopupSnoozes();
  const snoozeUntil = currentSnoozes[announcementId];

  if (!snoozeUntil) {
    return false;
  }

  if (snoozeUntil <= Date.now()) {
    delete currentSnoozes[announcementId];
    setPersistedJsonValue(ANNOUNCEMENT_POPUP_SNOOZE_KEY, currentSnoozes);
    return false;
  }

  return true;
}
