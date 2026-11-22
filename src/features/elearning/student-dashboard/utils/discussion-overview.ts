import type { StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { getPostCommentCount, getFeedPostActivityMs } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";

export type DiscussionOverviewPreviewItem = {
  id: string;
  authorName: string;
  className: string;
  content: string;
  commentCount: number;
  createdAtLabel: string;
};

export function getDiscussionOverviewPreview(posts: StudentDiscussionFeedPost[], limit = 3): DiscussionOverviewPreviewItem[] {
  return [...posts]
    .sort((left, right) => getFeedPostActivityMs(right) - getFeedPostActivityMs(left))
    .slice(0, limit)
    .map((post) => ({
      id: post.id,
      authorName: post.authorName,
      className: post.className,
      content: post.content,
      commentCount: getPostCommentCount(post),
      createdAtLabel: post.createdAtLabel,
    }));
}
