import { describe, expect, it } from "vitest";

import { attemptElapsedSeconds, buildReviewCells, retryIndices, reviewScoreLabel, reviewScoreOutOf10, toQuestionResults } from "@/components/quiz/review/review-model";
import { scoreQuestion } from "@/domain/quiz/quiz";
import type { Question } from "@/domain/quiz/types";
import { buildReviewFixture, reviewQuestion, REVIEW_SKIPPED, REVIEW_WRONG } from "@/test/fixtures/quiz-review-fixture";

const { questions, attempt } = buildReviewFixture();
const results = toQuestionResults(questions, attempt);

describe("review model", () => {
  it("retries wrong + skipped questions in ascending order", () => {
    const indices = retryIndices(results);
    expect(indices).toHaveLength(12);
    expect(indices).toEqual([...REVIEW_WRONG, ...REVIEW_SKIPPED].sort((a, b) => a - b).map((n) => n - 1));
  });

  it("builds review cells from results", () => {
    const cells = buildReviewCells(results, new Set([2]), 0);
    expect(cells).toHaveLength(90);
    expect(cells[36].state).toBe("wrong");
    expect(cells[53].state).toBe("skipped");
    expect(cells[0]).toMatchObject({ state: "correct", current: true });
    expect(cells[2].flagged).toBe(true);
  });

  it("keeps the result state on the current cell", () => {
    expect(buildReviewCells(results, new Set(), 36)[36]).toMatchObject({ state: "wrong", current: true });
  });

  it("labels points with a decimal comma", () => {
    expect(reviewScoreLabel({ correct: true, points: 0.5 })).toBe("Đúng · 0,5 điểm");
    expect(reviewScoreLabel({ correct: false, points: 0 })).toBe("Sai · 0 điểm");
    expect(reviewScoreLabel({ correct: false, points: 0, skipped: true })).toBe("Bỏ trống · 0 điểm");
    expect(reviewScoreLabel({ correct: false, points: 0, pending: true })).toBe("Chờ giáo viên chấm");
  });

  it("pending essays are neither wrong nor retried", () => {
    const cells = buildReviewCells([{ correct: false, points: 0, pending: true }], new Set(), -1);
    expect(cells[0].state).toBe("done");
    expect(retryIndices([{ correct: false, points: 0, pending: true }])).toEqual([]);
  });

  it("partial credit is not wrong, not skipped, and is retried", () => {
    const partial = { correct: false, points: 0, partial: true };
    expect(reviewScoreLabel(partial)).toBe("Đúng một phần · 0 điểm");
    expect(retryIndices([{ correct: true, points: 0.5 }, partial, { correct: false, points: 0 }])).toEqual([1, 2]);
    expect(buildReviewCells([partial], new Set(), -1)[0].state).toBe("wrong");
  });

  it("partiallyRight with floored 0 points (0,5-point question) is partial, not wrong or skipped", () => {
    const question = reviewQuestion(1);
    const record = { questionId: "q1", input: { choiceId: "q1b" }, result: { questionId: "q1", correct: false, partiallyRight: true, awardedPoints: 0, maxPoints: 0.5, message: "" } };
    expect(toQuestionResults([question], { answers: { q1: record } })[0]).toMatchObject({ skipped: false, partial: true, points: 0 });
    const blank = { ...record, input: {}, result: { ...record.result, partiallyRight: false } };
    expect(toQuestionResults([question], { answers: { q1: blank } })[0]).toMatchObject({ skipped: true, partial: false });
  });

  it("a half-filled fill_blank graded by scoreQuestion is partial, not skipped", () => {
    const question = {
      id: "fb", kind: "fill_blank", title: "", points: 1, feedback: { correct: "", incorrect: "", partial: "" },
      textBlanks: [{ id: "b1", label: "", correctAnswers: ["a"] }, { id: "b2", label: "", correctAnswers: ["b"] }],
    } as Question;
    const input = { textResponses: { b1: "a" } };
    const result = scoreQuestion(question, input);
    expect(result).toMatchObject({ partiallyRight: true, awardedPoints: 0 });
    const [r] = toQuestionResults([question], { answers: { fb: { questionId: "fb", input, result } } });
    expect(r).toMatchObject({ correct: false, skipped: false, partial: true, points: 0 });
    expect(reviewScoreLabel(r)).toBe("Đúng một phần · 0 điểm");
    expect(retryIndices([r])).toEqual([0]);
  });

  it("measures time spent from start to submit", () => {
    expect(attemptElapsedSeconds("2026-11-06T08:00:00Z", "2026-11-06T08:42:15Z")).toBe(2535);
    expect(attemptElapsedSeconds("2026-11-06T08:00:00Z", undefined)).toBeNull();
  });

  it("scales the score to 10", () => {
    expect(reviewScoreOutOf10(attempt)).toBe("8,67");
    expect(reviewScoreOutOf10({ totalScore: 0, maxScore: 0 })).toBe("0");
  });
});
