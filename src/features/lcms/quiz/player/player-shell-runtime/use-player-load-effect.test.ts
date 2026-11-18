import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQuizPackage } from "@/domain/quiz/assessment-engine";
import { getAllQuestions } from "@/domain/quiz/quiz";
import { sampleQuiz } from "@/domain/quiz/sample-quiz";
import type { LatestSubmittedAttempt, LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import { usePlayerLoadEffect, type UsePlayerLoadEffectArgs } from "./use-player-load-effect";

const { getSession, saveSession, createSession, getLatestSubmittedAttempt } = vi.hoisted(() => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  createSession: vi.fn(),
  getLatestSubmittedAttempt: vi.fn(),
}));

vi.mock("@/features/lcms/quiz/quiz-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/quiz/quiz-runtime")>()),
  getLatestSubmittedAttempt,
  localQuizAttemptStore: { getSession, saveSession, createSession },
}));

const quizPackage = createQuizPackage(sampleQuiz);
const [first, second] = getAllQuestions(quizPackage.quiz);
const freshSession = { attemptId: "local-1", answers: {}, status: "in_progress" } as unknown as LocalQuizAttemptSession;

const submission: LatestSubmittedAttempt = {
  attemptId: "server-attempt",
  assignmentId: "assignment-1",
  quizId: quizPackage.quizId,
  status: "needs_review",
  score: 8,
  maxScore: 10,
  percent: 80,
  passed: true,
  startedAt: "2026-11-10T01:00:00Z",
  submittedAt: "2026-11-10T01:20:00Z",
  answers: { [first.id]: { choiceIds: ["x"] } },
  results: {
    [first.id]: { correct: false, partiallyRight: false, awardedPoints: 0, maxPoints: 1, needsManualGrade: false },
    [second.id]: { correct: false, partiallyRight: false, awardedPoints: 0, maxPoints: 1, needsManualGrade: true },
  },
};

function setup(overrides: Partial<UsePlayerLoadEffectArgs> = {}) {
  const setLoadState = vi.fn();
  const setStarted = vi.fn();
  const args = {
    attemptScope: { portal: "elearning", tenantId: "t" },
    paceStateUpdate: (update: () => void) => update(),
    runtimePortal: "elearning",
    portablePackage: undefined,
    resolvedQuizId: quizPackage.quizId,
    resolvedAssignmentId: "assignment-1",
    reviewAssignmentId: "assignment-1",
    startImmediately: false,
    quizPackageQuery: { isPending: false, data: quizPackage, error: null },
    setLoadState, setStarted,
    setCurrentIndex: vi.fn(), setDrafts: vi.fn(), setSubmitting: vi.fn(), setSubmitError: vi.fn(),
    setSubmitDialogMode: vi.fn(), setReviewingSubmittedAttempt: vi.fn(), setTimeUp: vi.fn(),
    ...overrides,
  } as unknown as UsePlayerLoadEffectArgs;
  renderHook(() => usePlayerLoadEffect(args));
  return { setLoadState, setStarted };
}

const readyState = (setLoadState: ReturnType<typeof vi.fn>) =>
  setLoadState.mock.calls.map(([state]) => state).find((state) => state.status === "ready");

describe("player load without a usable local session", () => {
  beforeEach(() => {
    for (const mock of [getSession, saveSession, createSession, getLatestSubmittedAttempt]) mock.mockReset();
    getSession.mockResolvedValue(null);
    createSession.mockResolvedValue(freshSession);
  });

  it("shows the server's submitted attempt, with its results, and writes nothing to IndexedDB", async () => {
    getLatestSubmittedAttempt.mockResolvedValue(submission);
    const { setLoadState, setStarted } = setup();
    await waitFor(() => expect(readyState(setLoadState)).toBeTruthy());

    const state = readyState(setLoadState);
    expect(state.session).toMatchObject({ attemptId: "server-attempt", status: "submitted", reviewOnly: true, submittedAt: submission.submittedAt });
    expect(state.attempt).toMatchObject({ id: "server-attempt", totalScore: 8, maxScore: 10, percent: 80, passed: true });
    expect(state.attempt.submittedCount).toBe(state.attempt.totalQuestions);
    expect(state.attempt.answers[first.id].result).toMatchObject({ correct: false, awardedPoints: 0 });
    expect(state.attempt.answers[second.id].result).toMatchObject({ pendingReview: true });
    expect(setStarted).toHaveBeenLastCalledWith(true);
    expect(getLatestSubmittedAttempt).toHaveBeenCalledWith("assignment-1", "elearning");
    expect(createSession).not.toHaveBeenCalled();
    expect(saveSession).not.toHaveBeenCalled();
  });

  it("falls back to the start screen when the server has no hand-in", async () => {
    getLatestSubmittedAttempt.mockResolvedValue(null);
    const { setLoadState, setStarted } = setup();
    await waitFor(() => expect(readyState(setLoadState)).toBeTruthy());

    expect(readyState(setLoadState).session).toBe(freshSession);
    expect(setStarted).toHaveBeenLastCalledWith(false);
  });

  it("falls back to the start screen when the lookup fails", async () => {
    getLatestSubmittedAttempt.mockRejectedValue(new Error("offline"));
    const { setLoadState } = setup();
    await waitFor(() => expect(readyState(setLoadState)).toBeTruthy());

    expect(readyState(setLoadState).session).toBe(freshSession);
  });

  it("plays a portable package although the disabled server query stays pending", async () => {
    const { setLoadState } = setup({ portablePackage: quizPackage, quizPackageQuery: { isPending: true, data: undefined, error: null } as never, reviewAssignmentId: undefined });
    await waitFor(() => expect(readyState(setLoadState)).toBeTruthy());
  });

  it("does not ask the server in portable or preview mode", async () => {
    const { setLoadState } = setup({ reviewAssignmentId: undefined });
    await waitFor(() => expect(readyState(setLoadState)).toBeTruthy());

    expect(getLatestSubmittedAttempt).not.toHaveBeenCalled();
  });
});

describe("player load with a matching local session", () => {
  it("keeps the local session and does not call the server", async () => {
    getLatestSubmittedAttempt.mockReset();
    getSession.mockResolvedValue({
      attemptId: "local-2", answers: {}, status: "in_progress", packageHash: quizPackage.contentHash, quizVersion: quizPackage.quizVersion,
    });
    const { setLoadState } = setup();
    await waitFor(() => expect(readyState(setLoadState)).toBeTruthy());

    expect(readyState(setLoadState).session.attemptId).toBe("local-2");
    expect(getLatestSubmittedAttempt).not.toHaveBeenCalled();
  });
});
