import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { localQuizAttemptStore } from "@/features/lcms/quiz/quiz-runtime";
import { usePlayerActions, type UsePlayerActionsArgs } from "./use-player-actions";

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
