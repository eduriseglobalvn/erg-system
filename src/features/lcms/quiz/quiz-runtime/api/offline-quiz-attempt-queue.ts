import {
  isOfflineCapabilityUsable,
  type OfflineCapabilityScope,
  type OfflineQuizCapabilitySnapshot,
} from "@/platform/offline/offline-capability-policy";
import {
  OfflineOutbox,
  offlineScopeKey,
  type JsonValue,
  type OfflineMutation,
  type OfflineOutboxScope,
  type OfflineOutboxStore,
  type OfflineReplaySummary,
  type OfflineSend,
} from "@/platform/offline/offline-outbox";
import { createOfflineOutboxStore, MemoryOfflineOutboxStore } from "@/platform/offline/offline-outbox-store";

export type OfflineQuizAttemptQueueInput = {
  scope: OfflineCapabilityScope;
  capability: OfflineQuizCapabilitySnapshot;
  packageHash: string;
  quizVersion: string;
  attempt: Record<string, unknown>;
  event: Record<string, unknown> & { id: string };
  client?: Record<string, unknown>;
  expectedVersion?: number;
  idempotencyKey?: string;
};

export type OfflineQuizAttemptQueueResult =
  | { status: "queued"; mutation: OfflineMutation }
  | { status: "unavailable"; reason: "scope_invalid" | "expired" | "package_mismatch" | "attempt_mismatch" };

export class OfflineQuizAttemptQueue {
  private readonly outboxes = new Map<string, OfflineOutbox>();
  private readonly store: OfflineOutboxStore;
  private readonly now: () => number;

  constructor(store: OfflineOutboxStore = createOfflineOutboxStore(), now: () => number = () => Date.now()) {
    this.store = store;
    this.now = now;
  }

  async enqueue(input: OfflineQuizAttemptQueueInput): Promise<OfflineQuizAttemptQueueResult> {
    if (!isValidScope(input.scope)) return { status: "unavailable", reason: "scope_invalid" };
    if (!isOfflineCapabilityUsable(input.capability, input.scope, this.now())) {
      return { status: "unavailable", reason: "expired" };
    }
    const eventAttemptId = typeof input.event.attemptId === "string" ? input.event.attemptId : undefined;
    if (eventAttemptId && eventAttemptId !== input.capability.attemptId) {
      return { status: "unavailable", reason: "attempt_mismatch" };
    }
    if (
      input.capability.packageHash !== input.packageHash ||
      input.capability.quizVersion !== input.quizVersion
    ) {
      return { status: "unavailable", reason: "package_mismatch" };
    }

    const eventId = input.event.id.trim();
    if (!eventId) return { status: "unavailable", reason: "package_mismatch" };
    return {
      status: "queued",
      mutation: await this.getOutbox(input.scope).enqueue({
        operationId: eventId,
        idempotencyKey: input.idempotencyKey ?? eventId,
        entityType: "quiz-attempt-sync",
        entityId: input.capability.attemptId,
        expectedVersion: input.expectedVersion,
        payload: {
          attemptId: input.capability.attemptId,
          packageHash: input.packageHash,
          quizVersion: input.quizVersion,
          attempt: input.attempt,
          events: [input.event],
          client: input.client ?? { source: "offline-quiz-runtime" },
        } as JsonValue,
      }),
    };
  }

  replay(scope: OfflineOutboxScope, send: OfflineSend, options?: { isOnline?: () => boolean }): Promise<OfflineReplaySummary> {
    return this.getOutbox(scope).replay(send, options);
  }

  list(scope: OfflineOutboxScope) {
    return this.getOutbox(scope).list();
  }

  async clear(scope: OfflineOutboxScope) {
    await this.getOutbox(scope).clear();
  }

  private getOutbox(scope: OfflineOutboxScope) {
    const key = offlineScopeKey(scope);
    const existing = this.outboxes.get(key);
    if (existing) return existing;
    const outbox = new OfflineOutbox({ scope, store: this.store, now: this.now });
    this.outboxes.set(key, outbox);
    return outbox;
  }
}

export const offlineQuizAttemptQueue = new OfflineQuizAttemptQueue();
export { MemoryOfflineOutboxStore };

function isValidScope(scope: OfflineOutboxScope) {
  return Boolean(scope.tenantId.trim() && scope.accountId.trim() && scope.accountId.trim().toLowerCase() !== "anonymous" && scope.workspace.trim());
}
