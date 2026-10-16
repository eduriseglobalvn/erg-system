import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  createStudentDiscussion,
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
