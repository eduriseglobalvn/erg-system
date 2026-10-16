import { createAttemptSession, gradeAttemptLocally } from "@/lib/assessment-engine";
import { getAllQuestions } from "@/lib/quiz";
import type { Attempt, Quiz, QuizPackage } from "@/lib/types";
import type { FinalSubmitPayload, RuntimeServerAttemptSnapshot, SubmitAttemptInput } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";
import { isRecord } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-normalization-utils";

export type BackendSubmitAttemptResponse =
  | Attempt
  | BackendSubmitAttemptAggregate
  | {
      attempt?: Attempt;
      result?: Attempt;
    };

type BackendSubmitAttemptAggregate = {
  score?: number;
  maxScore?: number;
  percent?: number;
  passed?: boolean;
};

export function buildClientSubmitPayload(input: {
  answers: FinalSubmitPayload["answers"];
  attemptId: string;
  clientEvents: FinalSubmitPayload["clientEvents"];
  quizPackage: QuizPackage;
  startedAt: string;
  submittedAt: string;
}): FinalSubmitPayload {
  const clientAttempt = gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.answers);

  return {
    packageHash: input.quizPackage.contentHash,
    quizVersion: input.quizPackage.quizVersion,
    startedAt: input.startedAt,
    submittedAt: input.submittedAt,
    durationMs: Math.max(0, Date.parse(input.submittedAt) - Date.parse(input.startedAt)),
    answers: input.answers,
    clientResult: {
      score: clientAttempt.totalScore,
      maxScore: clientAttempt.maxScore,
      percent: clientAttempt.percent,
    },
    clientEvents: input.clientEvents,
  };
}

export function createEmptyAttempt(quizPackage: QuizPackage, attemptId: string): Attempt {
  return createAttemptSession(quizPackage, attemptId).attempt;
}

export function gradeFinalAttemptLocally(
  quizPackage: QuizPackage,
  attemptId: string,
  answers: FinalSubmitPayload["answers"],
): Attempt {
  const session = createAttemptSession(quizPackage, attemptId);
  return gradeAttemptLocally(session, answers).attempt;
}

export function normalizeSubmitResponse(response: BackendSubmitAttemptResponse, input: SubmitAttemptInput): Attempt {
  if (isAttempt(response)) {
    return response;
  }

  const record: Record<string, unknown> = isRecord(response) ? response : {};
  if (record.attempt && isAttempt(record.attempt)) {
    return record.attempt;
  }

  if (record.result && isAttempt(record.result)) {
    return record.result;
  }

  if (isSubmitAggregate(response)) {
    return aggregateSubmitResponseToAttempt(response, input);
  }

  throw new Error("Submit attempt response is missing a valid attempt result.");
}

function aggregateSubmitResponseToAttempt(response: BackendSubmitAttemptAggregate, input: SubmitAttemptInput): Attempt {
  const answers = Object.fromEntries(
    Object.entries(input.payload.answers).map(([questionId, answer]) => [
      questionId,
      {
        questionId,
        input: answer,
        result: {
          questionId,
          correct: false,
          partiallyRight: false,
          awardedPoints: 0,
          maxPoints: 0,
        },
      },
    ]),
  ) as Attempt["answers"];
  const totalQuestions = getAllQuestions(input.quizPackage.quiz).length;

  return {
    id: input.attemptId,
    quizId: input.quiz.id,
    answers,
    submittedCount: Object.keys(input.payload.answers).length,
    totalQuestions,
    totalScore: response.score ?? 0,
    maxScore: response.maxScore ?? totalQuestions,
    percent: response.percent ?? 0,
    passed: Boolean(response.passed),
  };
}

function isAttempt(value: unknown): value is Attempt {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "answers" in value &&
      "submittedCount" in value &&
      "totalScore" in value &&
      "maxScore" in value,
  );
}

function isSubmitAggregate(value: unknown): value is BackendSubmitAttemptAggregate {
  return Boolean(
    value &&
      typeof value === "object" &&
      "score" in value &&
      "maxScore" in value &&
      "percent" in value &&
      "passed" in value,
  );
}

export function isServerAttemptSnapshot(value: unknown): value is RuntimeServerAttemptSnapshot {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { id?: unknown }).id === "string",
  );
}

export function countAnsweredQuestions(quiz: Quiz, answers: FinalSubmitPayload["answers"]) {
  return getAllQuestions(quiz).filter((question) => Boolean(answers[question.id])).length;
}
