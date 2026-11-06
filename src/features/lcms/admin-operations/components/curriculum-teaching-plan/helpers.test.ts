import { describe, expect, it } from "vitest";

import { buildTopicGroups, cleanTaxonomyId, generateTopicCode } from "./helpers";

const row = (topic: string) => ({ topic, period: 1, title: "t", sessions: 1 });

describe("curriculum teaching plan helpers", () => {
  it("groups consecutive rows by topic", () => {
    expect(buildTopicGroups([row("A"), row("A"), row("B"), row("A")] as never)).toEqual([
      { topic: "A", start: 0, end: 2, count: 2 },
      { topic: "B", start: 2, end: 3, count: 1 },
      { topic: "A", start: 3, end: 4, count: 1 },
    ]);
    expect(buildTopicGroups([])).toEqual([]);
  });

  it("strips taxonomy id prefixes", () => {
    expect(cleanTaxonomyId("group-category-x")).toBe("x");
    expect(cleanTaxonomyId("topic-abc")).toBe("abc");
    expect(cleanTaxonomyId("plain")).toBe("plain");
  });

  it("slugifies Vietnamese labels with a random suffix", () => {
    expect(generateTopicCode("Chủ đề 1: Đại số")).toMatch(/^chu-de-1-dai-so-[a-z0-9]{1,4}$/);
    expect(generateTopicCode("!!!")).toMatch(/^topic-/);
  });
});
