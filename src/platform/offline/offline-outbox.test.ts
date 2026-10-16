import { expect, test } from "vitest";

import {
  MemoryOfflineOutboxStore,
  OfflineOutbox,
  OfflineOutboxError,
  OFFLINE_OUTBOX_RETENTION_MS,
  type OfflineMutation,
  type OfflineOutboxScope,
} from "@/platform/offline";

const scope: OfflineOutboxScope = {
  tenantId: "tenant-a",
  accountId: "account-a",
  workspace: "TEACHER",
};

function createOutbox(store = new MemoryOfflineOutboxStore(), start = 10_000) {
  let now = start;
  let sequence = 0;
  const outbox = new OfflineOutbox({
    scope,
    store,
    now: () => now,
    idFactory: () => `fixture-${++sequence}`,
    retryBaseDelayMs: 1_000,
  });
  return {
    outbox,
    store,
    advanceTo(value: number) {
      now = value;
    },
  };
}

function mutationFixture(overrides: Partial<OfflineMutation> = {}): OfflineMutation {
  return {
    schemaVersion: 2,
    id: "outbox-fixture",
    operationId: "operation-fixture",
    idempotencyKey: "operation-fixture",
    entityType: "attendance",
    entityId: "attendance-fixture",
    payload: { status: "PRESENT" },
    payloadFingerprint: '{"status":"PRESENT"}',
    createdAt: 10_000,
    updatedAt: 10_000,
    attempts: 0,
    nextAttemptAt: 10_000,
    status: "pending",
    ...overrides,
  };
}

test("replays queued mutations in FIFO order and deduplicates the same operation", async () => {
  const { outbox } = createOutbox();
  const first = await outbox.enqueue({
    operationId: "operation-1",
    entityType: "attendance",
    entityId: "student-1",
    payload: { status: "PRESENT", lessonIndex: 1 },
  });
  await outbox.enqueue({
    operationId: "operation-2",
    entityType: "attendance",
    entityId: "student-1",
    payload: { status: "LATE", lessonIndex: 2 },
  });

  const duplicate = await outbox.enqueue({
    operationId: "operation-1",
    entityType: "attendance",
    entityId: "student-1",
    payload: { lessonIndex: 1, status: "PRESENT" },
  });
  expect(duplicate.id).toBe(first.id);

  await expect(outbox.enqueue({
    operationId: "operation-1",
    entityType: "attendance",
    entityId: "student-1",
    payload: { status: "ABSENT", lessonIndex: 1 },
  })).rejects.toMatchObject<OfflineOutboxError>({ code: "IDEMPOTENCY_CONFLICT" });

  const sent: string[] = [];
  const summary = await outbox.replay(async (mutation) => {
    sent.push(mutation.operationId);
    return { kind: "succeeded", serverVersion: 2 };
  });

  expect(sent).toEqual(["operation-1", "operation-2"]);
  expect(summary).toMatchObject({ processed: 2, succeeded: 2, conflicts: 0, retried: 0 });
  expect((await outbox.list()).every((entry) => entry.status === "synced")).toBe(true);
});

test("does not send while offline and resumes after connectivity returns", async () => {
  const { outbox } = createOutbox();
  await outbox.enqueue({ entityType: "homework", entityId: "homework-1", payload: { completed: true } });
  const send = async () => ({ kind: "succeeded" as const });

  await expect(outbox.replay(send, { isOnline: () => false })).resolves.toMatchObject({ skipped: 1, processed: 0 });
  await expect(outbox.replay(send, { isOnline: () => true })).resolves.toMatchObject({ succeeded: 1, processed: 1 });
});

test("uses bounded exponential backoff for transient failures", async () => {
  const { outbox, advanceTo } = createOutbox();
  await outbox.enqueue({ entityType: "grade", entityId: "grade-1", payload: { score: 8 } });

  await expect(outbox.replay(async () => ({ kind: "retry", reason: "network unavailable" }))).resolves.toMatchObject({ retried: 1 });
  expect((await outbox.list())[0]).toMatchObject({ status: "retrying", attempts: 1, nextAttemptAt: 11_000 });

  await expect(outbox.replay(async () => ({ kind: "succeeded" }))).resolves.toMatchObject({ skipped: 1, processed: 0 });
  advanceTo(11_000);
  await expect(outbox.replay(async () => ({ kind: "succeeded", serverVersion: 3 }))).resolves.toMatchObject({ succeeded: 1 });
  expect((await outbox.list())[0]).toMatchObject({ status: "synced", serverVersion: 3 });
});

test("preserves server conflicts for manual resolution and never overwrites them", async () => {
  const { outbox } = createOutbox();
  const queued = await outbox.enqueue({
    operationId: "operation-conflict",
    entityType: "grade",
    entityId: "grade-1",
    expectedVersion: 4,
    payload: { score: 9 },
  });
  const conflict = {
    code: "STALE_WRITE",
    operationId: queued.operationId,
    idempotencyKey: queued.idempotencyKey,
    entityType: queued.entityType,
    entityId: queued.entityId,
    expectedVersion: 4,
    actualVersion: 5,
    retryable: false,
    message: "The server version changed.",
  };

  await expect(outbox.replay(async () => ({ kind: "conflict", conflict }))).resolves.toMatchObject({ conflicts: 1 });
  expect(await outbox.list()).toContainEqual(expect.objectContaining({ status: "conflict", conflict }));

  let calls = 0;
  await expect(outbox.replay(async () => {
    calls += 1;
    return { kind: "succeeded" };
  })).resolves.toMatchObject({ processed: 0, skipped: 0 });
  expect(calls).toBe(0);

  expect(await outbox.retry(queued.id)).toBe(true);
  await expect(outbox.replay(async () => {
    calls += 1;
    return { kind: "succeeded" };
  })).resolves.toMatchObject({ succeeded: 1 });
  expect(calls).toBe(1);
});

test("isolates records by tenant, account and workspace", async () => {
  const store = new MemoryOfflineOutboxStore();
  const first = createOutbox(store).outbox;
  const second = new OfflineOutbox({
    scope: { ...scope, accountId: "account-b", workspace: "STUDENT" },
    store,
    now: () => 10_000,
    idFactory: () => "second",
  });
  await first.enqueue({ entityType: "attendance", entityId: "student-1", payload: { status: "PRESENT" } });
  await second.enqueue({ entityType: "attendance", entityId: "student-1", payload: { status: "ABSENT" } });

  expect((await first.list())).toHaveLength(1);
  expect((await second.list())).toHaveLength(1);
  await first.clear();
  expect(await first.list()).toEqual([]);
  expect((await second.list())[0].payload).toEqual({ status: "ABSENT" });
});

test("rejects credentials and sensitive fields from offline payloads", async () => {
  const { outbox } = createOutbox();
  await expect(outbox.enqueue({
    entityType: "attendance",
    entityId: "student-1",
    payload: { metadata: { accessToken: "should-never-persist" } },
  })).rejects.toMatchObject<OfflineOutboxError>({ code: "CREDENTIAL_PAYLOAD" });
});

test("prunes expired records while retaining fresh operations", async () => {
  const store = new MemoryOfflineOutboxStore();
  const { outbox } = createOutbox(store);
  await store.save(outbox.scopeKey, [
    mutationFixture({ createdAt: 10_000 - OFFLINE_OUTBOX_RETENTION_MS - 1 }),
    mutationFixture({ id: "fresh", operationId: "fresh", idempotencyKey: "fresh", createdAt: 10_000 }),
  ]);
  expect((await outbox.list()).map((entry) => entry.id)).toEqual(["fresh"]);
});
