import { describe, expect, it } from "vitest";

import type { StudentDiscussionComment, StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { createReactionSummary } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import {
  getDiscussionSubjects,
  getPostTitle,
  orderThreadReplies,
  selectDiscussionThreads,
} from "@/features/elearning/student-dashboard/utils/discussion-thread-list";

function comment(id: string): StudentDiscussionComment {
  return { attachments: [], authorInitials: "GB", authorName: "Gia Bảo", content: id, createdAtLabel: "", createdAtMs: 0, id, reactions: createReactionSummary(), replies: [], viewerReaction: null };
}

function post(id: string, patch: Partial<StudentDiscussionFeedPost> = {}): StudentDiscussionFeedPost {
  return { attachments: [], authorInitials: "MA", authorName: "Minh Anh", className: "7A", comments: [], content: id, createdAtLabel: "", createdAtMs: Number(id.replace(/\D/gu, "")) || 0, id, reactions: createReactionSummary(), viewerReaction: null, ...patch };
}

describe("discussion thread list", () => {
  const pinned = post("p1", { pinned: true, subject: "Toán", title: "Lịch kiểm tra" });
  const solved = post("p2", { acceptedReplyId: "c1", comments: [comment("c1")], mine: true, subject: "Toán" });
  const open = post("p3", { subject: "Ngữ văn" });

  it("puts pinned threads first, then the newest", () => {
    expect(selectDiscussionThreads([open, solved, pinned], "latest", null).map((item) => item.id)).toEqual(["p1", "p3", "p2"]);
  });

  it("filters unanswered, mine and subject, and searches titles", () => {
    const all = [pinned, solved, open];
    expect(selectDiscussionThreads(all, "unanswered", null).map((item) => item.id)).toEqual(["p1", "p3"]);
    expect(selectDiscussionThreads(all, "mine", null).map((item) => item.id)).toEqual(["p2"]);
    expect(selectDiscussionThreads(all, "latest", "Ngữ văn").map((item) => item.id)).toEqual(["p3"]);
    expect(selectDiscussionThreads(all, "latest", null, "lịch").map((item) => item.id)).toEqual(["p1"]);
  });

  it("lists distinct subjects, falls back to the first content line for the title, and puts the teacher pick first", () => {
    expect(getDiscussionSubjects([pinned, solved, open])).toEqual(["Toán", "Ngữ văn"]);
    expect(getPostTitle(post("p4", { content: "Dòng một\nDòng hai" }))).toBe("Dòng một");
    const withReplies = post("p5", { acceptedReplyId: "c2", comments: [comment("c1"), comment("c2")] });
    expect(orderThreadReplies(withReplies).map((item) => item.id)).toEqual(["c2", "c1"]);
  });
});
