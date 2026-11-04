import { describe, expect, it } from "vitest";

import { describePaste, isBlockPaste, nextScoreCell, parseClipboardGrid, parseScoreCell, planScorePaste } from "./score-paste";

describe("score paste helper", () => {
  it("parses an Excel column and block (CRLF, trailing newline)", () => {
    expect(parseClipboardGrid("8\r\n9.5\r\n7\r\n")).toEqual([["8"], ["9.5"], ["7"]]);
    expect(parseClipboardGrid("8\t9\n7\t6")).toEqual([["8", "9"], ["7", "6"]]);
    expect(isBlockPaste(parseClipboardGrid("8"))).toBe(false);
    expect(isBlockPaste(parseClipboardGrid("8\n9"))).toBe(true);
  });

  it("validates numbers within 0..max and accepts decimal comma", () => {
    expect(parseScoreCell(" 8,5 ", 10)).toBe(8.5);
    expect(parseScoreCell("0", 10)).toBe(0);
    expect(parseScoreCell("10.5", 10)).toBeNull();
    expect(parseScoreCell("-1", 10)).toBeNull();
    expect(parseScoreCell("abc", 10)).toBeNull();
    expect(parseScoreCell("", 10)).toBeNull();
  });

  it("maps a block, skips blanks, counts invalid and ignores cells beyond the grid", () => {
    const plan = planScorePaste(
      parseClipboardGrid("8\t9\tX\n\t7\t6\n5\t5\t5\n4\t4\t4"),
      { row: 1, col: 0 },
      { rows: 4, colMaxScores: [10, 10] },
    );
    expect(plan.assignments).toEqual([
      { row: 1, col: 0, value: 8 },
      { row: 1, col: 1, value: 9 },
      { row: 2, col: 1, value: 7 },
      { row: 3, col: 0, value: 5 },
      { row: 3, col: 1, value: 5 },
    ]);
    expect(plan.invalid).toBe(0);
    // "X" (col 2), "6" (col 2) in row 2, "5" (col 2) in row 3 fall outside the 2 columns; row 4 is outside the rows.
    expect(plan.ignored).toBe(2 + 1 + 3);
    expect(describePaste(plan)).toBe("Đã dán 5 ô điểm, 6 ô vượt quá bảng bị bỏ qua");
  });

  it("reports invalid cells inside the grid", () => {
    const plan = planScorePaste([["11"], ["abc"], ["9"]], { row: 0, col: 0 }, { rows: 3, colMaxScores: [10] });
    expect(plan.assignments).toEqual([{ row: 2, col: 0, value: 9 }]);
    expect(plan.invalid).toBe(2);
  });

  it("moves like a spreadsheet and stays inside the grid", () => {
    const size = { rows: 3, cols: 2 };
    expect(nextScoreCell({ row: 0, col: 0 }, "Enter", size)).toEqual({ row: 1, col: 0 });
    expect(nextScoreCell({ row: 1, col: 0 }, "Enter", size, true)).toEqual({ row: 0, col: 0 });
    expect(nextScoreCell({ row: 0, col: 0 }, "ArrowRight", size)).toEqual({ row: 0, col: 1 });
    expect(nextScoreCell({ row: 2, col: 1 }, "ArrowDown", size)).toBeNull();
    expect(nextScoreCell({ row: 0, col: 0 }, "ArrowLeft", size)).toBeNull();
    expect(nextScoreCell({ row: 0, col: 0 }, "a", size)).toBeNull();
  });
});
