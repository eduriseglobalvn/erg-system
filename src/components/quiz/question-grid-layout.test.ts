import { describe, expect, it } from "vitest";

import { questionGridLayout } from "@/components/quiz/question-grid-layout";

describe("questionGridLayout", () => {
  it.each([
    [20, "web", { columns: 5, cell: 40, scroll: false, showGoTo: false }],
    [20, "phone", { columns: 5, cell: 48 }],
    [21, "web", { columns: 10, cell: 30, gap: 6, fontSize: "caption", showGoTo: true }],
    [90, "phone", { columns: 8, cell: 38, scroll: true, showGoTo: true }],
    [150, "web", { columns: 10, scroll: true, showGoTo: true }],
    [5, "web", { columns: 5 }],
  ] as const)("(%i, %s)", (total, surface, expected) => {
    expect(questionGridLayout(total, surface)).toMatchObject(expected);
  });
});
