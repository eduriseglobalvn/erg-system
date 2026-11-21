import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  createStudentDiscussion,
  followStudentDiscussion,
  loadStudentDiscussionComments,
  loadStudentDiscussionFeed,
  markStudentAnnouncementRead,
  replyStudentDiscussion,
  setStudentDiscussionReaction,
} from "@/features/elearning/student-dashboard/api/student-engagement-api";
import { graphQlRequest } from "@/lib/graphql-client";

const mocks = vi.hoisted(() => ({ graphQlRequest: vi.fn() }));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-a",
  graphQlRequest: mocks.graphQlRequest,
}));

const requestMock = vi.mocked(graphQlRequest);

describe("student engagement GraphQL API", () => {
  beforeEach(() => requestMock.mockReset());

  test("loads and maps a scoped discussion feed while forwarding AbortSignal", async () => {
    const signal = new AbortController().signal;
    requestMock.mockResolvedValueOnce({
      elearning: {
        discussionFeed: {
          page: 0,
          size: 20,
          totalItems: 1,
          hasNext: false,
          items: [{
            id: "post-1",
            authorId: "user-1",
            authorName: "Student One",
            authorInitials: "SO",
            academicClassId: "class-1",
            className: "10A1",
            title: "Question",
            content: "Need help",
            createdAt: "2026-07-30T12:00:00+07:00",
            attachmentIds: [],
            assignmentId: null,
            viewerReaction: "like",
            reactions: [{ reaction: "like", count: 2 }],
            comments: [],
          }],
        },
      },
    } as never);

    const result = await loadStudentDiscussionFeed({ tenantId: "tenant-a", accountId: "user-1", signal });

    expect(result.items[0]).toMatchObject({ id: "post-1", className: "10A1", viewerReaction: "like" });
    expect(result.items[0].reactions.like.count).toBe(2);
    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "ElearningStudentDiscussionFeed",
      portal: "elearning",
      signal,
      tenantId: "tenant-a",
      variables: { input: { page: 0, size: 20, tenantId: "tenant-a" } },
    }));
  });

  test("sends idempotent create and reply commands through named generated operations", async () => {
    requestMock.mockResolvedValueOnce({ createStudentDiscussion: { id: "post-1" } } as never);
    await createStudentDiscussion({ tenantId: "tenant-a", idempotencyKey: "create-1", title: "Question", content: "Help", attachmentIds: [] });
    expect(requestMock).toHaveBeenLastCalledWith(expect.objectContaining({
      operationName: "ElearningCreateStudentDiscussion",
      variables: { input: expect.objectContaining({ idempotencyKey: "create-1", tenantId: "tenant-a" }) },
    }));

    requestMock.mockResolvedValueOnce({ replyStudentDiscussion: { id: "comment-1" } } as never);
    await replyStudentDiscussion({ tenantId: "tenant-a", idempotencyKey: "reply-1", postId: "post-1", content: "Answer", attachmentIds: [] });
    expect(requestMock).toHaveBeenLastCalledWith(expect.objectContaining({
      operationName: "ElearningReplyStudentDiscussion",
      variables: { input: expect.objectContaining({ idempotencyKey: "reply-1", postId: "post-1" }) },
    }));
  });

  test("maps subject, pinned, accepted reply and follow state onto the feed post", async () => {
    requestMock.mockResolvedValueOnce({
      elearning: { discussionFeed: { page: 0, size: 20, totalItems: 1, hasNext: false, items: [{
        id: "post-1", authorId: "user-1", authorName: "Co Hanh", authorInitials: "TH", academicClassId: "class-1", className: "7A",
        title: "Lich kiem tra", content: "Noi dung", createdAt: "2026-07-30T12:00:00+07:00", attachmentIds: [], assignmentId: null,
        subject: "Toan", pinned: true, acceptedReplyId: "comment-1", following: true, viewerReaction: null, reactions: [], comments: [],
      }] } },
    } as never);
    const [post] = (await loadStudentDiscussionFeed({ tenantId: "tenant-a", accountId: "user-1" })).items;
    expect(post).toMatchObject({ acceptedReplyId: "comment-1", authorId: "user-1", following: true, pinned: true, subject: "Toan", title: "Lich kiem tra" });
  });

  test("carries the server comment and reply totals and the has-more flags", async () => {
    const comment = { id: "c1", parentId: null, authorId: null, authorName: "A", authorInitials: "A", content: "x", createdAt: "2026-07-30T12:00:00+07:00", attachmentIds: [], viewerReaction: null, reactions: [], replies: [], replyCount: 45, hasMoreReplies: true };
    requestMock.mockResolvedValueOnce({
      elearning: { discussionFeed: { page: 0, size: 20, totalItems: 1, hasNext: false, items: [{
        id: "post-1", authorId: "user-1", authorName: "Co Hanh", authorInitials: "TH", academicClassId: "class-1", className: "7A",
        title: "t", content: "c", createdAt: "2026-07-30T12:00:00+07:00", attachmentIds: [], assignmentId: null,
        viewerReaction: null, reactions: [], comments: [comment], commentCount: 130, hasMoreComments: true,
      }] } },
    } as never);
    const [post] = (await loadStudentDiscussionFeed({ tenantId: "tenant-a", accountId: "user-1" })).items;
    expect(post).toMatchObject({ commentCount: 130, hasMoreComments: true });
    expect(post.comments[0]).toMatchObject({ replyCount: 45, hasMoreReplies: true });
  });

  test("loads a comment page through discussionComments", async () => {
    requestMock.mockResolvedValueOnce({ elearning: { discussionComments: { hasNext: true, items: [{
      id: "c0", parentId: null, authorId: null, authorName: "A", authorInitials: "A", content: "old", createdAt: "2026-07-30T12:00:00+07:00",
      attachmentIds: [], viewerReaction: null, reactions: [], replies: [], replyCount: 0, hasMoreReplies: false,
    }] } } } as never);
    const result = await loadStudentDiscussionComments({ tenantId: "tenant-a", postId: "post-1", page: 1 });
    expect(result).toMatchObject({ hasNext: true, items: [{ id: "c0", replyCount: 0 }] });
    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "ElearningStudentDiscussionComments",
      variables: { page: 1, parentId: undefined, postId: "post-1", size: 20, tenantId: "tenant-a" },
    }));
  });

  test("follows a thread through the named mutation", async () => {
    requestMock.mockResolvedValueOnce({ followStudentDiscussion: true } as never);
    await expect(followStudentDiscussion({ tenantId: "tenant-a", postId: "post-1", follow: true })).resolves.toBe(true);
    expect(requestMock).toHaveBeenLastCalledWith(expect.objectContaining({
      operationName: "ElearningFollowStudentDiscussion",
      variables: { input: { follow: true, postId: "post-1", tenantId: "tenant-a" } },
    }));
  });

  test("sends reaction and announcement read commands without client-controlled actor identity", async () => {
    requestMock.mockResolvedValueOnce({ setStudentDiscussionReaction: { targetType: "POST", targetId: "post-1", viewerReaction: "like", reactions: [] } } as never);
    await setStudentDiscussionReaction({ tenantId: "tenant-a", targetType: "POST", targetId: "post-1", reaction: "like" });
    expect(requestMock).toHaveBeenLastCalledWith(expect.objectContaining({ operationName: "ElearningSetStudentDiscussionReaction" }));

    requestMock.mockResolvedValueOnce({ markStudentAnnouncementRead: { announcementId: "announcement-1", read: true, readAt: "2026-07-30" } } as never);
    await markStudentAnnouncementRead({ tenantId: "tenant-a", announcementId: "announcement-1" });
    expect(requestMock).toHaveBeenLastCalledWith(expect.objectContaining({
      operationName: "ElearningMarkStudentAnnouncementRead",
      variables: { input: { announcementId: "announcement-1", tenantId: "tenant-a" } },
    }));
  });
});
