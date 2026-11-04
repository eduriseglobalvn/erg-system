import type { ReactNode } from "react";

import type { QuizWelcomeMeta } from "@/components/quiz/quiz-welcome-screen";
import type { LocalQuizAttemptSession, QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/domain/quiz/types";

export type PlayerShellProps = {
  assignmentId?: string;
  quizId?: string;
  /** A verified .ergquiz package can use this same player without a second UI. */
  portablePackage?: QuizPackage;
  /** Portable packages may run without an online attempt endpoint. */
  portableOffline?: boolean;
  /** Question-only artifacts bypass the course welcome surface. */
  startImmediately?: boolean;
  runtimePortal?: QuizRuntimePortal;
  welcomeMeta?: QuizWelcomeMeta;
  /** Portable exams: opaque account id (class + student code) used as the attempt scope. */
  identityAccountId?: string;
  /** Portable exams: extra result-screen actions (export). Receives the finished attempt. */
  renderResultActions?: (context: { attempt: Attempt; session: LocalQuizAttemptSession; quizPackage: QuizPackage }) => ReactNode;
};
