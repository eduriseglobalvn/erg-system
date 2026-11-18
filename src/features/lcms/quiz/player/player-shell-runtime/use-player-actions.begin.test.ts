import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/domain/quiz/types";
import { usePlayerActions, type UsePlayerActionsArgs } from "./use-player-actions";

const { ensureServerAttempt, toastError } = vi.hoisted(() => ({ ensureServerAttempt: vi.fn(), toastError: vi.fn() }));

vi.mock("sonner", () => ({ toast: { error: toastError } }));
vi.mock("@/features/lcms/quiz/player/player-shell-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/quiz/player/player-shell-session")>()),
  ensureServerAttempt,
}));

function setup() {
  const setSubmitError = vi.fn();
  const onAttemptsExhausted = vi.fn();
  const args = {
    activeAttempt: { id: "a" } as Attempt,
    activePackage: { id: "p" } as QuizPackage,
    activeSession: { answers: {} } as unknown as LocalQuizAttemptSession,
    attemptScope: { portal: "elearning", tenantId: "t" },
    drafts: {}, portableOffline: false, queryClient: new QueryClient(), questions: [], runtimePortal: "elearning",
    setCurrentIndex: vi.fn(), setDrafts: vi.fn(), setLoadState: vi.fn(), setStarted: vi.fn(), setSubmitting: vi.fn(),
    setSubmitError, setTimeUp: vi.fn(), onAttemptsExhausted,
  } as unknown as UsePlayerActionsArgs;
  return { setSubmitError, onAttemptsExhausted, hook: renderHook(() => usePlayerActions(args)) };
}

describe("beginAttempt when the server refuses a new attempt", () => {
  beforeEach(() => {
    ensureServerAttempt.mockReset();
    toastError.mockReset();
  });

  it("tells the student in Vietnamese when no attempts are left (409)", async () => {
    ensureServerAttempt.mockRejectedValue(new ApiClientError("Conflict", "CONFLICT", 409));
    const { hook, setSubmitError, onAttemptsExhausted } = setup();
    await act(() => hook.result.current.beginAttempt());
    expect(onAttemptsExhausted).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("hết lượt làm"));
    expect(setSubmitError).toHaveBeenLastCalledWith(expect.stringContaining("hết lượt làm"));
  });

  it("keeps the server message for other errors", async () => {
    ensureServerAttempt.mockRejectedValue(new Error("Mất kết nối"));
    const { hook, onAttemptsExhausted } = setup();
    await act(() => hook.result.current.beginAttempt());
    expect(onAttemptsExhausted).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Mất kết nối");
  });
});
