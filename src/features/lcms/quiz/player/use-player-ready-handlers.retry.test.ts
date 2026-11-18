import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, Question, Quiz, QuizPackage } from "@/domain/quiz/types";
import { usePlayerReadyHandlers, type PlayerReady } from "./use-player-ready-handlers";
import type { PlayerRuntime } from "./use-player-runtime";

const { createSession } = vi.hoisted(() => ({ createSession: vi.fn() }));
vi.mock("@/features/lcms/quiz/quiz-runtime/api/local-quiz-attempt-store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/lcms/quiz/quiz-runtime/api/local-quiz-attempt-store")>();
  return { ...original, localQuizAttemptStore: { ...original.localQuizAttemptStore, createSession } };
});

const session = { assignmentId: "as", quizId: "qz", reviewOnly: true, answers: {}, status: "submitted" } as unknown as LocalQuizAttemptSession;
const ready = {
  quiz: {} as Quiz, attempt: { id: "a" } as Attempt, question: { id: "q" } as Question, session,
  quizPackage: { id: "p", quizId: "qz", contentHash: "h", quizVersion: "1", quiz: { sections: [] } } as unknown as QuizPackage,
} as PlayerReady;

function setup(attemptsExhausted: boolean) {
  const rt = {
    attemptScope: { portal: "elearning", tenantId: "t" }, attemptsExhausted, drafts: {}, isTrainingMode: false,
    reviewBeforeRetryRef: { current: null }, setCurrentIndex: vi.fn(), setDrafts: vi.fn(), setLoadState: vi.fn(),
    setReviewingSubmittedAttempt: vi.fn(), setStarted: vi.fn(),
  } as unknown as PlayerRuntime;
  return { rt, hook: renderHook(() => usePlayerReadyHandlers(rt, ready)) };
}

describe("«Làm lại» on a server hand-in", () => {
  it("is not offered once the server has no attempt left", () => {
    expect(setup(true).hook.result.current.retryHandler).toBeUndefined();
  });

  it("opens a fresh session in memory only: nothing is written before the server accepts the start", async () => {
    createSession.mockImplementation(async (input) => ({ ...session, attemptId: "local", persist: input.persist }));
    const { rt, hook } = setup(false);
    hook.result.current.retryHandler?.();
    await vi.waitFor(() => expect(rt.setLoadState).toHaveBeenCalled());
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ persist: false }));
    expect(rt.reviewBeforeRetryRef.current).toMatchObject({ status: "ready", session });
  });
});
