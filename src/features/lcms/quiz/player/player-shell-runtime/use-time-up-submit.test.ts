import { renderHook, waitFor } from "@testing-library/react";
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
    setSubmitDialogMode: vi.fn(),
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

describe("useTimeUpSubmit with the submit dialog open", () => {
  it("closes the dialog and submits exactly once when time runs out", () => {
    const a = args({ activeSession: { attemptId: "att-dlg" } as never });
    const { rerender } = renderHook((p: UseTimeUpSubmitArgs) => useTimeUpSubmit(p), { initialProps: a });
    expect(a.setSubmitDialogMode).toHaveBeenCalledWith(null);
    // The dialog (or the confirm key) is gone, so nothing else can submit; re-renders must not fire again.
    rerender({ ...a });
    rerender({ ...a, submitting: false });
    expect(a.submitReadyAttempt).toHaveBeenCalledOnce();
    expect(a.setSubmitDialogMode).toHaveBeenCalledTimes(1);
  });

  it("leaves the dialog alone when no auto-submit happens", () => {
    const a = args({ timeUp: false });
    renderHook(() => useTimeUpSubmit(a));
    expect(a.setSubmitDialogMode).not.toHaveBeenCalled();
  });
});

describe("useTimeUpSubmit idempotency and offline", () => {
  it("fires exactly once across re-renders for the same attempt", () => {
    const a = args({ activeSession: { attemptId: "att-1" } as never });
    const { rerender } = renderHook((p: UseTimeUpSubmitArgs) => useTimeUpSubmit(p), { initialProps: a });
    rerender({ ...a, submitting: false });
    rerender({ ...a, submitting: false });
    expect(a.submitReadyAttempt).toHaveBeenCalledOnce();
  });

  it("goes to waiting-network when submit fails offline, and retries on online", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const submitReadyAttempt = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const store = (await import("@/features/lcms/quiz/quiz-runtime")).localQuizAttemptStore as unknown as Record<string, ReturnType<typeof vi.fn>>;
    store.getSession.mockResolvedValue({ attemptId: "att-2" });
    store.markSubmitFailed.mockResolvedValue({ attemptId: "att-2" });
    const a = args({ activeSession: { attemptId: "att-2" } as never, submitReadyAttempt });
    const { result } = renderHook(() => useTimeUpSubmit(a));
    await waitFor(() => expect(result.current.phase).toBe("waiting-network"));
    window.dispatchEvent(new Event("online"));
    await waitFor(() => expect(submitReadyAttempt).toHaveBeenCalledTimes(2));
    vi.restoreAllMocks();
  });
});

describe("useTimeUpSubmit P0-13: network lost at time-up", () => {
  it("keeps answers, waits offline, then submits once on reconnect and returns to idle", async () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const store = (await import("@/features/lcms/quiz/quiz-runtime")).localQuizAttemptStore as unknown as Record<string, ReturnType<typeof vi.fn>>;
    store.getSession.mockResolvedValue({ attemptId: "att-3" });
    store.markSubmitFailed.mockClear().mockResolvedValue({ attemptId: "att-3", status: "submit_failed" });
    const submitReadyAttempt = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValue(undefined);
    const a = args({ activeSession: { attemptId: "att-3" } as never, submitReadyAttempt });
    const { result } = renderHook(() => useTimeUpSubmit(a));

    await waitFor(() => expect(result.current.phase).toBe("waiting-network"));
    expect(store.markSubmitFailed).toHaveBeenCalledTimes(1);
    expect(a.setSubmitError).toHaveBeenCalledWith("Failed to fetch");
    expect(submitReadyAttempt).toHaveBeenCalledTimes(1);

    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event("online"));
    await waitFor(() => expect(submitReadyAttempt).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.phase).toBe("idle"));

    window.dispatchEvent(new Event("online"));
    expect(submitReadyAttempt).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it("reports failed (not waiting-network) when a submit fails while online", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const store = (await import("@/features/lcms/quiz/quiz-runtime")).localQuizAttemptStore as unknown as Record<string, ReturnType<typeof vi.fn>>;
    store.getSession.mockResolvedValue({ attemptId: "att-4" });
    store.markSubmitFailed.mockResolvedValue({ attemptId: "att-4" });
    const a = args({ activeSession: { attemptId: "att-4" } as never, submitReadyAttempt: vi.fn().mockRejectedValue(new Error("500")) });
    const { result } = renderHook(() => useTimeUpSubmit(a));
    await waitFor(() => expect(result.current.phase).toBe("failed"));
    vi.restoreAllMocks();
  });
});
