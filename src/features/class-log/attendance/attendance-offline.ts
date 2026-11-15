import type { BackendOfflineTeachingPolicySnapshot } from "@/features/lms/offline-teaching";
import type { OfflineMutation, OfflineSendOutcome } from "@/platform/offline";

import { attendanceErrorCode } from "./attendance-copy";
import { saveIdempotencyKey, toJsonPayload, type SaveAttendanceAndLogInput } from "./attendance-model";

export const ATTENDANCE_LOG_OPERATION = "attendance.saveAndLog";
export const ATTENDANCE_LOG_ENTITY = "attendance-log";
const POLICY_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * BE does not publish a teaching offline policy yet. The save is safe to queue (the server checks the
 * period version and ownership on replay), so the grant for this single operation is issued locally per account.
 * shortcut: client-issued grant, replace with the server policy envelope once BE publishes it.
 */
export function attendanceOfflinePolicy(scope: { accountId: string; tenantId: string }, nowMs = Date.now()): BackendOfflineTeachingPolicySnapshot {
  return {
    accountId: scope.accountId,
    capabilityId: "teacher-attendance-log",
    expiresAt: new Date(nowMs + POLICY_TTL_MS).toISOString(),
    issuedAt: new Date(nowMs).toISOString(),
    offlineAllowed: true,
    operations: [ATTENDANCE_LOG_OPERATION],
    tenantId: scope.tenantId,
    workspace: "TEACHER",
  };
}

export function attendanceCommand(input: SaveAttendanceAndLogInput) {
  return {
    entityId: `${input.eventId}:${input.date}:${input.periodNo}`,
    entityType: ATTENDANCE_LOG_ENTITY,
    expectedVersion: input.expectedVersion,
    idempotencyKey: saveIdempotencyKey(input),
    operation: ATTENDANCE_LOG_OPERATION,
    payload: toJsonPayload(input),
  };
}

/** Replay verdict per queued save: stale/closed/foreign periods will never succeed, so they stop as conflicts. */
export function classifyReplayError(error: unknown, mutation: Pick<OfflineMutation, "entityId" | "entityType" | "idempotencyKey" | "operationId">): OfflineSendOutcome {
  const code = attendanceErrorCode(error);
  if (code === "STALE_VERSION") {
    return { conflict: { code, entityId: mutation.entityId, entityType: mutation.entityType, idempotencyKey: mutation.idempotencyKey, operationId: mutation.operationId, retryable: false }, kind: "conflict" };
  }
  if (code === "MONTH_CLOSED" || code === "NOT_TEACHER_OF_PERIOD" || code === "ACTUAL_PERIOD_OUT_OF_RANGE") {
    return { kind: "failed", reason: code };
  }
  return { kind: "retry", reason: code ?? "NETWORK" };
}
