import type { AnswerPayload, Attempt, Quiz, QuizPackage } from "@/lib/types";

export type LocalQuizAttemptStatus = "in_progress" | "submitting" | "submitted" | "submit_failed";

export type LocalQuizAttemptSession = {
  attemptId: string;
  assignmentId: string;
  quizId: string;
  packageHash: string;
  quizVersion: string;
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  status: LocalQuizAttemptStatus;
  answers: Record<string, AnswerPayload>;
  bookmarkedQuestionIds: string[];
  clientEvents: Array<Record<string, unknown>>;
  submitIdempotencyKey: string;
};

export type StartAttemptInput = {
  assignmentId: string;
  idempotencyKey: string;
  localAttemptId: string;
  packageHash: string;
  packageId: string;
  quizId: string;
};

export type StartAttemptResult = {
  attemptId: string;
};

export type FinalSubmitPayload = {
  packageHash: string;
  quizVersion: string;
  startedAt: string;
  submittedAt: string;
  durationMs: number;
  answers: Record<string, AnswerPayload>;
  clientResult: {
    score: number;
    maxScore: number;
    percent: number;
  };
  clientEvents: Array<Record<string, unknown>>;
};

export type SubmitAttemptInput = {
  attemptId: string;
  idempotencyKey: string;
  payload: FinalSubmitPayload;
  quiz: Quiz;
  quizPackage: QuizPackage;
};

export type LoadedQuizRuntime = {
  attempt: Attempt;
  quizPackage: QuizPackage;
  restored: boolean;
  session: LocalQuizAttemptSession;
};
