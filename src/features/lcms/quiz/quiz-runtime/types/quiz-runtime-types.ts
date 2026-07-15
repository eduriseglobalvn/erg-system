import type { AnswerPayload, Attempt, Quiz, QuizPackage } from "@/lib/types";

export type LocalQuizAttemptStatus = "in_progress" | "submitting" | "submitted" | "submit_failed";
export type QuizRuntimePortal = "elearning" | "lms";

export type LocalQuizAttemptSession = {
  accountId?: string;
  attemptId: string;
  assignmentId: string;
  quizId: string;
  portal?: QuizRuntimePortal;
  packageHash: string;
  quizVersion: string;
  tenantId?: string;
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  status: LocalQuizAttemptStatus;
  answers: Record<string, AnswerPayload>;
  bookmarkedQuestionIds: string[];
  clientEvents: Array<Record<string, unknown>>;
  serverStarted?: boolean;
  shuffleSeed?: string;
  startIdempotencyKey?: string;
  submitIdempotencyKey: string;
};

export type StartAttemptInput = {
  assignmentId: string;
  idempotencyKey: string;
  localAttemptId: string;
  packageHash: string;
  packageId: string;
  portal?: QuizRuntimePortal;
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
  portal?: QuizRuntimePortal;
  quiz: Quiz;
  quizPackage: QuizPackage;
};

export type SaveAttemptDraftPayload = {
  answers: Record<string, AnswerPayload>;
  packageHash?: string;
  quizVersion?: string;
  events?: Array<Record<string, unknown>>;
  client?: Record<string, unknown>;
};

export type RuntimeServerAttemptSnapshot = {
  id: string;
  assignmentId?: string;
  quizId?: string;
  studentId?: string;
  packageId?: string;
  packageHash?: string;
  status?: string;
  answers?: Record<string, unknown>;
  score?: number;
  maxScore?: number;
  percent?: number;
  passed?: boolean;
  startedAt?: string;
  submittedAt?: string;
  updatedAt?: string;
};

export type SaveAttemptDraftInput = {
  attemptId: string;
  payload: SaveAttemptDraftPayload;
  portal?: QuizRuntimePortal;
};

export type SaveAttemptAnswerPayload = {
  answer: AnswerPayload;
  answeredAt: string;
  clientResult?: Record<string, unknown>;
};

export type SaveAttemptAnswerInput = {
  attemptId: string;
  payload: SaveAttemptAnswerPayload;
  portal?: QuizRuntimePortal;
  questionId: string;
};

export type SaveAttemptAnswerResult = {
  attemptId: string;
  questionId: string;
  saved: boolean;
};

export type SyncAttemptPayload = {
  packageHash: string;
  quizVersion?: string;
  attempt?: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
  client?: Record<string, unknown>;
};

export type SyncAttemptInput = {
  attemptId: string;
  payload: SyncAttemptPayload;
  portal?: QuizRuntimePortal;
};

export type SyncAttemptResult = {
  status: string;
  serverAttempt?: RuntimeServerAttemptSnapshot;
  conflicts: string[];
};

export type LoadedQuizRuntime = {
  attempt: Attempt;
  quizPackage: QuizPackage;
  restored: boolean;
  session: LocalQuizAttemptSession;
};
