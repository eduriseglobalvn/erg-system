import type { StudentDiscussionComment, StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { discussionReactionKeys, getCommentCount, getFeedPostActivityMs } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";

export type DiscussionListFilter = "latest" | "unanswered" | "mine";

export function getPostTitle(post: StudentDiscussionFeedPost) {
  return post.title?.trim() || post.content.split(/\r?\n/u)[0].slice(0, 120);
}

export function isUnanswered(post: StudentDiscussionFeedPost) {
  return getCommentCount(post.comments) === 0;
}

export function getDiscussionSubjects(posts: StudentDiscussionFeedPost[]) {
  return [...new Set(posts.map((post) => post.subject).filter((subject): subject is string => Boolean(subject)))];
}

/** Pinned threads first, then the most recent activity; `subject` null means every subject. */
export function selectDiscussionThreads(posts: StudentDiscussionFeedPost[], filter: DiscussionListFilter, subject: string | null, query = "") {
  const needle = query.trim().toLowerCase();
  return posts
    .filter((post) => (needle ? `${getPostTitle(post)} ${post.content}`.toLowerCase().includes(needle) : true))
    .filter((post) => (subject ? post.subject === subject : true))
    .filter((post) => (filter === "unanswered" ? isUnanswered(post) : filter === "mine" ? Boolean(post.mine) : true))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || getFeedPostActivityMs(b) - getFeedPostActivityMs(a));
}

/** The teacher-chosen reply goes first; the rest keep their order. */
export function orderThreadReplies(post: StudentDiscussionFeedPost): StudentDiscussionComment[] {
  const accepted = post.comments.find((comment) => comment.id === post.acceptedReplyId);
  return accepted ? [accepted, ...post.comments.filter((comment) => comment !== accepted)] : post.comments;
}

export function getReactionTotal(reactions: StudentDiscussionFeedPost["reactions"]) {
  return discussionReactionKeys.reduce((total, key) => total + reactions[key].count, 0);
}
