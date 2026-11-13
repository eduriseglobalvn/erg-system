import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import { studentDashboardQueryKeys } from "@/features/elearning/student-dashboard/api/student-dashboard-query";
import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/domain/quiz/types";
import { usePlayerActions, type UsePlayerActionsArgs } from "./use-player-actions";

vi.mock("@/features/lcms/quiz/quiz-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/quiz/quiz-runtime")>()),
  buildClientSubmitPayload: vi.fn(() => ({})),
  submitFinalAttempt: vi.fn(async () => ({ id: "attempt-1" })),
}));

describe("startLocalRetry (D12)", () => {
  it("only switches the player into the local retry, sorted, without saving or submitting", () => {
    const storeSpies = Object.keys(localQuizAttemptStore).map((key) =>
      vi.spyOn(localQuizAttemptStore, key as keyof typeof localQuizAttemptStore),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const setters = {
      setCurrentIndex: vi.fn(), setDrafts: vi.fn(), setLoadState: vi.fn(), setLocalRetryIndices: vi.fn(),
      setReviewingSubmittedAttempt: vi.fn(), setStarted: vi.fn(), setSubmitDialogMode: vi.fn(),
      setSubmitError: vi.fn(), setSubmitting: vi.fn(), setTimeUp: vi.fn(),
    };
    const saveAttemptAnswerAsync = vi.fn();
    const args = {
      activeAttempt: null, activePackage: null, activeQuestion: null, activeQuiz: null, activeSession: null,
      allQuestionsAnswered: true, attemptCompleted: true, attemptExpired: false,
      attemptScope: { portal: "elearning", tenantId: "t" }, drafts: {}, isTrainingMode: false, portableOffline: false,
      queryClient: new QueryClient(), questions: [], runtimePortal: "elearning", saveAttemptAnswerAsync,
      submitFailed: false, submitting: false, ...setters,
    } as unknown as UsePlayerActionsArgs;

    const { result } = renderHook(() => usePlayerActions(args));
    act(() => result.current.startLocalRetry([36, 6, 53]));
    act(() => result.current.startLocalRetry([]));

    expect(setters.setLocalRetryIndices).toHaveBeenCalledTimes(1);
    expect(setters.setLocalRetryIndices).toHaveBeenCalledWith([6, 36, 53]);
    for (const [name, setter] of Object.entries(setters)) {
      if (name !== "setLocalRetryIndices") expect(setter).not.toHaveBeenCalled();
    }
    expect(saveAttemptAnswerAsync).not.toHaveBeenCalled();
    for (const spy of storeSpies) expect(spy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("submitReadyAttempt", () => {
  it("marks the student dashboard stale so the home screen shows the hand-in at once", async () => {
    const session = { assignmentId: "a-1", attemptId: "attempt-1", quizId: "q-1", clientEvents: [], serverStarted: true, submitIdempotencyKey: "k" } as unknown as LocalQuizAttemptSession;
    vi.spyOn(localQuizAttemptStore, "markSubmitting").mockResolvedValue(session);
    vi.spyOn(localQuizAttemptStore, "markSubmitted").mockResolvedValue(session);
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const noop = vi.fn();
    const args = {
      activeAttempt: null, activePackage: null, activeQuestion: null, activeQuiz: null, activeSession: null,
      allQuestionsAnswered: true, attemptCompleted: false, attemptExpired: false,
      attemptScope: { portal: "elearning", tenantId: "t" }, drafts: {}, isTrainingMode: false, portableOffline: false,
      queryClient, questions: [], runtimePortal: "elearning", saveAttemptAnswerAsync: noop,
      submitFailed: false, submitting: false, setCurrentIndex: noop, setDrafts: noop, setLoadState: noop,
      setLocalRetryIndices: noop, setReviewingSubmittedAttempt: noop, setStarted: noop, setSubmitDialogMode: noop,
      setSubmitError: noop, setSubmitting: noop, setTimeUp: noop,
    } as unknown as UsePlayerActionsArgs;

    const { result } = renderHook(() => usePlayerActions(args));
    await act(() => result.current.submitReadyAttempt({ quiz: { id: "q-1" } } as unknown as QuizPackage, session, { id: "attempt-1" } as Attempt));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: studentDashboardQueryKeys.root });
    vi.restoreAllMocks();
  });
});
