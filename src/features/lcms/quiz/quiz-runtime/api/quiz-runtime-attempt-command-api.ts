import { apiRequest, hasApiBase } from "@/lib/api-client";
import { shouldUseLocalQuizRuntimeFallback } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-fallback";
import { DEFAULT_QUIZ_RUNTIME_PORTAL } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-normalization-utils";
import { gradeFinalAttemptLocally, isServerAttemptSnapshot, normalizeSubmitResponse } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-submit-model";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { Attempt } from "@/lib/types";
import type {
  RuntimeServerAttemptSnapshot,
  SaveAttemptAnswerInput,
  SaveAttemptAnswerResult,
  SaveAttemptDraftInput,
  StartAttemptInput,
  StartAttemptResult,
  SyncAttemptInput,
  SyncAttemptResult,
  SubmitAttemptInput,
  QuizRuntimePortal,
} from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";
import type { BackendSubmitAttemptResponse } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-submit-model";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import { offlineQuizAttemptQueue } from "@/features/lcms/quiz/quiz-runtime/api/offline-quiz-attempt-queue";
import type { OfflineOutboxScope } from "@/platform/offline/offline-outbox";

type BackendStartAttemptResponse = {
  attemptId?: string;
  id?: string;
  startedAt?: string;
  policySnapshot?: {
    assignmentId?: string;
    quizId?: string;
    attemptId?: string;
    packageId?: string;
    packageHash?: string;
    quizVersion?: string;
    offlineAllowed?: boolean;
    deadlineAt?: string;
    expiresAt?: string;
    startedAt?: string;
    serverTimeAtStart?: string;
    durationMinutes?: number;
  };
  attempt?: {
    id?: string;
    startedAt?: string;
    policySnapshot?: BackendStartAttemptResponse["policySnapshot"];
  };
};

export async function startAttempt(input: StartAttemptInput): Promise<StartAttemptResult> {
  if (runtimeFixturesEnabled()) {
    return { attemptId: input.localAttemptId };
  }

  try {
    const response = await apiRequest<BackendStartAttemptResponse>(API_ENDPOINTS.lms.attempts, {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "POST",
      headers: {
        "X-Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        assignmentId: input.assignmentId,
        quizId: input.quizId,
        packageId: input.packageId,
        packageHash: input.packageHash,
      }),
    });

    const attemptId = response.attemptId ?? response.id ?? response.attempt?.id;
    if (!attemptId) {
      throw new Error("Start attempt response is missing attemptId.");
    }

    const attempt = response.attempt;
    const policySnapshot = response.policySnapshot ?? attempt?.policySnapshot;
    return {
      attemptId,
      startedAt: response.startedAt ?? attempt?.startedAt ?? policySnapshot?.startedAt,
      ...(policySnapshot ? { policySnapshot } : {}),
    };
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(input.quizId, error)) {
      return { attemptId: input.localAttemptId };
    }

    throw error;
  }
}

export async function submitFinalAttempt(input: SubmitAttemptInput): Promise<Attempt> {
  if (runtimeFixturesEnabled()) {
    return gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.payload.answers);
  }

  try {
    const response = await apiRequest<BackendSubmitAttemptResponse>(
      API_ENDPOINTS.lms.attemptSubmit(input.attemptId),
      {
        portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
        method: "POST",
        headers: {
          "X-Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify(input.payload),
      },
    );

    return normalizeSubmitResponse(response, input);
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(input.quiz.id, error)) {
      return gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.payload.answers);
    }

    throw error;
  }
}

export async function saveAttemptDraft(input: SaveAttemptDraftInput): Promise<RuntimeServerAttemptSnapshot | null> {
  if (!hasApiBase()) {
    return null;
  }

  const response = await apiRequest<RuntimeServerAttemptSnapshot>(
    API_ENDPOINTS.lms.attemptDraft(input.attemptId),
    {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "PATCH",
      body: JSON.stringify(input.payload),
    },
  );

  if (!isServerAttemptSnapshot(response)) {
    throw new Error("Save draft response is missing a valid server attempt.");
  }

  return response;
}

export async function saveAttemptAnswer(input: SaveAttemptAnswerInput): Promise<SaveAttemptAnswerResult | null> {
  if (!hasApiBase()) {
    return null;
  }

  const response = await apiRequest<SaveAttemptAnswerResult>(
    API_ENDPOINTS.lms.attemptAnswer(input.attemptId, input.questionId),
    {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "PUT",
      body: JSON.stringify(input.payload),
    },
  );

  if (!response?.saved) {
    throw new Error("Save answer response did not confirm persistence.");
  }

  return response;
}

export async function syncAttempt(input: SyncAttemptInput): Promise<SyncAttemptResult | null> {
  if (!hasApiBase()) {
    return null;
  }

  const response = await apiRequest<SyncAttemptResult>(
    API_ENDPOINTS.lms.attemptSync(input.attemptId),
    {
      portal: input.portal ?? DEFAULT_QUIZ_RUNTIME_PORTAL,
      method: "POST",
      ...(input.idempotencyKey ? { headers: { "X-Idempotency-Key": input.idempotencyKey } } : {}),
      body: JSON.stringify({
        ...input.payload,
        ...(input.operationId ? { operationId: input.operationId } : {}),
        ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
        ...(input.expectedVersion !== undefined ? { expectedVersion: input.expectedVersion } : {}),
      }),
    },
  );

  if (!response || !Array.isArray(response.conflicts)) {
    throw new Error("Sync attempt response is missing conflict metadata.");
  }

  if (response.conflicts.length > 0 && input.throwOnConflict !== false) {
    throw new Error(`Sync attempt conflict: ${response.conflicts.join(", ")}`);
  }

  return response;
}

export async function replayOfflineQuizAttemptQueue(scope: OfflineOutboxScope, portal: QuizRuntimePortal = DEFAULT_QUIZ_RUNTIME_PORTAL) {
  return offlineQuizAttemptQueue.replay(scope, async (mutation) => {
    const payload = mutation.payload as {
      attemptId?: string;
      packageHash?: string;
      quizVersion?: string;
      attempt?: Record<string, unknown>;
      events?: Array<Record<string, unknown>>;
      client?: Record<string, unknown>;
    };
    if (!payload.attemptId || !payload.packageHash || !Array.isArray(payload.events)) {
      return { kind: "failed" as const, reason: "Offline quiz mutation payload is invalid." };
    }
    try {
      const response = await syncAttempt({
        attemptId: payload.attemptId,
        operationId: mutation.operationId,
        idempotencyKey: mutation.idempotencyKey,
        expectedVersion: mutation.expectedVersion,
        throwOnConflict: false,
        payload: {
          packageHash: payload.packageHash,
          quizVersion: payload.quizVersion,
          attempt: payload.attempt,
          events: payload.events,
          client: payload.client,
        },
        portal,
      });
      if (!response) return { kind: "retry" as const, reason: "API base is unavailable." };
      if (response.conflicts.length) {
        return {
          kind: "conflict" as const,
          conflict: {
            code: "QUIZ_ATTEMPT_CONFLICT",
            operationId: mutation.operationId,
            idempotencyKey: mutation.idempotencyKey,
            entityType: mutation.entityType,
            entityId: mutation.entityId,
            expectedVersion: mutation.expectedVersion,
            retryable: false,
            message: response.conflicts.join(", "),
          },
        };
      }
      return { kind: "succeeded" as const };
    } catch (error) {
      return { kind: "retry" as const, reason: error instanceof Error ? error.message : "Quiz sync failed." };
    }
  }, { isOnline: () => typeof navigator === "undefined" || navigator.onLine });
}
