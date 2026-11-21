import { beforeEach, describe, expect, it, vi } from "vitest";

import { replayOfflineQuizAttemptQueue } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-attempt-command-api";
import { ApiClientError } from "@/lib/api-client/errors";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn(), replay: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.apiRequest, hasApiBase: () => true }));
vi.mock("@/features/lcms/quiz/quiz-runtime/api/offline-quiz-attempt-queue", () => ({ offlineQuizAttemptQueue: { replay: mocks.replay } }));

const mutation = {
  entityId: "a1", entityType: "attempt", expectedVersion: 1, idempotencyKey: "k", operationId: "o",
  payload: { attemptId: "a1", events: [], packageHash: "h" },
};

async function outcomeFor(error: unknown) {
  mocks.apiRequest.mockRejectedValueOnce(error);
  await replayOfflineQuizAttemptQueue({ accountId: "u", tenantId: "t" } as never);
  const send = mocks.replay.mock.calls[0][1] as (m: unknown) => Promise<{ kind: string }>;
  return send(mutation);
}

describe("offline quiz attempt sync outcome", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.replay.mockReset();
  });

  it("drops the item on 403 FORBIDDEN instead of retrying forever", async () => {
    expect((await outcomeFor(new ApiClientError("Forbidden", "FORBIDDEN", 403))).kind).toBe("failed");
  });

  it("keeps retrying on 403 ACCESS_DENIED (recoverable after a session refresh)", async () => {
    expect((await outcomeFor(new ApiClientError("Denied", "ACCESS_DENIED", 403))).kind).toBe("retry");
  });

  it("keeps retrying on a 403 without a code", async () => {
    expect((await outcomeFor(new ApiClientError("Denied", "", 403))).kind).toBe("retry");
  });

  it.each([500, 503])("keeps retrying on %i", async (status) => {
    expect((await outcomeFor(new ApiClientError("Server", "ERR", status))).kind).toBe("retry");
  });

  it("keeps retrying on a network error", async () => {
    expect((await outcomeFor(new TypeError("Failed to fetch"))).kind).toBe("retry");
  });
});
