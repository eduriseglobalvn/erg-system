import type { OfflineOutboxScope } from "@/platform/offline/offline-outbox";

export type OfflineCapabilityScope = OfflineOutboxScope;

/**
 * This is a transport-bound adapter for a future learner capability field.
 * `offlineAllowed` is deliberately optional: absence means unavailable.
 */
export type BackendOfflinePolicySnapshot = {
  offlineAllowed?: boolean;
  assignmentId?: string;
  quizId?: string;
  attemptId?: string;
  packageId?: string;
  packageHash?: string;
  quizVersion?: string;
  serverTimeAtStart?: string;
  startedAt?: string;
  deadlineAt?: string;
  expiresAt?: string;
};

export type OfflineCapabilityInput = {
  scope: OfflineCapabilityScope;
  assignmentId: string;
  quizId: string;
  attemptId: string;
  packageId: string;
  packageHash: string;
  quizVersion: string;
  policy: BackendOfflinePolicySnapshot;
  /** serverTimeAtStart - client time captured when the attempt was started */
  serverClockOffsetMs: number;
  nowMs?: number;
};

export type OfflineCapabilityUnavailableReason =
  | "scope_invalid"
  | "policy_missing"
  | "policy_invalid"
  | "attempt_mismatch"
  | "package_mismatch"
  | "expired";

export type OfflineQuizCapabilitySnapshot = {
  scope: OfflineCapabilityScope;
  assignmentId: string;
  quizId: string;
  attemptId: string;
  packageId: string;
  packageHash: string;
  quizVersion: string;
  serverTimeAtStart: string;
  deadlineAt: string;
  expiresAt?: string;
  serverClockOffsetMs: number;
  capturedAt: string;
};

export type OfflineCapabilityResult =
  | { status: "ready"; snapshot: Readonly<OfflineQuizCapabilitySnapshot> }
  | { status: "unavailable"; reason: OfflineCapabilityUnavailableReason };

export function resolveOfflineCapability(input: OfflineCapabilityInput): OfflineCapabilityResult {
  if (!isValidScope(input.scope)) return { status: "unavailable", reason: "scope_invalid" };
  if (input.policy.offlineAllowed !== true) return { status: "unavailable", reason: "policy_missing" };

  if (input.policy.attemptId && input.policy.attemptId !== input.attemptId) {
    return { status: "unavailable", reason: "attempt_mismatch" };
  }

  if (
    input.policy.assignmentId !== input.assignmentId ||
    input.policy.quizId !== input.quizId ||
    input.policy.packageId !== input.packageId ||
    input.policy.packageHash !== input.packageHash ||
    input.policy.quizVersion !== input.quizVersion
  ) {
    return { status: "unavailable", reason: "package_mismatch" };
  }

  const serverTimeAtStart = input.policy.serverTimeAtStart ?? input.policy.startedAt;
  const deadlineAt = input.policy.deadlineAt;
  const serverStartMs = serverTimeAtStart ? Date.parse(serverTimeAtStart) : Number.NaN;
  const deadlineMs = deadlineAt ? Date.parse(deadlineAt) : Number.NaN;
  const expiresMs = input.policy.expiresAt ? Date.parse(input.policy.expiresAt) : deadlineMs;
  if (!serverTimeAtStart || !deadlineAt || !Number.isFinite(serverStartMs) || !Number.isFinite(deadlineMs) || !Number.isFinite(expiresMs)) {
    return { status: "unavailable", reason: "policy_invalid" };
  }
  if (!Number.isFinite(input.serverClockOffsetMs) || deadlineMs <= serverStartMs) {
    return { status: "unavailable", reason: "policy_invalid" };
  }

  const nowMs = input.nowMs ?? Date.now();
  const serverNowMs = nowMs + input.serverClockOffsetMs;
  if (serverNowMs >= Math.min(deadlineMs, expiresMs)) {
    return { status: "unavailable", reason: "expired" };
  }

  const snapshot = deepFreeze({
    scope: { ...input.scope },
    assignmentId: input.assignmentId,
    quizId: input.quizId,
    attemptId: input.attemptId,
    packageId: input.packageId,
    packageHash: input.packageHash,
    quizVersion: input.quizVersion,
    serverTimeAtStart,
    deadlineAt,
    ...(input.policy.expiresAt ? { expiresAt: input.policy.expiresAt } : {}),
    serverClockOffsetMs: input.serverClockOffsetMs,
    capturedAt: new Date(nowMs).toISOString(),
  });

  return { status: "ready", snapshot };
}

export function isOfflineCapabilityUsable(
  snapshot: OfflineQuizCapabilitySnapshot,
  scope: OfflineCapabilityScope,
  nowMs = Date.now(),
) {
  if (!isValidScope(scope) || !isSameScope(snapshot.scope, scope)) return false;
  const deadlineMs = Date.parse(snapshot.deadlineAt);
  const expiresMs = snapshot.expiresAt ? Date.parse(snapshot.expiresAt) : deadlineMs;
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(expiresMs)) return false;
  return nowMs + snapshot.serverClockOffsetMs < Math.min(deadlineMs, expiresMs);
}

function isValidScope(scope: OfflineCapabilityScope) {
  return Boolean(
    scope.tenantId.trim() &&
      scope.accountId.trim() &&
      scope.accountId.trim().toLowerCase() !== "anonymous" &&
      scope.workspace.trim(),
  );
}

function isSameScope(left: OfflineCapabilityScope, right: OfflineCapabilityScope) {
  return left.tenantId === right.tenantId && left.accountId === right.accountId && left.workspace === right.workspace;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
