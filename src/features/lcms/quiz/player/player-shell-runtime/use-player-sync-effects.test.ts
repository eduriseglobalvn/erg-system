import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AnswerPayload } from "@/domain/quiz/types";
import { usePlayerSyncEffects, type UsePlayerSyncEffectsArgs } from "./use-player-sync-effects";

vi.mock("@/features/lcms/quiz/quiz-runtime", () => ({ replayOfflineQuizAttemptQueue: vi.fn() }));

type Props = { drafts: Record<string, AnswerPayload>; currentIndex: number };

function setup(save = vi.fn().mockResolvedValue(null)) {
  const base: Omit<UsePlayerSyncEffectsArgs, "drafts" | "currentIndex"> = {
    activePackage: { contentHash: "hash-1", quizVersion: "1", quiz: { settings: { mode: "testing" } } } as never,
    activeSession: { attemptId: "att-1", serverStarted: true, clientEvents: [{ id: "e1" }], updatedAt: "now" } as never,
    attemptCompleted: false,
    attemptScope: { portal: "elearning", tenantId: "t" },
    networkOnline: true,
    runtimePortal: "elearning",
    saveAttemptDraftAsync: save,
    started: true,
    syncAttemptAsync: vi.fn().mockResolvedValue(null),
    setDraftSync: vi.fn(),
  };
  const hook = renderHook((p: Props) => usePlayerSyncEffects({ ...base, ...p }), {
    initialProps: { drafts: {}, currentIndex: 0 },
  });
  const sent = () => save.mock.calls.map(([input]) => input.payload);
  return { ...hook, save, sent };
}

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });

describe("usePlayerSyncEffects draft saving", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("collapses 10 changes within 3 seconds into a single save", async () => {
    const { rerender, save } = setup();
    for (let i = 0; i < 10; i += 1) {
      rerender({ drafts: { q1: { textResponses: { a: `v${i}` } } }, currentIndex: 0 });
      await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    }
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(save).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(save).toHaveBeenCalledOnce();
  });

  it("sends only questions changed since the last successful save, null for cleared ones, and no events", async () => {
    const { rerender, sent } = setup();
    rerender({ drafts: { q1: { choiceId: "a" }, q2: { choiceId: "b" } }, currentIndex: 0 });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    rerender({ drafts: { q2: { choiceId: "c" }, q3: { choiceId: "d" } }, currentIndex: 0 });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

    expect(sent()[0].answers).toEqual({ q1: { choiceId: "a" }, q2: { choiceId: "b" } });
    expect(sent()[1].answers).toEqual({ q1: null, q2: { choiceId: "c" }, q3: { choiceId: "d" } });
    expect(sent()[0]).not.toHaveProperty("events");
  });

  it("saves right away when the student moves to another question", async () => {
    const { rerender, save } = setup();
    rerender({ drafts: { q1: { choiceId: "a" } }, currentIndex: 0 });
    rerender({ drafts: { q1: { choiceId: "a" } }, currentIndex: 1 });
    await flush();
    expect(save).toHaveBeenCalledOnce();
  });

  it("saves right away when the page becomes hidden", async () => {
    const { rerender, save } = setup();
    rerender({ drafts: { q1: { choiceId: "a" } }, currentIndex: 0 });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await flush();
    expect(save).toHaveBeenCalledOnce();
  });

  it("resends answers whose save failed together with newer changes", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(null);
    const { rerender, sent } = setup(save);
    rerender({ drafts: { q1: { choiceId: "a" } }, currentIndex: 0 });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    rerender({ drafts: { q1: { choiceId: "a" }, q2: { choiceId: "b" } }, currentIndex: 0 });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

    expect(sent()[1].answers).toEqual({ q1: { choiceId: "a" }, q2: { choiceId: "b" } });
  });
});
