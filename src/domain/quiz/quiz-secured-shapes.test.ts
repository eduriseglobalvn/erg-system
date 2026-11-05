import { describe, expect, it } from "vitest";

import { createInitialAnswer, isAnswerComplete, normalizeAnswerForSubmission, scoreQuestion } from "@/domain/quiz/quiz";
import type { Question } from "@/domain/quiz/types";

const feedback = { correct: "OK", incorrect: "NO", partial: "PART" };
const base = { title: "", points: 10, feedback };

const oldMatching: Question = {
  ...base, id: "m-old", kind: "matching",
  matching: [{ id: "m1", prompt: "Cat", response: "Meow" }, { id: "m2", prompt: "Dog", response: "Woof" }],
};
const newMatching: Question = {
  ...base, id: "m-new", kind: "matching",
  matching: [{ id: "m1", prompt: "Cat" }, { id: "m2", prompt: "Dog" }],
  matchingResponses: [{ id: "r-9f", response: "Woof" }, { id: "r-1c", response: "Meow" }],
};
const keyed: Question = { ...newMatching, matchingKey: { m1: "r-1c", m2: "r-9f" } };

describe("matching scoring", () => {
  it("old shape: id equality still scores", () => {
    expect(scoreQuestion(oldMatching, { matchingOrder: ["m1", "m2"] }).correct).toBe(true);
    expect(scoreQuestion(oldMatching, { matchingAssignments: { m1: "m1", m2: "m2" } }).awardedPoints).toBe(10);
    expect(scoreQuestion(oldMatching, { matchingOrder: ["m2", "m1"] }).awardedPoints).toBe(0);
  });

  it("new shape with key: scores via promptId -> responseId", () => {
    expect(scoreQuestion(keyed, { matchingAssignments: { m1: "r-1c", m2: "r-9f" } }).correct).toBe(true);
    expect(scoreQuestion(keyed, { matchingOrder: ["r-1c", "r-9f"] }).correct).toBe(true);
    expect(scoreQuestion(keyed, { matchingAssignments: { m1: "r-1c", m2: "r-1c" } })).toMatchObject({ partiallyRight: true, awardedPoints: 5 });
    expect(scoreQuestion(keyed, { matchingOrder: ["r-9f", "r-1c"] }).awardedPoints).toBe(0);
  });

  it("new shape without key: no local correctness", () => {
    const result = scoreQuestion(newMatching, { matchingAssignments: { m1: "r-1c", m2: "r-9f" } });
    expect(result.correct).toBe(false);
    expect(result.awardedPoints).toBe(0);
    expect(scoreQuestion(newMatching, {}).awardedPoints).toBe(0);
  });

  it("initial answer for new shape is the received response order, not a pre-solved layout", () => {
    expect(createInitialAnswer(newMatching).matchingOrder).toEqual(["r-9f", "r-1c"]);
    expect(createInitialAnswer(oldMatching).matchingOrder).toEqual(["m2", "m1"]);
  });

  it("initial answer starts shuffled away from the answer, with nothing connected", () => {
    expect(createInitialAnswer(oldMatching)).toEqual({ matchingOrder: ["m2", "m1"], matchingConnectedRows: [] });
    const keyOrder = ["r-1c", "r-9f"];
    const keyedFirst = { ...keyed, matchingResponses: [{ id: "r-1c", response: "Meow" }, { id: "r-9f", response: "Woof" }] };
    expect(createInitialAnswer(keyedFirst).matchingOrder).not.toEqual(keyOrder);
    expect(createInitialAnswer(keyedFirst).matchingConnectedRows).toEqual([]);
  });
});

describe("matching with connected rows (only connected pairs count)", () => {
  const halfConnected = { matchingOrder: ["m1", "m2"], matchingConnectedRows: ["m1"] };

  it("scores only the connected rows", () => {
    expect(scoreQuestion(oldMatching, halfConnected).awardedPoints).toBe(5);
    expect(scoreQuestion(oldMatching, { ...halfConnected, matchingConnectedRows: ["m1", "m2"] }).correct).toBe(true);
    expect(scoreQuestion(oldMatching, { ...halfConnected, matchingConnectedRows: [] }).awardedPoints).toBe(0);
  });

  it("nothing connected is not an answer", () => {
    expect(isAnswerComplete(oldMatching, { ...halfConnected, matchingConnectedRows: [] })).toBe(false);
    expect(isAnswerComplete(oldMatching, halfConnected)).toBe(true);
  });

  it("submits assignments for connected rows only", () => {
    const submitted = normalizeAnswerForSubmission(oldMatching, halfConnected);
    expect(submitted.matchingAssignments).toEqual({ m1: "m1" });
    expect(submitted.matchingOrder).toEqual(["m1", "m2"]);
  });
});

describe("matching submission payload", () => {
  it("adds matchingAssignments {promptId: responseId} and keeps matchingOrder", () => {
    expect(normalizeAnswerForSubmission(newMatching, { matchingOrder: ["r-1c", "r-9f"] })).toMatchObject({
      matchingAssignments: { m1: "r-1c", m2: "r-9f" },
      matchingOrder: ["r-1c", "r-9f"],
    });
  });

  it("assignments-only answers gain matchingOrder", () => {
    expect(normalizeAnswerForSubmission(newMatching, { matchingAssignments: { m1: "r-1c", m2: "r-9f" } })).toMatchObject({
      matchingOrder: ["r-1c", "r-9f"],
    });
  });

  it("old shape also submits assignments", () => {
    expect(normalizeAnswerForSubmission(oldMatching, { matchingOrder: ["m1", "m2"] }).matchingAssignments).toEqual({ m1: "m1", m2: "m2" });
  });
});

describe("sequence scoring with shuffled items", () => {
  const items = [{ id: "s2", label: "B" }, { id: "s3", label: "C" }, { id: "s1", label: "A" }];
  const shuffled: Question = { ...base, id: "q", kind: "sequence", sequenceItems: items, sequenceCorrectOrder: ["s1", "s2", "s3"] };

  it("scores against the key, not the received order", () => {
    expect(scoreQuestion(shuffled, { sequenceOrder: ["s1", "s2", "s3"] }).correct).toBe(true);
    expect(scoreQuestion(shuffled, { sequenceOrder: ["s2", "s3", "s1"] }).correct).toBe(false);
  });

  it("unknown key (server-graded): never correct", () => {
    const unknown = { ...shuffled, sequenceCorrectOrder: [] };
    expect(scoreQuestion(unknown, { sequenceOrder: ["s2", "s3", "s1"] })).toMatchObject({ correct: false, awardedPoints: 0 });
  });

  it("old shape (no key field): item order is the answer", () => {
    const old = { ...shuffled, sequenceCorrectOrder: undefined };
    expect(scoreQuestion(old, { sequenceOrder: ["s2", "s3", "s1"] }).correct).toBe(true);
  });
});

describe("sequence initial answer", () => {
  const items = [{ id: "s1", label: "A" }, { id: "s2", label: "B" }, { id: "s3", label: "C" }];
  const plain: Question = { ...base, id: "seq-plain", kind: "sequence", sequenceItems: items };

  it("no key field: a stable shuffle that is never the item order", () => {
    const first = createInitialAnswer(plain).sequenceOrder;
    expect(createInitialAnswer(plain).sequenceOrder).toEqual(first);
    expect(first).not.toEqual(["s1", "s2", "s3"]);
    expect([...(first ?? [])].sort()).toEqual(["s1", "s2", "s3"]);
  });

  it("unknown key (secured body): keeps the received order", () => {
    expect(createInitialAnswer({ ...plain, sequenceCorrectOrder: [] }).sequenceOrder).toEqual(["s1", "s2", "s3"]);
  });
});
