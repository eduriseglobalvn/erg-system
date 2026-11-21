import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStudentDiscussion } from "@/features/elearning/student-dashboard/hooks/use-student-discussion";

const api = vi.hoisted(() => ({ comments: vi.fn(), feed: vi.fn() }));
vi.mock("@/features/elearning/student-dashboard/api/student-engagement-api", async (original) => ({
  ...(await original<object>()),
  loadStudentDiscussionComments: api.comments,
  loadStudentDiscussionFeed: api.feed,
}));

function comment(id: string) {
  return { id, authorName: "A", authorInitials: "A", content: id, createdAtLabel: "", createdAtMs: 1, attachments: [], reactions: {}, replies: [], viewerReaction: null };
}
const post = { id: "p1", authorName: "A", authorInitials: "A", className: "", content: "c", createdAtLabel: "", createdAtMs: 1, attachments: [], reactions: {}, comments: [comment("c-new")], hasMoreComments: true, viewerReaction: null };

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const view = renderHook(() => useStudentDiscussion({
    apiEnabled: true, copy: {} as never, engagementScope: { accountId: "u", tenantId: "t" }, fixtureMode: false, locale: "vi",
    profile: { id: "u", name: "U", className: "7A" } as never, tenantId: "t",
  }), { wrapper });
  return { client, view };
}

describe("useStudentDiscussion load more", () => {
  beforeEach(() => {
    api.comments.mockReset();
    api.feed.mockReset();
    api.feed.mockResolvedValue({ items: [post], page: 0, size: 20, totalItems: 1, hasNext: false });
  });

  it("ignores a second click for the same key while a page is in flight", async () => {
    const { view } = setup();
    await waitFor(() => expect(view.result.current.discussionPosts).toHaveLength(1));
    let resolve!: (value: unknown) => void;
    api.comments.mockReturnValue(new Promise((r) => { resolve = r; }));
    let first!: Promise<void>;
    act(() => { first = view.result.current.loadMoreDiscussionComments("p1"); void view.result.current.loadMoreDiscussionComments("p1"); });
    expect(api.comments).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ hasNext: false, items: [comment("c-old")] }); await first; });
    expect(view.result.current.discussionPosts[0].comments.map((c) => c.id)).toEqual(["c-old", "c-new"]);
  });

  it("drops a page that was requested before the feed refetched and keeps the cursor", async () => {
    const { client, view } = setup();
    await waitFor(() => expect(view.result.current.discussionPosts).toHaveLength(1));
    let resolve!: (value: unknown) => void;
    api.comments.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    let stale!: Promise<void>;
    act(() => { stale = view.result.current.loadMoreDiscussionComments("p1"); });
    api.feed.mockResolvedValue({ items: [{ ...post, content: "changed" }], page: 0, size: 20, totalItems: 1, hasNext: false });
    await act(async () => { await client.invalidateQueries(); });
    await act(async () => { resolve({ hasNext: true, items: [comment("stale")] }); await stale; });
    expect(view.result.current.discussionPosts[0].comments.map((c) => c.id)).toEqual(["c-new"]);
    api.comments.mockResolvedValueOnce({ hasNext: false, items: [comment("c-old")] });
    await act(async () => { await view.result.current.loadMoreDiscussionComments("p1"); });
    expect(api.comments).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });
});
