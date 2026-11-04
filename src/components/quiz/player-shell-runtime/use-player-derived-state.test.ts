import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerLoadState } from "@/components/quiz/player-shell-runtime-model";
import { usePlayerDerivedState } from "@/components/quiz/player-shell-runtime/use-player-derived-state";
import type { LocalQuizAttemptSession } from "@/lib/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/lib/types";

const START = Date.parse("2026-11-04T10:00:00.000Z");
const question = { id: "q1", kind: "single_choice", title: "Q", points: 1, feedback: { correct: "", incorrect: "", partial: "" } };

function state(session: Partial<LocalQuizAttemptSession>, mode: "testing" | "training" = "testing", minutes = 10): PlayerLoadState {
  return {
    status: "ready",
    attempt: { answers: {}, submittedCount: 0 } as unknown as Attempt,
    quizPackage: { quiz: { settings: { mode, timeLimitMinutes: minutes }, sections: [{ id: "s", title: "S", questions: [question] }] } } as unknown as QuizPackage,
    restored: false,
    session: { startedAt: new Date(START).toISOString(), ...session } as LocalQuizAttemptSession,
  };
}

const run = (loadState: PlayerLoadState, portableOffline?: boolean) =>
  renderHook(() => usePlayerDerivedState({ currentIndex: 0, drafts: {}, loadState, portableOffline, reviewingSubmittedAttempt: false, timeUp: false })).result.current;

describe("usePlayerDerivedState offline timer (8.4.4)", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(START + 60_000); });
  afterEach(() => vi.useRealTimers());

  it("online and not server-started: no deadline (unchanged)", () => {
    const r = run(state({ serverStarted: false }));
    expect(r.deadlineAt).toBeNull();
    expect(r.attemptExpired).toBe(false);
  });

  it("online and server-started: deadline from the server start (unchanged)", () => {
    const r = run(state({ serverStarted: true, serverStartedAt: new Date(START).toISOString(), serverClockOffsetMs: 0 }));
    expect(r.deadlineAt).toBe(START + 600_000);
  });

  it("portable offline: deadline = local start + time limit", () => {
    const r = run(state({ serverStarted: false }), true);
    expect(r.deadlineAt).toBe(START + 600_000);
    expect(r.attemptExpired).toBe(false);
  });

  it("portable offline: expired once the limit has passed", () => {
    vi.setSystemTime(START + 601_000);
    expect(run(state({}), true).attemptExpired).toBe(true);
  });

  it("portable offline: restored session keeps its original start (reopen does not reset the clock)", () => {
    vi.setSystemTime(START + 9 * 60_000);
    const r = run(state({ startedAt: new Date(START).toISOString() }), true);
    expect(r.deadlineAt! - Date.now()).toBe(60_000);
  });

  it("portable offline: training mode and untimed quizzes have no deadline", () => {
    expect(run(state({}, "training"), true).deadlineAt).toBeNull();
    expect(run(state({}, "testing", 0), true).deadlineAt).toBeNull();
  });
});
