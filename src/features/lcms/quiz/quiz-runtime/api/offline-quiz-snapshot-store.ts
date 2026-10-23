import type { QuizPackage } from "@/lib/types";
import {
  isOfflineCapabilityUsable,
  resolveOfflineCapability,
  type OfflineCapabilityScope,
  type BackendOfflinePolicySnapshot,
  type OfflineCapabilityResult,
  type OfflineQuizCapabilitySnapshot,
} from "@/platform/offline/offline-capability-policy";
import {
  assertOfflineSafeJson,
  MemoryScopedJsonStore,
  type OfflineScopedJsonStore,
} from "@/platform/offline/offline-scoped-json-store";
import { offlineScopeKey } from "@/platform/offline/offline-outbox";
import { createOfflineScopedJsonStore } from "@/platform/offline/offline-scoped-json-store";
import type { LocalQuizAttemptSession, StartAttemptResult } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";

export type OfflineQuizSnapshotRecord = OfflineQuizCapabilitySnapshot & {
  quizPackage: QuizPackage;
};

export class OfflineQuizSnapshotStoreError extends Error {
  public readonly code: "CAPABILITY_UNAVAILABLE" | "ANSWER_MATERIAL" | "SNAPSHOT_MISMATCH";

  constructor(code: OfflineQuizSnapshotStoreError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "OfflineQuizSnapshotStoreError";
  }
}

export class OfflineQuizSnapshotStore {
  private readonly store: OfflineScopedJsonStore;

  constructor(store: OfflineScopedJsonStore) {
    this.store = store;
  }

  async save(input: {
    scope: OfflineCapabilityScope;
    capability: { status: "ready"; snapshot: OfflineQuizCapabilitySnapshot };
    quizPackage: QuizPackage;
  }) {
    const snapshot = input.capability.snapshot;
    if (!isSameScope(snapshot.scope, input.scope)) {
      throw new OfflineQuizSnapshotStoreError("SNAPSHOT_MISMATCH", "The offline snapshot belongs to another account scope.");
    }
    if (
      snapshot.quizId !== input.quizPackage.quizId ||
      snapshot.quizVersion !== input.quizPackage.quizVersion ||
      snapshot.packageHash !== input.quizPackage.contentHash ||
      input.quizPackage.source !== "server" ||
      input.quizPackage.gradingMode !== "server-authoritative"
    ) {
      throw new OfflineQuizSnapshotStoreError("SNAPSHOT_MISMATCH", "The quiz package does not match the approved snapshot.");
    }
    if (containsAnswerMaterial(input.quizPackage)) {
      throw new OfflineQuizSnapshotStoreError("ANSWER_MATERIAL", "Quiz answer material cannot be stored for offline learners.");
    }

    const record: OfflineQuizSnapshotRecord = { ...snapshot, quizPackage: input.quizPackage };
    assertOfflineSafeJson(record);
    await this.store.set(offlineScopeKey(input.scope), snapshotRecordKey(snapshot), record);
    return { status: "stored" as const, snapshot: record };
  }

  async get(input: {
    scope: OfflineCapabilityScope;
    assignmentId: string;
    quizId: string;
    attemptId: string;
    nowMs?: number;
  }): Promise<OfflineQuizSnapshotRecord | null> {
    const scopeKey = offlineScopeKey(input.scope);
    const record = await this.store.get<OfflineQuizSnapshotRecord>(scopeKey, snapshotRecordKey(input));
    if (!record) return null;
    if (
      record.assignmentId !== input.assignmentId ||
      record.quizId !== input.quizId ||
      record.attemptId !== input.attemptId ||
      !isSameScope(record.scope, input.scope) ||
      !isOfflineCapabilityUsable(record, input.scope, input.nowMs)
    ) {
      if (!isOfflineCapabilityUsable(record, input.scope, input.nowMs)) {
        await this.store.remove(scopeKey, snapshotRecordKey(input));
      }
      return null;
    }
    return record;
  }

  async remove(input: { scope: OfflineCapabilityScope; assignmentId: string; quizId: string; attemptId: string }) {
    await this.store.remove(offlineScopeKey(input.scope), snapshotRecordKey(input));
  }
}

export { MemoryScopedJsonStore };

export const offlineQuizSnapshotStore = new OfflineQuizSnapshotStore(
  createOfflineScopedJsonStore("quiz-offline-snapshots-v1"),
);

export async function saveApprovedOfflineQuizSnapshot(input: {
  session: LocalQuizAttemptSession;
  quizPackage: QuizPackage;
  policy?: StartAttemptResult["policySnapshot"];
  nowMs?: number;
}): Promise<OfflineCapabilityResult> {
  const policy = input.policy as BackendOfflinePolicySnapshot | undefined;
  if (!policy) return { status: "unavailable", reason: "policy_missing" };

  const result = resolveOfflineCapability({
    scope: {
      tenantId: input.session.tenantId ?? "",
      accountId: input.session.accountId ?? "",
      workspace: input.session.portal ?? "elearning",
    },
    assignmentId: input.session.assignmentId,
    quizId: input.session.quizId,
    attemptId: input.session.attemptId,
    packageId: input.quizPackage.id,
    packageHash: input.quizPackage.contentHash,
    quizVersion: input.quizPackage.quizVersion,
    policy,
    serverClockOffsetMs: input.session.serverClockOffsetMs ?? Number.NaN,
    nowMs: input.nowMs,
  });
  if (result.status !== "ready") return result;

  await offlineQuizSnapshotStore.save({
    scope: result.snapshot.scope,
    capability: result,
    quizPackage: input.quizPackage,
  });
  return result;
}

export function getOfflineQuizSnapshot(input: {
  scope: OfflineCapabilityScope;
  assignmentId: string;
  quizId: string;
  attemptId: string;
  nowMs?: number;
}) {
  return offlineQuizSnapshotStore.get(input);
}

function snapshotRecordKey(input: Pick<OfflineQuizSnapshotRecord, "assignmentId" | "quizId" | "attemptId">) {
  return `quiz:${input.assignmentId}:${input.quizId}:${input.attemptId}`;
}

function isSameScope(left: OfflineCapabilityScope, right: OfflineCapabilityScope) {
  return left.tenantId === right.tenantId && left.accountId === right.accountId && left.workspace === right.workspace;
}

function containsAnswerMaterial(value: unknown, parentKey = ""): boolean {
  if (Array.isArray(value)) return value.some((item) => containsAnswerMaterial(item, parentKey));
  if (!value || typeof value !== "object") return false;

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();
    if (
      normalizedKey === "answerkey" ||
      normalizedKey === "correctanswer" ||
      normalizedKey === "correctanswers" ||
      normalizedKey === "correctchoiceids" ||
      normalizedKey === "correctmatchingorder" ||
      normalizedKey === "correctsequenceorder" ||
      normalizedKey === "correctinlineselections" ||
      normalizedKey === "correcttextresponses" ||
      normalizedKey === "correctnumericvalue" ||
      normalizedKey === "correctdragwordplacements" ||
      normalizedKey === "correctdragdropplacements" ||
      normalizedKey === "solution"
    ) {
      return true;
    }
    if (normalizedKey === "correct" && child === true) return true;
    if (normalizedKey === "correctvalue" && parentKey !== "numericanswer") return true;
    if (containsAnswerMaterial(child, normalizedKey)) return true;
  }
  return false;
}
