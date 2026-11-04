export type ScorePasteAssignment = { row: number; col: number; value: number };

export type ScorePastePlan = {
  assignments: ScorePasteAssignment[];
  /** Non-empty cells that are not a number in 0..max for their column. */
  invalid: number;
  /** Cells that fall outside the available rows/columns. */
  ignored: number;
};

/** Excel/Sheets clipboard text/plain: rows by newline, cells by tab. A trailing newline does not add a row. */
export function parseClipboardGrid(text: string): string[][] {
  const rows = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  return rows.map((row) => row.split("\t"));
}

/** Accepts "8", "8.5", "8,5"; returns null when blank, non-numeric or outside 0..max. */
export function parseScoreCell(raw: string, max: number): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return value >= 0 && value <= max ? Math.round(value * 100) / 100 : null;
}

/** True when the clipboard holds more than one cell, i.e. it should be handled as a block paste. */
export function isBlockPaste(grid: string[][]) {
  return grid.length > 1 || (grid[0]?.length ?? 0) > 1;
}

/**
 * Maps a pasted block onto the editable grid starting at (startRow, startCol).
 * Blank cells are skipped (they never clear a score); extra cells beyond the grid are ignored.
 */
export function planScorePaste(
  grid: string[][],
  start: { row: number; col: number },
  size: { rows: number; colMaxScores: readonly number[] },
): ScorePastePlan {
  const plan: ScorePastePlan = { assignments: [], invalid: 0, ignored: 0 };
  grid.forEach((cells, rowOffset) => {
    cells.forEach((raw, colOffset) => {
      const row = start.row + rowOffset;
      const col = start.col + colOffset;
      if (row >= size.rows || col >= size.colMaxScores.length) {
        if (raw.trim()) plan.ignored += 1;
        return;
      }
      if (!raw.trim()) return;
      const value = parseScoreCell(raw, size.colMaxScores[col]);
      if (value === null) plan.invalid += 1;
      else plan.assignments.push({ row, col, value });
    });
  });
  return plan;
}

/** Excel-like cursor movement inside the editable grid; null when the key does not move or would leave the grid. */
export function nextScoreCell(
  cell: { row: number; col: number },
  key: string,
  size: { rows: number; cols: number },
  shift = false,
): { row: number; col: number } | null {
  const move = key === "Enter" ? (shift ? "ArrowUp" : "ArrowDown") : key;
  const next = { ...cell };
  if (move === "ArrowDown") next.row += 1;
  else if (move === "ArrowUp") next.row -= 1;
  else if (move === "ArrowRight") next.col += 1;
  else if (move === "ArrowLeft") next.col -= 1;
  else return null;
  return next.row < 0 || next.col < 0 || next.row >= size.rows || next.col >= size.cols ? null : next;
}

export function describePaste(plan: ScorePastePlan) {
  const parts = [`Đã dán ${plan.assignments.length} ô điểm`];
  if (plan.invalid) parts.push(`${plan.invalid} ô không hợp lệ bị bỏ qua`);
  if (plan.ignored) parts.push(`${plan.ignored} ô vượt quá bảng bị bỏ qua`);
  return parts.join(", ");
}
