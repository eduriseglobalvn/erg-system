import { afterEach, expect, test, vi } from "vitest";

import {
  createOfflineOutboxStore,
  MemoryOfflineOutboxStore,
  migrateEntries,
  type OfflineMutation,
} from "@/platform/offline";

function entry(overrides: Partial<OfflineMutation> = {}): OfflineMutation {
  return {
    schemaVersion: 2,
    id: "entry-1",
    operationId: "operation-1",
    idempotencyKey: "operation-1",
    entityType: "attendance",
    entityId: "student-1",
    payload: { status: "PRESENT" },
    payloadFingerprint: '{"status":"PRESENT"}',
    createdAt: 1,
    updatedAt: 1,
    attempts: 0,
    nextAttemptAt: 1,
    status: "sending",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("memory store clones values so callers cannot mutate persisted queue state", async () => {
  const store = new MemoryOfflineOutboxStore();
  const original = entry({ payload: { status: "PRESENT" } });
  await store.save("scope-a", [original]);
  original.payload = { status: "ABSENT" };

  const loaded = await store.load("scope-a");
  expect(loaded[0].payload).toEqual({ status: "PRESENT" });
  loaded[0].payload = { status: "LATE" };
  expect((await store.load("scope-a"))[0].payload).toEqual({ status: "PRESENT" });
});

test("migration normalizes interrupted sends and drops credential-bearing records", () => {
  const migrated = migrateEntries([
    entry({ status: "sending" }),
    entry({ id: "unsafe", payload: { refreshToken: "must-drop" } }),
  ]);

  expect(migrated).toHaveLength(1);
  expect(migrated[0]).toMatchObject({ id: "entry-1", schemaVersion: 2, status: "pending" });
});

test("falls back to in-memory storage when IndexedDB or Web Crypto is unavailable", () => {
  vi.stubGlobal("indexedDB", undefined);
  vi.stubGlobal("crypto", undefined);
  expect(createOfflineOutboxStore()).toBeInstanceOf(MemoryOfflineOutboxStore);
});
