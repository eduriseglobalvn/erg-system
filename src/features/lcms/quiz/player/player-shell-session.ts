import {
  createRuntimeKey,
  type LocalQuizAttemptScope,
  localQuizAttemptStore,
  saveApprovedOfflineQuizSnapshot,
  startAttempt,
} from "@/features/lcms/quiz/quiz-runtime";
import type { QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { QuizPackage } from "@/domain/quiz/types";

export async function createFreshLocalSession(
  assignmentId: string,
  quizPackage: QuizPackage,
  scope?: LocalQuizAttemptScope,
) {
  const localAttemptId = createRuntimeKey("attempt");
  const startKey = createRuntimeKey("start");
  const submitKey = createRuntimeKey("submit");

  return localQuizAttemptStore.createSession({
    accountId: scope?.accountId,
    assignmentId,
    attemptId: localAttemptId,
    packageHash: quizPackage.contentHash,
    portal: scope?.portal,
    quizId: quizPackage.quizId,
    quizVersion: quizPackage.quizVersion,
    shuffleSeed: `${quizPackage.contentHash}:${quizPackage.quizVersion}:${localAttemptId}`,
    startIdempotencyKey: startKey,
    submitIdempotencyKey: submitKey,
    tenantId: scope?.tenantId,
  });
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
