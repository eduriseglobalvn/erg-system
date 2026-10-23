import { describe, expect, test } from "vitest";

import {
  resolveOfflineCapability,
  type OfflineCapabilityInput,
} from "@/platform/offline/offline-capability-policy";

const baseInput: OfflineCapabilityInput = {
  scope: { tenantId: "tenant-a", accountId: "student-a", workspace: "STUDENT" },
  assignmentId: "assignment-a",
  quizId: "quiz-a",
  attemptId: "attempt-a",
  packageId: "package-a",
  packageHash: "hash-a",
  quizVersion: "v3",
  policy: {
    offlineAllowed: true,
    assignmentId: "assignment-a",
    quizId: "quiz-a",
    packageId: "package-a",
    packageHash: "hash-a",
    quizVersion: "v3",
    serverTimeAtStart: "2026-08-09T08:00:00.000Z",
    deadlineAt: "2026-08-09T09:00:00.000Z",
  },
  serverClockOffsetMs: 0,
  nowMs: Date.parse("2026-08-09T08:15:00.000Z"),
};

describe("offline capability policy", () => {
  test("fails closed when the learner contract does not explicitly approve offline", () => {
    const result = resolveOfflineCapability({
      ...baseInput,
      policy: { ...baseInput.policy, offlineAllowed: undefined },
    });

    expect(result).toEqual({ status: "unavailable", reason: "policy_missing" });
  });

  test("rejects mismatched identity, package and expired server deadline", () => {
    expect(resolveOfflineCapability({ ...baseInput, scope: { ...baseInput.scope, accountId: "anonymous" } }).status).toBe("unavailable");
    expect(resolveOfflineCapability({
      ...baseInput,
      policy: { ...baseInput.policy, packageHash: "other-hash" },
    })).toEqual({ status: "unavailable", reason: "package_mismatch" });
    expect(resolveOfflineCapability({
      ...baseInput,
      nowMs: Date.parse("2026-08-09T09:00:01.000Z"),
    })).toEqual({ status: "unavailable", reason: "expired" });
  });

  test("returns an immutable, scope-bound snapshot and evaluates using the server clock offset", () => {
    const result = resolveOfflineCapability({ ...baseInput, serverClockOffsetMs: 15 * 60 * 1000 });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.snapshot.scope).toEqual(baseInput.scope);
    expect(result.snapshot.attemptId).toBe("attempt-a");
    expect(result.snapshot.serverClockOffsetMs).toBe(15 * 60 * 1000);
    expect(Object.isFrozen(result.snapshot)).toBe(true);
    expect(() => {
      (result.snapshot as { quizId: string }).quizId = "other-quiz";
    }).toThrow();
  });
});
