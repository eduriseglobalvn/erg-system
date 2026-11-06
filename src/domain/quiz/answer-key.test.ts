import { describe, expect, it } from "vitest";

import { canGradeLocally, hasAnswerKey } from "@/domain/quiz/quiz";
import type { Question } from "@/domain/quiz/types";
import { buildReviewFixture, stripAnswerKeys } from "@/test/fixtures/quiz-review-fixture";

const q = (kind: Question["kind"], extra: Partial<Question> = {}) => ({ id: "x", kind, title: "", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, ...extra }) as Question;

describe("canGradeLocally", () => {
  it("is true when every question carries its key, false once keys are stripped", () => {
    const { questions } = buildReviewFixture();
    expect(canGradeLocally(questions)).toBe(true);
    expect(canGradeLocally(stripAnswerKeys(questions))).toBe(false);
    expect(canGradeLocally([...questions.slice(1), stripAnswerKeys(questions.slice(0, 1))[0]])).toBe(false);
  });

  it("checks the key each kind is scored with", () => {
    expect(hasAnswerKey(q("sequence", { sequenceItems: [{ id: "a" }] as Question["sequenceItems"], sequenceCorrectOrder: [] }))).toBe(false);
    expect(hasAnswerKey(q("sequence", { sequenceCorrectOrder: ["a"] }))).toBe(true);
    expect(hasAnswerKey(q("matching", { matching: [{ id: "r" }] as Question["matching"], matchingResponses: [] }))).toBe(false);
    expect(hasAnswerKey(q("matching", { matching: [{ id: "r" }] as Question["matching"], matchingKey: { r: "s" } }))).toBe(true);
    expect(hasAnswerKey(q("fill_blank", { textBlanks: [{ id: "b", correctAnswers: [] }] as unknown as Question["textBlanks"] }))).toBe(false);
    expect(hasAnswerKey(q("numeric"))).toBe(false);
    expect(hasAnswerKey(q("numeric", { numericAnswer: { correctValue: 2, tolerance: 0 } }))).toBe(true);
    // A real key of 0 (client-first) is a key.
    expect(hasAnswerKey(q("numeric", { numericAnswer: { correctValue: 0, tolerance: 0 } }))).toBe(true);
    expect(hasAnswerKey(q("drag_words", { wordSlots: [{ id: "s", correctWordId: "" }] as unknown as Question["wordSlots"] }))).toBe(false);
    expect(hasAnswerKey(q("essay"))).toBe(true);
    expect(hasAnswerKey(q("likert_scale"))).toBe(true);
  });

  it("a question whose key the package stripped is never gradable, whatever its shape", () => {
    expect(hasAnswerKey(q("numeric", { numericAnswer: { correctValue: 0, tolerance: 0 }, answerKeyStripped: true }))).toBe(false);
    expect(hasAnswerKey(q("essay", { answerKeyStripped: true }))).toBe(false);
    expect(hasAnswerKey(q("likert_scale", { answerKeyStripped: true }))).toBe(false);
    expect(canGradeLocally([q("essay", { answerKeyStripped: true })])).toBe(false);
  });
});
