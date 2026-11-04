import { describe, expect, test } from "vitest";

import {
  createMatchingId,
  createNextMatchingAssignments,
  resizeMatchingTextarea,
} from "@/components/quiz/questions/matching-question/matching-helpers";

describe("createNextMatchingAssignments", () => {
  test("assigns option to row", () => {
    expect(createNextMatchingAssignments({}, "r1", "o1")).toEqual({ r1: "o1" });
  });

  test("moves an option away from another row", () => {
    expect(createNextMatchingAssignments({ r1: "o1", r2: "o2" }, "r2", "o1")).toEqual({ r2: "o1" });
  });

  test("replaces the previous option of the same row", () => {
    expect(createNextMatchingAssignments({ r1: "o1" }, "r1", "o2")).toEqual({ r1: "o2" });
  });

  test("does not mutate input", () => {
    const input = { r1: "o1" };
    createNextMatchingAssignments(input, "r2", "o1");
    expect(input).toEqual({ r1: "o1" });
  });
});

describe("createMatchingId", () => {
  test("uses prefix", () => {
    expect(createMatchingId("match")).toMatch(/^match-\d+-\d+$/);
  });
});

describe("resizeMatchingTextarea", () => {
  test("ignores null and fits height to scrollHeight", () => {
    expect(() => resizeMatchingTextarea(null)).not.toThrow();
    const el = { style: { height: "" }, scrollHeight: 42 } as unknown as HTMLTextAreaElement;
    resizeMatchingTextarea(el);
    expect(el.style.height).toBe("42px");
  });
});
