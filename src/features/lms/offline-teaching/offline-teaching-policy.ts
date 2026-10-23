import type { OfflineOutboxScope } from "@/platform/offline";

export type OfflineTeachingOperation = string;

/**
 * The server-owned capability envelope for teaching mutations.
 *
 * BE-062 currently publishes idempotency/version fields, but not this policy
 * envelope. Keeping the adapter's input optional is intentional: an absent
 * policy must remain unavailable rather than becoming an implicit permission.
 */
export type BackendOfflineTeachingPolicySnapshot = {
  capabilityId?: string | null;
  offlineAllowed?: boolean | null;
  operations?: readonly string[] | null;
  tenantId?: string | null;
  accountId?: string | null;
  workspace?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
};

export type OfflineTeachingCapabilityUnavailableReason =
  | "scope_invalid"
  | "policy_missing"
  | "policy_denied"
  | "policy_invalid"
  | "scope_mismatch"
  | "operation_not_allowed"
  | "expired";

export type OfflineTeachingCapabilityInput = {
  scope: OfflineOutboxScope;
  operation: OfflineTeachingOperation;
  policy?: BackendOfflineTeachingPolicySnapshot | null;
  nowMs?: number;
};

export type OfflineTeachingCapabilitySnapshot = Readonly<{
  capabilityId: string;
  scope: OfflineOutboxScope;
  operation: string;
  issuedAt?: string;
  expiresAt?: string;
}>;

export type OfflineTeachingCapabilityResult =
  | { status: "ready"; snapshot: OfflineTeachingCapabilitySnapshot }
  | { status: "unavailable"; reason: OfflineTeachingCapabilityUnavailableReason };

export function resolveOfflineTeachingCapability(
  input: OfflineTeachingCapabilityInput,
): OfflineTeachingCapabilityResult {
  if (!isValidScope(input.scope) || !input.operation.trim()) {
    return { status: "unavailable", reason: "scope_invalid" };
  }

  const policy = input.policy;
  if (!policy) return { status: "unavailable", reason: "policy_missing" };
  if (policy.offlineAllowed !== true) return { status: "unavailable", reason: "policy_denied" };

  if (!policy.capabilityId?.trim() || !Array.isArray(policy.operations)) {
    return { status: "unavailable", reason: "policy_invalid" };
  }

  if (!matchesScope(policy, input.scope)) {
    return { status: "unavailable", reason: "scope_mismatch" };
  }

  const operation = input.operation.trim();
  if (!policy.operations.some((candidate) => candidate.trim() === operation)) {
    return { status: "unavailable", reason: "operation_not_allowed" };
  }

  const nowMs = input.nowMs ?? Date.now();
  const expiresAt = policy.expiresAt?.trim() || undefined;
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt);
    if (!Number.isFinite(expiresMs)) return { status: "unavailable", reason: "policy_invalid" };
    if (nowMs >= expiresMs) return { status: "unavailable", reason: "expired" };
  }

  const issuedAt = policy.issuedAt?.trim() || undefined;
  if (issuedAt && !Number.isFinite(Date.parse(issuedAt))) {
    return { status: "unavailable", reason: "policy_invalid" };
  }

  return {
    status: "ready",
    snapshot: Object.freeze({
      capabilityId: policy.capabilityId.trim(),
      scope: Object.freeze({ ...input.scope }),
      operation,
      ...(issuedAt ? { issuedAt } : {}),
      ...(expiresAt ? { expiresAt } : {}),
    }),
  };
}

function isValidScope(scope: OfflineOutboxScope) {
  return Boolean(
    scope.tenantId.trim() &&
      scope.accountId.trim() &&
      scope.accountId.trim().toLowerCase() !== "anonymous" &&
      scope.workspace.trim(),
  );
}

function matchesScope(policy: BackendOfflineTeachingPolicySnapshot, scope: OfflineOutboxScope) {
  return policy.tenantId?.trim() === scope.tenantId.trim() &&
    policy.accountId?.trim() === scope.accountId.trim() &&
    policy.workspace?.trim() === scope.workspace.trim();
}
