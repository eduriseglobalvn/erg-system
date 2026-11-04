import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTimeUpSubmit, type UseTimeUpSubmitArgs } from "./use-time-up-submit";

vi.mock("@/features/lcms/quiz/quiz-runtime", () => ({
  createEmptyAttempt: vi.fn(),
  localQuizAttemptStore: { getSession: vi.fn(), markSubmitFailed: vi.fn() },
}));

function args(overrides: Partial<UseTimeUpSubmitArgs> = {}): UseTimeUpSubmitArgs {
  return {
    activeAttempt: null,
    activePackage: {} as never,
    activeSession: {} as never,
    attemptCompleted: false,
    attemptScope: { portal: "elearning", tenantId: "t" },
    isTestingMode: true,
    started: true,
    submitReadyAttempt: vi.fn().mockResolvedValue(undefined),
    submitting: false,
    timeUp: true,
    setLoadState: vi.fn(),
    setSubmitError: vi.fn(),
    setSubmitting: vi.fn(),
    ...overrides,
  };
}

describe("useTimeUpSubmit", () => {
  it("submits automatically once time is up in testing mode", () => {
    const a = args();
    renderHook(() => useTimeUpSubmit(a));
    expect(a.submitReadyAttempt).toHaveBeenCalledOnce();
    expect(a.setSubmitting).toHaveBeenCalledWith(true);
  });

  it.each([
    ["time not up", { timeUp: false }],
    ["already completed", { attemptCompleted: true }],
    ["already submitting", { submitting: true }],
    ["training mode", { isTestingMode: false }],
  ])("does not submit when %s", (_name, overrides) => {
    const a = args(overrides);
    renderHook(() => useTimeUpSubmit(a));
    expect(a.submitReadyAttempt).not.toHaveBeenCalled();
  });
});
