import { expect, test } from "vitest";

import { getDiscussionOverviewPreview } from "@/features/student-dashboard/utils/discussion-overview";
import type { StudentDiscussionFeedPost } from "@/features/student-dashboard/types/discussion-feed-types";

function createPost(id: string, createdAtMs: number, commentCount: number): StudentDiscussionFeedPost {
  return {
    id,
    authorName: `Author ${id}`,
    authorInitials: "AU",
    className: "Lop 6A1",
    content: `Question ${id}`,
    createdAtLabel: "Hom nay",
    createdAtMs,
    attachments: [],
    comments: Array.from({ length: commentCount }, (_, index) => ({
      id: `${id}-comment-${index}`,
      authorName: "Commenter",
      authorInitials: "CM",
      content: "Reply",
      createdAtLabel: "Hom nay",
      createdAtMs: createdAtMs + index + 1,
      attachments: [],
      moderationWarning: false,
      reactions: {
        like: { label: "Thich", count: 0 },
        love: { label: "Yeu thich", count: 0 },
        care: { label: "Co len", count: 0 },
        haha: { label: "Haha", count: 0 },
        wow: { label: "Wow", count: 0 },
        sad: { label: "Buon", count: 0 },
        angry: { label: "Phan no", count: 0 },
      },
      replies: [],
      viewerReaction: null,
    })),
    moderationWarning: false,
    reactions: {
      like: { label: "Thich", count: 0 },
      love: { label: "Yeu thich", count: 0 },
      care: { label: "Co len", count: 0 },
      haha: { label: "Haha", count: 0 },
      wow: { label: "Wow", count: 0 },
      sad: { label: "Buon", count: 0 },
      angry: { label: "Phan no", count: 0 },
    },
    viewerReaction: null,
  };
}

test("returns the most active discussion topics for overview preview", () => {
  const preview = getDiscussionOverviewPreview(
    [
      createPost("older", 1000, 0),
      createPost("active", 2000, 2),
      createPost("newest", 3000, 1),
      createPost("middle", 2500, 0),
    ],
    3,
  );

  expect(preview.map((item) => item.id)).toEqual(["newest", "middle", "active"]);
  expect(preview[0]?.commentCount).toBe(1);
  expect(preview[2]?.commentCount).toBe(2);
});
