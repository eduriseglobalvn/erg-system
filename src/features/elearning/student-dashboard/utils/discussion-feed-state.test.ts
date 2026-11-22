import { expect, test } from "vitest";

import {
  addFeedComment,
  applyCommentPage,
  getPostCommentCount,
  mergeCommentPage,
  toggleFeedCommentReaction,
  toggleFeedPostReaction,
} from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import type { StudentDiscussionComment, StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";

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

test("addFeedComment keeps two levels: a reply to a reply joins the root comment", () => {
  const post = {
    ...createPost(),
    comments: [createComment("root", [createComment("reply")])],
  };

  const replyToRoot = addFeedComment({
    attachments: [],
    content: "Tra loi binh luan",
    parentCommentId: "root",
    post,
    viewer,
  });
  expect(replyToRoot.comments[0]?.replies).toHaveLength(2);

  const replyToReply = addFeedComment({
    attachments: [],
    content: "Tra loi cau tra loi",
    parentCommentId: "reply",
    post: replyToRoot,
    viewer,
  });
  expect(replyToReply.comments[0]?.replies).toHaveLength(3);
  expect(replyToReply.comments[0]?.replies[2]?.content).toBe("Tra loi cau tra loi");
  expect(replyToReply.comments[0]?.replies.every((reply) => reply.replies.length === 0)).toBe(true);
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

test("getPostCommentCount prefers the server total over the loaded tree", () => {
  const post = { ...createPost(), comments: [createComment("c1")], commentCount: 130 };
  expect(getPostCommentCount(post)).toBe(130);
  expect(getPostCommentCount({ ...post, commentCount: undefined })).toBe(1);
});

test("addFeedComment raises the post total and the root comment's reply total by one", () => {
  const post = { ...createPost(), commentCount: 30, comments: [{ ...createComment("root"), replyCount: 5 }] };
  const common = { attachments: [], content: "x", viewer };
  const comment = addFeedComment({ ...common, post });
  expect(comment.commentCount).toBe(31);
  const reply = addFeedComment({ ...common, parentCommentId: "root", post });
  expect(reply.commentCount).toBe(31);
  expect(reply.comments[0]?.replyCount).toBe(6);
});

test("mergeCommentPage puts an older page first and drops ids already loaded", () => {
  const merged = mergeCommentPage([createComment("c3"), createComment("c4")], [createComment("c1"), createComment("c2"), createComment("c3")]);
  expect(merged.map((item) => item.id)).toEqual(["c1", "c2", "c3", "c4"]);
});

test("applyCommentPage updates top-level comments or the replies of one comment, with the has-more flag", () => {
  const post = { ...createPost(), hasMoreComments: true, comments: [{ ...createComment("c2", [createComment("r2")]), hasMoreReplies: true }] };
  const top = applyCommentPage(post, undefined, { hasNext: false, items: [createComment("c1")] });
  expect(top.comments.map((c) => c.id)).toEqual(["c1", "c2"]);
  expect(top.hasMoreComments).toBe(false);
  const replies = applyCommentPage(post, "c2", { hasNext: false, items: [createComment("r1"), createComment("r2")] });
  expect(replies.comments[0]?.replies.map((r) => r.id)).toEqual(["r1", "r2"]);
  expect(replies.comments[0]?.hasMoreReplies).toBe(false);
  expect(replies.hasMoreComments).toBe(true);
});
