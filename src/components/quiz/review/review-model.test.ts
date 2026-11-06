import { describe, expect, it } from "vitest";

import { attemptElapsedSeconds, buildReviewCells, retryIndices, reviewScoreLabel, reviewScoreOutOf10, toQuestionResults } from "@/components/quiz/review/review-model";
import { buildReviewFixture, REVIEW_SKIPPED, REVIEW_WRONG } from "@/test/fixtures/quiz-review-fixture";

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

  it("measures time spent from start to submit", () => {
    expect(attemptElapsedSeconds("2026-11-06T08:00:00Z", "2026-11-06T08:42:15Z")).toBe(2535);
    expect(attemptElapsedSeconds("2026-11-06T08:00:00Z", undefined)).toBeNull();
  });

  it("scales the score to 10", () => {
    expect(reviewScoreOutOf10(attempt)).toBe("8,67");
    expect(reviewScoreOutOf10({ totalScore: 0, maxScore: 0 })).toBe("0");
  });
});
