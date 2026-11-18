import {
  createRuntimeKey,
  type LocalQuizAttemptScope,
  localQuizAttemptStore,
  saveApprovedOfflineQuizSnapshot,
  startAttempt,
} from "@/features/lcms/quiz/quiz-runtime";
import { ApiClientError } from "@/lib/api-client/errors";
import type { LatestSubmittedAttempt, LocalQuizAttemptSession, QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/domain/quiz/types";

export async function createFreshLocalSession(
  assignmentId: string,
  quizPackage: QuizPackage,
  scope?: LocalQuizAttemptScope,
  persist = true,
) {
  const localAttemptId = createRuntimeKey("attempt");
  const startKey = createRuntimeKey("start");
  const submitKey = createRuntimeKey("submit");

  return localQuizAttemptStore.createSession({
    accountId: scope?.accountId,
    assignmentId,
    attemptId: localAttemptId,
    packageHash: quizPackage.contentHash,
    persist,
    portal: scope?.portal,
    quizId: quizPackage.quizId,
    quizVersion: quizPackage.quizVersion,
    shuffleSeed: `${quizPackage.contentHash}:${quizPackage.quizVersion}:${localAttemptId}`,
    startIdempotencyKey: startKey,
    submitIdempotencyKey: submitKey,
    tenantId: scope?.tenantId,
  });
}

/** A submitted session built from the server's attempt. Memory only: never saved, so a later "Làm lại" starts clean. */
export function createReviewSession(
  assignmentId: string,
  quizPackage: QuizPackage,
  submission: LatestSubmittedAttempt,
  attempt: Attempt,
  scope?: LocalQuizAttemptScope,
): LocalQuizAttemptSession {
  const submittedAt = submission.submittedAt ?? submission.startedAt ?? new Date().toISOString();
  return {
    accountId: scope?.accountId ?? undefined,
    assignmentId,
    attemptId: submission.attemptId,
    answers: Object.fromEntries(Object.entries(attempt.answers).map(([questionId, record]) => [questionId, record.input])),
    bookmarkedQuestionIds: [],
    clientEvents: [],
    packageHash: quizPackage.contentHash,
    portal: scope?.portal ?? undefined,
    quizId: quizPackage.quizId,
    quizVersion: quizPackage.quizVersion,
    reviewOnly: true, attemptsExhausted: Boolean(submission.attemptsExhausted),
    startedAt: submission.startedAt ?? submittedAt,
    status: "submitted",
    submitIdempotencyKey: "",
    submittedAt,
    tenantId: scope?.tenantId ?? undefined,
    updatedAt: submittedAt,
  };
}

/** The server answers 409 when the assignment has no attempts left ("Làm lại" after the last one); other errors keep their own message. */
export const isAttemptsExhaustedError = (error: unknown) => error instanceof ApiClientError && error.status === 409;

export function startAttemptErrorMessage(error: unknown) {
  if (isAttemptsExhaustedError(error)) return "Bài này đã hết lượt làm, không thể làm lại. Hãy hỏi giáo viên nếu bạn cần thêm lượt.";
  return error instanceof Error ? error.message : "Không thể bắt đầu lượt làm. Vui lòng thử lại.";
}

export async function ensureServerAttempt(
  session: Awaited<ReturnType<typeof createFreshLocalSession>>,
  quizPackage: QuizPackage,
  portal: QuizRuntimePortal,
) {
  if (session.serverStarted) {
    return session;
  }

  const startedAttempt = await startAttempt({
    assignmentId: session.assignmentId,
    idempotencyKey: session.startIdempotencyKey ?? createRuntimeKey("start"),
    localAttemptId: session.attemptId,
    packageHash: quizPackage.contentHash,
    packageId: quizPackage.id,
    portal,
    quizId: quizPackage.quizId,
  });

  const nextSession = await localQuizAttemptStore.markServerStarted(session, startedAttempt);
  // Missing offlineAllowed is intentionally a no-op. The learner endpoint currently
  // does not publish this capability, so the client must never infer it from a quiz id.
  await saveApprovedOfflineQuizSnapshot({
    session: nextSession,
    quizPackage,
    policy: startedAttempt.policySnapshot,
  });
  return nextSession;
}
