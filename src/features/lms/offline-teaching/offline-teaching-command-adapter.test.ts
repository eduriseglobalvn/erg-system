import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOfflineTeachingCommandAdapter,
  OfflineTeachingCommandError,
} from "@/features/lms/offline-teaching/offline-teaching-command-adapter";
import {
  resolveOfflineTeachingCapability,
  type BackendOfflineTeachingPolicySnapshot,
} from "@/features/lms/offline-teaching/offline-teaching-policy";
import {
  MemoryOfflineOutboxStore,
  type OfflineOutboxScope,
} from "@/platform/offline";

const scope: OfflineOutboxScope = {
  accountId: "teacher-a",
  tenantId: "tenant-a",
  workspace: "TEACHER",
};

const policy: BackendOfflineTeachingPolicySnapshot = {
  capabilityId: "cap-teaching-a",
  expiresAt: "2099-01-01T00:00:00.000Z",
  offlineAllowed: true,
  operations: ["attendance.upsert"],
  tenantId: scope.tenantId,
  accountId: scope.accountId,
  workspace: scope.workspace,
};

describe("offline teaching command boundary", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("fails closed when the server does not publish an explicit capability", async () => {
    const adapter = createOfflineTeachingCommandAdapter({
      isOnline: () => false,
      scope,
      store: new MemoryOfflineOutboxStore(),
    });

    await expect(adapter.execute({
      entityId: "student-a:2026-08-09:1",
      entityType: "attendance",
      operation: "attendance.upsert",
      payload: { status: "PRESENT" },
      send: vi.fn(),
    })).rejects.toMatchObject<OfflineTeachingCommandError>({ code: "OFFLINE_CAPABILITY_UNAVAILABLE" });
  });

  it("requires the capability scope and operation to match exactly", () => {
    expect(resolveOfflineTeachingCapability({ operation: "attendance.upsert", policy, scope })).toMatchObject({ status: "ready" });
    expect(resolveOfflineTeachingCapability({ operation: "gradebook.score.upsert", policy, scope })).toMatchObject({ status: "unavailable", reason: "operation_not_allowed" });
    expect(resolveOfflineTeachingCapability({ operation: "attendance.upsert", policy, scope: { ...scope, accountId: "teacher-b" } })).toMatchObject({ status: "unavailable", reason: "scope_mismatch" });
  });

  it("sends a stable idempotency envelope online and never writes the outbox", async () => {
    const send = vi.fn().mockResolvedValue({ id: "attendance-a", version: 4 });
    const adapter = createOfflineTeachingCommandAdapter({
      idFactory: () => "fixture-1",
      isOnline: () => true,
      scope,
      store: new MemoryOfflineOutboxStore(),
    });

    await expect(adapter.execute({
      entityId: "attendance-a",
      entityType: "attendance",
      expectedVersion: 3,
      operation: "attendance.upsert",
      payload: { status: "PRESENT" },
      send,
    })).resolves.toMatchObject({ status: "confirmed", value: { id: "attendance-a" } });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: 3,
      idempotencyKey: "attendance.upsert:fixture-1",
      operationId: "attendance.upsert:fixture-1",
      payload: { status: "PRESENT" },
    }));
    await expect(adapter.list()).resolves.toEqual([]);
  });

  it("queues a transient network failure only when the server capability is valid", async () => {
    const adapter = createOfflineTeachingCommandAdapter({
      capability: policy,
      idFactory: () => "fixture-2",
      isOnline: () => true,
      scope,
      store: new MemoryOfflineOutboxStore(),
    });
    const send = vi.fn().mockRejectedValue(Object.assign(new Error("network down"), { code: "NETWORK_ERROR", status: 0 }));

    await expect(adapter.execute({
      entityId: "attendance-a",
      entityType: "attendance",
      expectedVersion: 3,
      operation: "attendance.upsert",
      payload: { status: "ABSENT" },
      send,
    })).resolves.toMatchObject({ status: "pending", mutation: { expectedVersion: 3, status: "pending" } });
    expect((await adapter.list())[0]).toMatchObject({
      entityType: "attendance",
      idempotencyKey: "attendance.upsert:fixture-2",
      payload: { status: "ABSENT" },
    });
  });

  it("keeps replay conflicts visible instead of converting them to success", async () => {
    const adapter = createOfflineTeachingCommandAdapter({
      capability: policy,
      idFactory: () => "fixture-3",
      isOnline: () => false,
      scope,
      store: new MemoryOfflineOutboxStore(),
    });
    await adapter.execute({
      entityId: "attendance-a",
      entityType: "attendance",
      operation: "attendance.upsert",
      payload: { status: "LATE" },
      send: vi.fn(),
    });

    await expect(adapter.replay(async (mutation) => ({
      conflict: {
        code: "STALE_WRITE",
        entityId: mutation.entityId,
        entityType: mutation.entityType,
        idempotencyKey: mutation.idempotencyKey,
        operationId: mutation.operationId,
        actualVersion: 5,
        expectedVersion: 4,
        retryable: false,
      },
      kind: "conflict" as const,
    }), { isOnline: () => true })).resolves.toMatchObject({ conflicts: 1 });
    await expect(adapter.list()).resolves.toEqual([expect.objectContaining({ status: "conflict" })]);
  });
});
