import { describe, expect, it } from "vitest";

import { createQuizPackage } from "@/domain/quiz/assessment-engine";
import type { Question, Quiz } from "@/domain/quiz/types";
import {
  buildClientSubmitPayload,
  countAnsweredQuestions,
  gradeFinalAttemptLocally,
  isServerAttemptSnapshot,
  normalizeSubmitResponse,
} from "./quiz-runtime-submit-model";

const feedback = { correct: "", incorrect: "", partial: "" };
const questions: Question[] = [
  { id: "a", kind: "single_choice", title: "A", points: 4, feedback, choices: [{ id: "1", label: "", correct: true }, { id: "2", label: "", correct: false }] },
  { id: "b", kind: "numeric", title: "B", points: 6, feedback, numericAnswer: { correctValue: 2 } },
];
const quiz = { id: "q", title: "Q", version: "1", settings: { passPercent: 50 }, sections: [{ id: "s", title: "S", questions }] } as unknown as Quiz;
const quizPackage = createQuizPackage(quiz);
const answers = { a: { choiceId: "1" }, b: { numericValue: "9" } };
const input = () => ({
  attemptId: "att",
  idempotencyKey: "k",
  portal: "elearning" as const,
  quiz,
  quizPackage,
  payload: { answers } as never,
});

describe("buildClientSubmitPayload", () => {
  it("grades locally and reports duration", () => {
    const payload = buildClientSubmitPayload({
      answers, attemptId: "att", clientEvents: [], quizPackage,
      startedAt: "2026-01-01T00:00:00.000Z", submittedAt: "2026-01-01T00:10:00.000Z",
    });
    expect(payload.clientResult).toEqual({ score: 4, maxScore: 10, percent: 40 });
    expect(payload.durationMs).toBe(600_000);
    expect(payload.packageHash).toBe(quizPackage.contentHash);
  });

  it("clamps a negative duration (clock rolled back) to zero", () => {
    const payload = buildClientSubmitPayload({
      answers: {}, attemptId: "att", clientEvents: [], quizPackage,
      startedAt: "2026-01-01T01:00:00.000Z", submittedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(payload.durationMs).toBe(0);
    expect(payload.clientResult.score).toBe(0);
  });
});

describe("gradeFinalAttemptLocally", () => {
  it("counts empty answers as zero but still submitted", () => {
    const attempt = gradeFinalAttemptLocally(quizPackage, "att", {});
    expect(attempt).toMatchObject({ totalScore: 0, submittedCount: 2, passed: false });
  });
});

describe("normalizeSubmitResponse", () => {
  const attempt = gradeFinalAttemptLocally(quizPackage, "att", answers);

  it.each([
    ["plain attempt", attempt],
    ["wrapped in attempt", { attempt }],
    ["wrapped in result", { result: attempt }],
  ])("accepts %s", (_n, response) => {
    expect(normalizeSubmitResponse(response as never, input()).totalScore).toBe(4);
  });

  it("builds an attempt from a server aggregate", () => {
    const result = normalizeSubmitResponse({ score: 7, maxScore: 10, percent: 70, passed: true }, input());
    expect(result).toMatchObject({ id: "att", quizId: "q", totalScore: 7, percent: 70, passed: true, submittedCount: 2, totalQuestions: 2 });
  });

  it("throws on an unusable response", () => {
    expect(() => normalizeSubmitResponse({} as never, input())).toThrow(/missing a valid attempt/);
  });
});

describe("helpers", () => {
  it("detects server snapshots", () => {
    expect(isServerAttemptSnapshot({ id: "x" })).toBe(true);
    expect(isServerAttemptSnapshot({ id: 1 })).toBe(false);
    expect(isServerAttemptSnapshot(null)).toBe(false);
  });

  it("counts answered questions", () => {
    expect(countAnsweredQuestions(quiz, { a: {} })).toBe(1);
    expect(countAnsweredQuestions(quiz, {})).toBe(0);
  });
});
