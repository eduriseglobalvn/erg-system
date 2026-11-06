import { describe, expect, it } from "vitest";

import { moveChoice } from "./move-choice";

const items = ["a", "b", "c", "d"].map((id) => ({ id }));
const ids = (list: { id: string }[]) => list.map((c) => c.id).join("");

describe("moveChoice", () => {
  it("moves down and up", () => {
    expect(ids(moveChoice(items, "a", "c"))).toBe("bcad");
    expect(ids(moveChoice(items, "d", "b"))).toBe("adbc");
  });
  it("ignores unknown or identical ids", () => {
    expect(moveChoice(items, "a", "a")).toBe(items);
    expect(moveChoice(items, "a", "zz")).toBe(items);
  });
});
