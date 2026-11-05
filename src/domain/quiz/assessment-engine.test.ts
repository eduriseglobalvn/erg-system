import { describe, expect, it } from "vitest";

import {
  buildAttemptSyncPayload,
  createAttemptSession,
  createQuizPackage,
  gradeAnswerLocally,
  gradeAttemptLocally,
} from "@/domain/quiz/assessment-engine";
import { scoreQuestion } from "@/domain/quiz/quiz";
import type { AnswerPayload, Question, Quiz } from "@/domain/quiz/types";

const feedback = { correct: "OK", incorrect: "NO", partial: "PART" };
const q = (kind: Question["kind"], extra: Partial<Question>): Question => ({
  id: `q-${kind}`, kind, title: kind, points: 10, feedback, ...extra,
});
const choices = (...correct: boolean[]) => correct.map((c, i) => ({ id: `c${i + 1}`, label: `C${i + 1}`, correct: c }));

type Row = [name: string, question: Question, answer: AnswerPayload, awarded: number, state: "correct" | "partial" | "wrong"];

const single = q("single_choice", { choices: choices(false, true, false) });
const tf = q("true_false", { choices: [{ id: "t", label: "T", correct: true }, { id: "f", label: "F", correct: false }] });
const multi = q("multiple_response", { choices: choices(true, true, false, false) });
const matching = q("matching", { matching: [1, 2, 3, 4].map((n) => ({ id: `m${n}`, prompt: `p${n}`, response: `r${n}` })) });
const sequence = q("sequence", { sequenceItems: [1, 2, 3, 4].map((n) => ({ id: `s${n}`, label: `S${n}` })) });
const inline = q("inline_choice", { inlineBlanks: [1, 2].map((n) => ({ id: `b${n}`, statement: "", options: ["x", "y"], correctOptionId: "x" })) });
const text = q("fill_blank", { textBlanks: [{ id: "t1", label: "", correctAnswers: ["Hà Nội", "Ha Noi"] }, { id: "t2", label: "", correctAnswers: ["Huế"] }] });
const numeric = q("numeric", { numericAnswer: { correctValue: 3.5, tolerance: 0.1 } });
const numericZero = q("numeric", { numericAnswer: { correctValue: 0 } });
// Data from the server may hold null for a missing value.
const numericNull = q("numeric", { numericAnswer: { correctValue: null as unknown as number } });
const words = q("drag_words", { wordSlots: [{ id: "w1", label: "", correctWordId: "a" }, { id: "w2", label: "", correctWordId: "b" }] });
const dnd = q("drag_drop", { dragDropItems: [{ id: "d1", label: "", correctTargetId: "t1" }, { id: "d2", label: "", correctTargetId: "t2" }] });
const likert = q("likert_scale", { likertRows: [{ id: "r1", label: "" }, { id: "r2", label: "" }] });
const essay = q("essay", {});
const rect = q("hotspot", { hotspotAreas: [{ id: "h", shape: "rect", x: 10, y: 10, width: 20, height: 20, correct: true }] });
const ellipse = q("hotspot", { hotspotAreas: [{ id: "h", shape: "ellipse", x: 0, y: 0, width: 20, height: 10, correct: true }] });

const rows: Row[] = [
  ["single correct", single, { choiceId: "c2" }, 10, "correct"],
  ["single wrong", single, { choiceId: "c1" }, 0, "wrong"],
  ["single empty", single, {}, 0, "wrong"],
  ["true/false correct", tf, { choiceId: "t" }, 10, "correct"],
  ["true/false wrong", tf, { choiceId: "f" }, 0, "wrong"],
  ["multi exact (order independent)", multi, { choiceIds: ["c2", "c1"] }, 10, "correct"],
  ["multi one of two right", multi, { choiceIds: ["c1"] }, 5, "partial"],
  ["multi right plus wrong cancels", multi, { choiceIds: ["c1", "c3"] }, 0, "wrong"],
  ["multi all right plus one wrong", multi, { choiceIds: ["c1", "c2", "c3"] }, 5, "partial"],
  ["multi tick everything", multi, { choiceIds: ["c1", "c2", "c3", "c4"] }, 0, "wrong"],
  ["multi only wrong", multi, { choiceIds: ["c3"] }, 0, "wrong"],
  ["multi duplicate ids ignored", multi, { choiceIds: ["c1", "c1"] }, 5, "partial"],
  ["multi empty", multi, { choiceIds: [] }, 0, "wrong"],
  ["matching exact via order", matching, { matchingOrder: ["m1", "m2", "m3", "m4"] }, 10, "correct"],
  ["matching exact via assignments", matching, { matchingAssignments: { m1: "m1", m2: "m2", m3: "m3", m4: "m4" } }, 10, "correct"],
  ["matching 2 of 4", matching, { matchingOrder: ["m1", "m2", "m4", "m3"] }, 5, "partial"],
  ["matching none", matching, { matchingOrder: ["m2", "m1", "m4", "m3"] }, 0, "wrong"],
  ["matching empty", matching, {}, 0, "wrong"],
  ["sequence exact", sequence, { sequenceOrder: ["s1", "s2", "s3", "s4"] }, 10, "correct"],
  ["sequence 1 of 4 floor", sequence, { sequenceOrder: ["s1", "s3", "s4", "s2"] }, 2, "partial"],
  ["sequence empty", sequence, {}, 0, "wrong"],
  ["inline all", inline, { inlineSelections: { b1: "x", b2: "x" } }, 10, "correct"],
  ["inline one", inline, { inlineSelections: { b1: "x", b2: "y" } }, 5, "partial"],
  ["inline empty", inline, {}, 0, "wrong"],
  ["text all, accent/case/space insensitive", text, { textResponses: { t1: "  ha NOI ", t2: "hue" } }, 10, "correct"],
  ["text one blank", text, { textResponses: { t1: "Hà Nội", t2: "Đà Nẵng" } }, 5, "partial"],
  ["text empty", text, {}, 0, "wrong"],
  ["numeric exact", numeric, { numericValue: "3.5" }, 10, "correct"],
  ["numeric within tolerance", numeric, { numericValue: "3.6" }, 10, "correct"],
  ["numeric vietnamese decimal comma", numeric, { numericValue: "3,5" }, 10, "correct"],
  ["numeric outside tolerance", numeric, { numericValue: "3.7" }, 0, "wrong"],
  ["numeric not a number", numeric, { numericValue: "abc" }, 0, "wrong"],
  ["numeric empty string", numeric, { numericValue: "" }, 0, "wrong"],
  ["numeric zero expected, empty answer", numericZero, { numericValue: "" }, 0, "wrong"],
  ["numeric zero expected, whitespace", numericZero, { numericValue: "  " }, 0, "wrong"],
  ["numeric zero expected, 0", numericZero, { numericValue: "0" }, 10, "correct"],
  ["numeric null expected, 0", numericNull, { numericValue: "0" }, 0, "wrong"],
  ["drag words all", words, { dragWordPlacements: { w1: "a", w2: "b" } }, 10, "correct"],
  ["drag words one", words, { dragWordPlacements: { w1: "a", w2: "a" } }, 5, "partial"],
  ["drag words empty", words, {}, 0, "wrong"],
  ["drag drop all", dnd, { dragDropPlacements: { d1: "t1", d2: "t2" } }, 10, "correct"],
  ["drag drop swapped", dnd, { dragDropPlacements: { d1: "t2", d2: "t1" } }, 0, "wrong"],
  ["likert all rows", likert, { likertResponses: { r1: "1", r2: "3" } }, 10, "correct"],
  ["likert missing row", likert, { likertResponses: { r1: "1" } }, 0, "wrong"],
  ["essay blank", essay, { essayText: "   " }, 0, "wrong"],
  ["hotspot inside rect", rect, { hotspotPoint: { x: 20, y: 20 } }, 10, "correct"],
  ["hotspot rect edge", rect, { hotspotPoint: { x: 30, y: 30 } }, 10, "correct"],
  ["hotspot outside rect", rect, { hotspotPoint: { x: 31, y: 20 } }, 0, "wrong"],
  ["hotspot no point", rect, {}, 0, "wrong"],
  ["hotspot ellipse centre", ellipse, { hotspotPoint: { x: 10, y: 5 } }, 10, "correct"],
  ["hotspot ellipse bbox corner", ellipse, { hotspotPoint: { x: 0.5, y: 0.5 } }, 0, "wrong"],
];

describe("scoreQuestion (table)", () => {
  it.each(rows)("%s", (_name, question, answer, awarded, state) => {
    const result = scoreQuestion(question, answer);
    expect(result.awardedPoints).toBe(awarded);
    expect(result.correct).toBe(state === "correct");
    expect(result.partiallyRight).toBe(state === "partial");
    expect(result.maxPoints).toBe(10);
    expect(result.message).toBe(state === "correct" ? "OK" : state === "partial" ? "PART" : "NO");
  });

  it("never auto-awards essay points; marks the answer for teacher review", () => {
    const result = scoreQuestion(essay, { essayText: "bài" });
    expect(result).toMatchObject({ awardedPoints: 0, correct: false, pendingReview: true });
    expect(scoreQuestion(essay, { essayText: "  " }).pendingReview).toBeUndefined();
  });

  it("returns the answer key on the result for review screens", () => {
    expect(scoreQuestion(single, {}).correctChoiceIds).toEqual(["c2"]);
    expect(scoreQuestion(numeric, {}).correctNumericValue).toBe("3.5");
    expect(scoreQuestion(numericNull, {}).correctNumericValue).toBeUndefined();
  });

  it("scores degenerate questions without correct answers as not correct", () => {
    expect(scoreQuestion(q("single_choice", {}), { choiceId: "x" }).correct).toBe(false);
    expect(scoreQuestion(q("fill_blank", { textBlanks: [] }), {}).correct).toBe(false);
    expect(scoreQuestion(q("inline_choice", { inlineBlanks: [] }), {}).correct).toBe(false);
    expect(scoreQuestion(q("drag_words", { wordSlots: [] }), {}).correct).toBe(false);
  });
});

const quiz = {
  id: "quiz-1",
  title: "T",
  version: "1",
  settings: { passPercent: 50 },
  sections: [{ id: "s", title: "S", questions: [single, multi] }],
} as unknown as Quiz;

describe("assessment engine session flow", () => {
  const pkg = createQuizPackage(quiz, { generatedAt: "2026-01-01T00:00:00.000Z" });

  it("builds a stable content-addressed package id", () => {
    expect(createQuizPackage(quiz).contentHash).toBe(pkg.contentHash);
    expect(pkg.id).toContain(pkg.contentHash.slice(-10));
    expect(pkg.gradingMode).toBe("client-first");
  });

  it("starts with zero score and a started event", () => {
    const session = createAttemptSession(pkg, "att-1");
    expect(session.attempt).toMatchObject({ id: "att-1", totalQuestions: 2, maxScore: 20, totalScore: 0, passed: false });
    expect(session.events.map((e) => e.type)).toEqual(["attempt_started"]);
  });

  it("grades a whole attempt, treating missing answers as empty", () => {
    const graded = gradeAttemptLocally(createAttemptSession(pkg, "att-1"), { [single.id]: { choiceId: "c2" } });
    expect(graded.attempt).toMatchObject({ totalScore: 10, percent: 50, passed: true, submittedCount: 2 });
    expect(graded.attempt.answers[multi.id].result.awardedPoints).toBe(0);
    expect(graded.submittedAt).toBeTruthy();
    expect(graded.events.at(-1)?.type).toBe("attempt_submitted");
  });

  it("fails below the pass percent and floors the percentage", () => {
    const graded = gradeAttemptLocally(createAttemptSession(pkg, "a"), { [multi.id]: { choiceIds: ["c1"] } });
    expect(graded.attempt).toMatchObject({ totalScore: 5, percent: 25, passed: false });
  });

  it("rejects unknown questions and re-grading overwrites the earlier answer", () => {
    const session = createAttemptSession(pkg, "a");
    expect(() => gradeAnswerLocally(session, "nope", {})).toThrow("Question not found");
    const first = gradeAnswerLocally(session, single.id, { choiceId: "c1" }).session;
    const second = gradeAnswerLocally(first, single.id, { choiceId: "c2" }).session;
    expect(second.attempt.totalScore).toBe(10);
    expect(second.attempt.submittedCount).toBe(1);
  });

  it("builds a sync payload from the session", () => {
    const payload = buildAttemptSyncPayload(createAttemptSession(pkg, "att-1"));
    expect(payload).toMatchObject({ attemptId: "att-1", packageId: pkg.id, packageHash: pkg.contentHash, client: { runtime: "web" } });
  });
});
