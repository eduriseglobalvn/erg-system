import { expect, test } from "vitest";

import {
  addFeedComment,
  toggleFeedCommentReaction,
  toggleFeedPostReaction,
} from "@/features/student-dashboard/utils/discussion-feed-state";
import type { StudentDiscussionComment, StudentDiscussionFeedPost } from "@/features/student-dashboard/types/discussion-feed-types";

const viewer = {
  id: "student-current",
  name: "Vo Ngoc Linh",
  initials: "VL",
};

function createPost(): StudentDiscussionFeedPost {
  return {
    id: "post-1",
    authorName: "Le Gia Han",
    authorInitials: "LH",
    className: "Lop 6A1",
    content: "Minh can hoi bai.",
    createdAtLabel: "Hom nay",
    createdAtMs: 1000,
    attachments: [],
    comments: [],
    viewerReaction: null,
    reactions: {
      like: { label: "Thich", count: 1 },
      love: { label: "Yeu thich", count: 0 },
      care: { label: "Co len", count: 0 },
      haha: { label: "Haha", count: 0 },
      wow: { label: "Wow", count: 0 },
      sad: { label: "Buon", count: 0 },
      angry: { label: "Phan no", count: 0 },
    },
  };
}

function createComment(id: string, replies: StudentDiscussionComment[] = []): StudentDiscussionComment {
  return {
    id,
    authorName: "Nguyen Minh Khoi",
    authorInitials: "NK",
    content: `Comment ${id}`,
    createdAtLabel: "Hom nay",
    createdAtMs: 1000,
    attachments: [],
    replies,
    viewerReaction: null,
    reactions: {
      like: { label: "Thich", count: 0 },
      love: { label: "Yeu thich", count: 0 },
      care: { label: "Co len", count: 0 },
      haha: { label: "Haha", count: 0 },
      wow: { label: "Wow", count: 0 },
      sad: { label: "Buon", count: 0 },
      angry: { label: "Phan no", count: 0 },
    },
  };
}

test("toggleFeedPostReaction switches one viewer reaction without double counting", () => {
  const liked = toggleFeedPostReaction(createPost(), "love");
  expect(liked.viewerReaction).toBe("love");
  expect(liked.reactions.love.count).toBe(1);
  expect(liked.reactions.like.count).toBe(1);

  const switched = toggleFeedPostReaction(liked, "haha");
  expect(switched.viewerReaction).toBe("haha");
  expect(switched.reactions.love.count).toBe(0);
  expect(switched.reactions.haha.count).toBe(1);

  const removed = toggleFeedPostReaction(switched, "haha");
  expect(removed.viewerReaction).toBeNull();
  expect(removed.reactions.haha.count).toBe(0);
});

test("addFeedComment creates Facebook-style replies with a maximum depth of three levels", () => {
  const post = {
    ...createPost(),
    comments: [createComment("level-1", [createComment("level-2", [createComment("level-3")])])],
  };

  const replyToSecondLevel = addFeedComment({
    attachments: [],
    content: "Tra loi cap 3",
    parentCommentId: "level-2",
    post,
    viewer,
  });
  expect(replyToSecondLevel.comments[0]?.replies[0]?.replies).toHaveLength(2);

  const replyToThirdLevel = addFeedComment({
    attachments: [],
    content: "Tra loi van nam cap 3",
    parentCommentId: "level-3",
    post: replyToSecondLevel,
    viewer,
  });
  expect(replyToThirdLevel.comments[0]?.replies[0]?.replies).toHaveLength(3);
  expect(replyToThirdLevel.comments[0]?.replies[0]?.replies[2]?.content).toBe("Tra loi van nam cap 3");
});

test("toggleFeedCommentReaction updates deeply nested comment reactions", () => {
  const post = {
    ...createPost(),
    comments: [createComment("level-1", [createComment("level-2", [createComment("level-3")])])],
  };

  const reacted = toggleFeedCommentReaction(post, "level-3", "care");
  const comment = reacted.comments[0]?.replies[0]?.replies[0];

  expect(comment?.viewerReaction).toBe("care");
  expect(comment?.reactions.care.count).toBe(1);
});
