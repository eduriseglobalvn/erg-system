import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { readPairs, savePairs, swapRight, writePairs } from "./matching-pairs";

const img = (url: string) => ({ url, alt: "" });
const q = (extra: Partial<Question>): Question =>
  ({ id: "q", kind: "matching", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, ...extra }) as Question;

const newShape = q({
  matching: [{ id: "p1", prompt: "A" }, { id: "p2", prompt: "B" }],
  matchingResponses: [{ id: "r1", response: "one", responseImage: img("1") }, { id: "r2", response: "two" }],
});

describe("readPairs", () => {
  it("returns the old shape as is", () => {
    const matching = [{ id: "p1", prompt: "A", response: "a" }];
    expect(readPairs(q({ matching }))).toBe(matching);
  });

  it("aligns a keyed new shape by its key", () => {
    const pairs = readPairs({ ...newShape, matchingKey: { p1: "r2", p2: "r1" } });
    expect(pairs.map((p) => [p.prompt, p.response, p.responseImage?.url])).toEqual([["A", "two", undefined], ["B", "one", "1"]]);
  });

  it("uses the pair's own response, then the index, when the key has no entry for it", () => {
    const pairs = readPairs({ ...newShape, matching: [{ id: "p1", prompt: "A", response: "own" }, { id: "p2", prompt: "B" }], matchingKey: { p3: "r1" } });
    expect(pairs.map((p) => p.response)).toEqual(["own", "two"]);
  });

  it("aligns a keyless new shape by index", () => {
    expect(readPairs(newShape).map((p) => p.response)).toEqual(["one", "two"]);
  });
});

describe("writePairs", () => {
  it("writes the old shape and drops the new-shape fields", () => {
    const next = writePairs({ ...newShape, matchingKey: { p1: "r1" } }, [{ id: "p1", prompt: "A", response: "a" }]);
    expect(next.matching).toEqual([{ id: "p1", prompt: "A", response: "a" }]);
    expect(next.matchingResponses).toBeUndefined();
    expect(next.matchingKey).toBeUndefined();
  });
});

describe("savePairs", () => {
  it("keeps a keyless question unconfirmed: responses rebuilt in row order, ids kept by index, no key", () => {
    const pairs = [...readPairs(newShape), { id: "p3", prompt: "C", response: "three" }];
    const next = savePairs(newShape, pairs);
    expect(next.matching).toEqual([{ id: "p1", prompt: "A" }, { id: "p2", prompt: "B" }, { id: "p3", prompt: "C" }]);
    expect(next.matchingResponses!.map((r) => [r.id, r.response, r.responseImage?.url])).toEqual([["r1", "one", "1"], ["r2", "two", undefined], ["p3-r", "three", undefined]]);
    expect(next.matchingKey).toBeUndefined();
    expect(readPairs(next)).toEqual(pairs.map((p) => ({ ...p, responseIcon: undefined, responseImage: p.responseImage })));
  });

  it("writes keyed and old-shape questions in the old shape", () => {
    const keyed = { ...newShape, matchingKey: { p1: "r2", p2: "r1" } };
    expect(savePairs(keyed, readPairs(keyed))).toMatchObject({ matching: [{ id: "p1", response: "two" }, { id: "p2", response: "one" }], matchingResponses: undefined, matchingKey: undefined });
  });
});

describe("swapRight", () => {
  it("swaps the right side and keeps prompts and ids", () => {
    const pairs = [
      { id: "p1", prompt: "A", promptImage: img("a"), response: "one", responseIcon: "i1", responseImage: img("1") },
      { id: "p2", prompt: "B", response: "two" },
    ];
    expect(swapRight(pairs, 0, 1)).toEqual([
      { id: "p1", prompt: "A", promptImage: img("a"), response: "two", responseIcon: undefined, responseImage: undefined },
      { id: "p2", prompt: "B", response: "one", responseIcon: "i1", responseImage: img("1") },
    ]);
  });
});
