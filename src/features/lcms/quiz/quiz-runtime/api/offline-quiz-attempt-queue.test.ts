import { describe, expect, test } from "vitest";

import {
  MemoryOfflineOutboxStore,
  OfflineQuizAttemptQueue,
} from "@/features/lcms/quiz/quiz-runtime/api/offline-quiz-attempt-queue";
import type { OfflineQuizCapabilitySnapshot } from "@/platform/offline/offline-capability-policy";

const scope = { tenantId: "tenant-a", accountId: "student-a", workspace: "STUDENT" } as const;
const snapshot: OfflineQuizCapabilitySnapshot = {
  scope,
  assignmentId: "assignment-a",
  quizId: "quiz-a",
  attemptId: "attempt-a",
  packageId: "package-a",
  packageHash: "hash-a",
  quizVersion: "v3",
  serverTimeAtStart: "2026-08-09T08:00:00.000Z",
  deadlineAt: "2026-08-09T09:00:00.000Z",
  serverClockOffsetMs: 0,
  capturedAt: "2026-08-09T08:00:00.000Z",
};

describe("offline quiz attempt queue", () => {
  test("admits only an unexpired approved attempt and deduplicates event idempotency", async () => {
    const queue = new OfflineQuizAttemptQueue(new MemoryOfflineOutboxStore(), () => Date.parse("2026-08-09T08:15:00.000Z"));
    const input = {
      scope,
      capability: snapshot,
      packageHash: "hash-a",
      quizVersion: "v3",
      attempt: { answers: { question: { choiceId: "a" } }, status: "in_progress" },
      event: { id: "event-a", type: "answer_changed", questionId: "question" },
    };

    const first = await queue.enqueue(input);
    const duplicate = await queue.enqueue(input);
    expect(first.status).toBe("queued");
    expect(duplicate.status).toBe("queued");
    if (first.status !== "queued" || duplicate.status !== "queued") return;
    expect(duplicate.mutation.id).toBe(first.mutation.id);

    const expired = await queue.enqueue({ ...input, event: { ...input.event, id: "event-expired" }, capability: { ...snapshot, deadlineAt: "2026-08-09T08:10:00.000Z" } });
    expect(expired).toEqual({ status: "unavailable", reason: "expired" });
  });

  test("replays with explicit server conflicts instead of overwriting the attempt", async () => {
    const queue = new OfflineQuizAttemptQueue(new MemoryOfflineOutboxStore(), () => Date.parse("2026-08-09T08:15:00.000Z"));
    const queued = await queue.enqueue({
      scope,
      capability: snapshot,
      packageHash: "hash-a",
      quizVersion: "v3",
      attempt: { answers: {}, status: "in_progress" },
      event: { id: "event-conflict", type: "answer_changed" },
      expectedVersion: 4,
    });
    expect(queued.status).toBe("queued");

    const summary = await queue.replay(scope, async (mutation) => ({
      kind: "conflict" as const,
      conflict: {
        code: "STALE_WRITE",
        operationId: mutation.operationId,
        idempotencyKey: mutation.idempotencyKey,
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        expectedVersion: 4,
        actualVersion: 5,
      },
    }));
    expect(summary.conflicts).toBe(1);
    expect((await queue.list(scope))[0].status).toBe("conflict");
  });
});
