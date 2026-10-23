import { beforeEach, describe, expect, test, vi } from "vitest";

import { studentEngagementQueryKeys, studentDiscussionFeedQueryOptions } from "@/features/elearning/student-dashboard/api/student-engagement-query";
import { loadStudentDiscussionFeed } from "@/features/elearning/student-dashboard/api/student-engagement-api";

vi.mock("@/features/elearning/student-dashboard/api/student-engagement-api", () => ({
  loadStudentDiscussionFeed: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("student engagement query boundary", () => {
  test("isolates feed cache by tenant and account", () => {
    expect(studentEngagementQueryKeys.feed({ tenantId: "tenant-a", accountId: "account-a" }))
      .not.toEqual(studentEngagementQueryKeys.feed({ tenantId: "tenant-b", accountId: "account-a" }));
    expect(studentEngagementQueryKeys.feed({ tenantId: "tenant-a", accountId: "account-a" }))
      .not.toEqual(studentEngagementQueryKeys.feed({ tenantId: "tenant-a", accountId: "account-b" }));
  });

  test("isolates pages so a late page response cannot overwrite another page", () => {
    const firstPage = studentEngagementQueryKeys.feed({ tenantId: "tenant-a", accountId: "account-a", page: 0, size: 20 });
    const nextPage = studentEngagementQueryKeys.feed({ tenantId: "tenant-a", accountId: "account-a", page: 1, size: 20 });
    const largerPage = studentEngagementQueryKeys.feed({ tenantId: "tenant-a", accountId: "account-a", page: 0, size: 50 });

    expect(firstPage).not.toEqual(nextPage);
    expect(firstPage).not.toEqual(largerPage);
  });

  test("forwards TanStack cancellation and uses an exact feed key", async () => {
    const signal = new AbortController().signal;
    await studentDiscussionFeedQueryOptions({ tenantId: "tenant-a", accountId: "account-a" }).queryFn({ signal });
    expect(vi.mocked(loadStudentDiscussionFeed)).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: "tenant-a",
      accountId: "account-a",
      signal,
    }));
  });

  test("forwards page scope and keeps cancellation isolated per request", async () => {
    const staleRequest = new AbortController();
    const currentRequest = new AbortController();

    await studentDiscussionFeedQueryOptions({ tenantId: "tenant-a", accountId: "account-a", page: 2, size: 10 })
      .queryFn({ signal: staleRequest.signal });
    await studentDiscussionFeedQueryOptions({ tenantId: "tenant-a", accountId: "account-a", page: 3, size: 10 })
      .queryFn({ signal: currentRequest.signal });
    staleRequest.abort();

    expect(vi.mocked(loadStudentDiscussionFeed)).toHaveBeenNthCalledWith(1, expect.objectContaining({
      page: 2,
      size: 10,
      signal: staleRequest.signal,
    }));
    expect(vi.mocked(loadStudentDiscussionFeed)).toHaveBeenNthCalledWith(2, expect.objectContaining({
      page: 3,
      size: 10,
      signal: currentRequest.signal,
    }));
    expect(currentRequest.signal.aborted).toBe(false);
  });
});
