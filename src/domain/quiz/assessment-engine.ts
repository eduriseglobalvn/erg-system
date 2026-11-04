import {
  getAllQuestions,
  normalizeAnswerForSubmission,
  scoreQuestion,
} from "@/domain/quiz/quiz";
import type {
  AnswerPayload,
  AnswerResult,
  Attempt,
  AttemptEvent,
  AttemptSession,
  AttemptSyncPayload,
  Quiz,
  QuizPackage,
} from "@/domain/quiz/types";

type PackageOptions = {
  generatedAt?: string;
  gradingMode?: QuizPackage["gradingMode"];
  source?: QuizPackage["source"];
};

export function createQuizPackage(quiz: Quiz, options: PackageOptions = {}): QuizPackage {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const contentHash = createStableHash({
    id: quiz.id,
    version: quiz.version,
    settings: quiz.settings,
    sections: quiz.sections,
  });

  return {
    id: `pkg_${quiz.id}_${quiz.version}_${contentHash.slice(-10)}`,
    quizId: quiz.id,
    quizVersion: quiz.version,
    generatedAt,
    contentHash,
    gradingMode: options.gradingMode ?? "client-first",
    source: options.source ?? "local",
    quiz,
  };
}

export function createAttemptSession(quizPackage: QuizPackage, attemptId = createRuntimeId("attempt")): AttemptSession {
  const now = new Date().toISOString();
  const questions = getAllQuestions(quizPackage.quiz);
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const attempt: Attempt = {
    id: attemptId,
    quizId: quizPackage.quizId,
    submittedCount: 0,
    totalQuestions: questions.length,
    totalScore: 0,
    maxScore,
    percent: 0,
    passed: false,
    answers: {},
  };

  return {
    attempt,
    package: quizPackage,
    events: [
      createAttemptEvent({
        attempt,
        packageId: quizPackage.id,
        type: "attempt_started",
        meta: {
          contentHash: quizPackage.contentHash,
          quizVersion: quizPackage.quizVersion,
        },
      }),
    ],
    syncStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export function gradeAnswerLocally(
  session: AttemptSession,
  questionId: string,
  answer: AnswerPayload,
): { session: AttemptSession; result: AnswerResult } {
  const question = getAllQuestions(session.package.quiz).find((item) => item.id === questionId);
  if (!question) {
    throw new Error("Question not found");
  }

  const normalizedAnswer = normalizeAnswerForSubmission(question, answer);
  const result = scoreQuestion(question, normalizedAnswer);
  const nextAttempt = recalculateAttempt({
    ...session.attempt,
    answers: {
      ...session.attempt.answers,
      [questionId]: {
        questionId,
        input: normalizedAnswer,
        result,
      },
    },
  }, session.package.quiz);
  const nextSession = appendSessionEvent(session, {
    attempt: nextAttempt,
    type: "answer_graded",
    questionId,
    answer: normalizedAnswer,
    result,
  });

  return { session: nextSession, result };
}

export function gradeAttemptLocally(
  session: AttemptSession,
  answers: Record<string, AnswerPayload>,
): AttemptSession {
  let nextSession = session;

  for (const question of getAllQuestions(session.package.quiz)) {
    const normalizedAnswer = normalizeAnswerForSubmission(question, answers[question.id]);
    nextSession = gradeAnswerLocally(nextSession, question.id, normalizedAnswer).session;
  }

  return appendSessionEvent(
    {
      ...nextSession,
      submittedAt: new Date().toISOString(),
    },
    {
      attempt: nextSession.attempt,
      type: "attempt_submitted",
      attemptSnapshot: nextSession.attempt,
    },
  );
}

export function buildAttemptSyncPayload(session: AttemptSession): AttemptSyncPayload {
  return {
    attemptId: session.attempt.id,
    quizId: session.attempt.quizId,
    packageId: session.package.id,
    packageHash: session.package.contentHash,
    quizVersion: session.package.quizVersion,
    submittedAt: session.submittedAt,
    attempt: session.attempt,
    events: session.events,
    client: {
      runtime: getRuntimeKind(),
      gradingStrategy: session.package.gradingMode,
    },
  };
}

export function markSessionSyncFailed(session: AttemptSession, reason: string): AttemptSession {
  return appendSessionEvent(session, {
    attempt: session.attempt,
    type: "sync_failed",
    meta: { reason },
  });
}

export function markSessionSynced(session: AttemptSession): AttemptSession {
  return {
    ...appendSessionEvent(session, {
      attempt: session.attempt,
      type: "sync_succeeded",
    }),
    syncStatus: "synced",
  };
}

function appendSessionEvent(
  session: AttemptSession,
  eventInput: Omit<AttemptEvent, "id" | "attemptId" | "quizId" | "packageId" | "createdAt"> & {
    attempt: Attempt;
  },
): AttemptSession {
  const now = new Date().toISOString();
  const { attempt, ...event } = eventInput;

  return {
    ...session,
    attempt,
    events: [
      ...session.events,
      createAttemptEvent({
        attempt,
        packageId: session.package.id,
        ...event,
      }),
    ],
    syncStatus: "pending",
    updatedAt: now,
  };
}

function createAttemptEvent({
  attempt,
  packageId,
  type,
  questionId,
  answer,
  result,
  attemptSnapshot,
  meta,
}: {
  attempt: Attempt;
  packageId: string;
  type: AttemptEvent["type"];
  questionId?: string;
  answer?: AnswerPayload;
  result?: AnswerResult;
  attemptSnapshot?: Attempt;
  meta?: Record<string, unknown>;
}): AttemptEvent {
  return {
    id: createRuntimeId("evt"),
    attemptId: attempt.id,
    quizId: attempt.quizId,
    packageId,
    type,
    createdAt: new Date().toISOString(),
    questionId,
    answer,
    result,
    attemptSnapshot,
    meta,
  };
}

function recalculateAttempt(attempt: Attempt, quiz: Quiz): Attempt {
  const submittedCount = Object.keys(attempt.answers).length;
  const totalScore = Object.values(attempt.answers).reduce(
    (sum, record) => sum + record.result.awardedPoints,
    0,
  );
  const percent = attempt.maxScore > 0 ? Math.floor((totalScore / attempt.maxScore) * 100) : 0;

  return {
    ...attempt,
    submittedCount,
    totalScore,
    percent,
    passed: percent >= quiz.settings.passPercent,
  };
}

function createRuntimeId(prefix: string) {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${randomId}`;
}

function createStableHash(value: unknown) {
  const input = stableStringify(value);
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a32_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function getRuntimeKind(): AttemptSyncPayload["client"]["runtime"] {
  return typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_INTERNALS__" in window)
    ? "tauri"
    : "web";
}
