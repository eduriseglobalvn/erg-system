import { describe, expect, it } from "vitest";

import { applyFilter, filterOptions, parseGoTo } from "@/components/quiz/question-list-filters";
import type { QuestionCell, QuestionCellState } from "@/components/quiz/question-navigator";

const make = (total: number, states: (i: number) => QuestionCellState, flagged: (i: number) => boolean = () => false): QuestionCell[] =>
  Array.from({ length: total }, (_, index) => ({ index, state: states(index), flagged: flagged(index) }));
const labels = (options: ReturnType<typeof filterOptions>) => options.map((o) => `${o.label} · ${o.count}`);

describe("filterOptions", () => {
  it("taking mode: all / todo / flagged", () => {
    const cells = make(20, (i) => (i < 16 ? "done" : "todo"), (i) => i === 1 || i === 5);
    expect(labels(filterOptions("taking", cells))).toEqual(["Tất cả · 20", "Chưa làm · 4", "Đánh dấu · 2"]);
  });

  it("taking mode: an answered current question is not todo", () => {
    const cells = make(5, (i) => (i === 0 ? "current" : i === 1 ? "todo" : "done"));
    expect(filterOptions("taking", cells)[1].count).toBe(2);
    cells[0].answered = true;
    expect(filterOptions("taking", cells)[1].count).toBe(1);
  });

  it("review mode: all / wrong / skipped / flagged", () => {
    const cells = make(90, (i) => (i < 9 ? "wrong" : i < 12 ? "skipped" : "correct"), (i) => i < 4);
    expect(labels(filterOptions("review", cells))).toEqual(["Tất cả · 90", "Sai · 9", "Bỏ trống · 3", "Đánh dấu · 4"]);
  });
});

describe("applyFilter", () => {
  const cells = make(90, (i) => (i % 10 === 0 ? "wrong" : "correct"));

  it("hides non-matching cells and keeps their index", () => {
    const shown = applyFilter(cells, "wrong").filter((c) => !c.hidden);
    expect(shown).toHaveLength(9);
    expect(shown.map((c) => c.index)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80]);
  });

  it("keeps every cell for all", () => {
    const result = applyFilter(applyFilter(cells, "wrong"), "all");
    expect(result).toHaveLength(90);
    expect(result.every((c) => !c.hidden)).toBe(true);
  });
});

describe("parseGoTo", () => {
  it("returns a 0-based index", () => expect(parseGoTo("37", 90)).toEqual({ index: 36 }));
  it("trims whitespace", () => expect(parseGoTo(" 90 ", 90)).toEqual({ index: 89 }));
  it.each(["0", "91", "abc", "", "3.5", "-2"])("rejects %j", (input) => {
    expect(parseGoTo(input, 90)).toEqual({ error: "Nhập số từ 1 đến 90" });
  });
});
