import { createAttemptSession, createQuizPackage, gradeAttemptLocally } from "@/lib/assessment-engine";
import { getAllQuestions } from "@/lib/quiz";
import { sampleQuiz } from "@/lib/sample-quiz";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { shouldUseLocalQuizRuntimeFallback } from "@/features/quiz-runtime/api/quiz-runtime-fallback";
import type { Attempt, Quiz, QuizPackage } from "@/lib/types";
import type {
  FinalSubmitPayload,
  StartAttemptInput,
  StartAttemptResult,
  SubmitAttemptInput,
} from "@/features/quiz-runtime/types/quiz-runtime-types";

type BackendQuizPackage = Partial<Omit<QuizPackage, "quiz">> & {
  quiz?: unknown;
};

type BackendStartAttemptResponse = {
  attemptId?: string;
  id?: string;
  attempt?: {
    id?: string;
  };
};

type BackendSubmitAttemptResponse =
  | Attempt
  | {
      attempt?: Attempt;
      result?: Attempt;
    };

export async function getQuizPackage(quizId: string): Promise<QuizPackage> {
  if (!hasApiBase()) {
    return createQuizPackage(sampleQuiz, {
      gradingMode: "client-first",
      source: "local",
    });
  }

  try {
    const backendPackage = await apiRequest<BackendQuizPackage>(`/api/lms/quizzes/${quizId}/package`);
    return normalizeQuizPackage(backendPackage);
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(quizId, error)) {
      return createQuizPackage(sampleQuiz, {
        gradingMode: "client-first",
        source: "local",
      });
    }

    throw error;
  }
}

export async function startAttempt(input: StartAttemptInput): Promise<StartAttemptResult> {
  if (!hasApiBase()) {
    return { attemptId: input.localAttemptId };
  }

  try {
    const response = await apiRequest<BackendStartAttemptResponse>("/api/lms/attempts", {
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

    return {
      attemptId: response.attemptId ?? response.id ?? response.attempt?.id ?? input.localAttemptId,
    };
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(input.quizId, error)) {
      return { attemptId: input.localAttemptId };
    }

    throw error;
  }
}

export async function submitFinalAttempt(input: SubmitAttemptInput): Promise<Attempt> {
  if (!hasApiBase()) {
    return gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.payload.answers);
  }

  try {
    const response = await apiRequest<BackendSubmitAttemptResponse>(
      `/api/lms/attempts/${input.attemptId}/submit`,
      {
        method: "POST",
        headers: {
          "X-Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify(input.payload),
      },
    );

    return normalizeSubmitResponse(response, input.quiz, input.quizPackage, input.attemptId, input.payload);
  } catch (error) {
    if (shouldUseLocalQuizRuntimeFallback(input.quiz.id, error)) {
      return gradeFinalAttemptLocally(input.quizPackage, input.attemptId, input.payload.answers);
    }

    throw error;
  }
}

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

function normalizeQuizPackage(value: BackendQuizPackage): QuizPackage {
  const quiz = extractQuiz(value.quiz);
  const quizVersion = String(value.quizVersion ?? quiz.version);
  const contentHash = value.contentHash ?? createQuizPackage(quiz).contentHash;

  return {
    id: value.id ?? `pkg_${quiz.id}_${quizVersion}_${contentHash.slice(-10)}`,
    quizId: value.quizId ?? quiz.id,
    quizVersion,
    generatedAt: value.generatedAt ?? new Date().toISOString(),
    expiresAt: value.expiresAt,
    contentHash,
    signature: value.signature,
    publicKeyId: value.publicKeyId,
    gradingMode: value.gradingMode ?? "server-authoritative",
    source: value.source ?? "server",
    quiz,
  };
}

function extractQuiz(value: unknown): Quiz {
  if (isQuiz(value)) {
    return value;
  }

  if (value && typeof value === "object" && "quiz" in value) {
    const nestedQuiz = (value as { quiz?: unknown }).quiz;
    if (isQuiz(nestedQuiz)) {
      return nestedQuiz;
    }
  }

  throw new Error("Quiz package response is missing a playable quiz.");
}

function normalizeSubmitResponse(
  response: BackendSubmitAttemptResponse,
  quiz: Quiz,
  quizPackage: QuizPackage,
  attemptId: string,
  payload: FinalSubmitPayload,
): Attempt {
  if (isAttempt(response)) {
    return response;
  }

  if (response.attempt && isAttempt(response.attempt)) {
    return response.attempt;
  }

  if (response.result && isAttempt(response.result)) {
    return response.result;
  }

  const localAttempt = gradeFinalAttemptLocally(quizPackage, attemptId, payload.answers);
  return {
    ...localAttempt,
    quizId: quiz.id,
  };
}

function isQuiz(value: unknown): value is Quiz {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "settings" in value &&
      "sections" in value &&
      Array.isArray((value as { sections?: unknown }).sections),
  );
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

export function countAnsweredQuestions(quiz: Quiz, answers: FinalSubmitPayload["answers"]) {
  return getAllQuestions(quiz).filter((question) => Boolean(answers[question.id])).length;
}
