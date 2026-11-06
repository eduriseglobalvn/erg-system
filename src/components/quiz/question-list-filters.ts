import type { QuestionCell } from "@/components/quiz/question-navigator";

export type QuestionListMode = "taking" | "review";
export type QuestionListFilter = "all" | "todo" | "flagged" | "wrong" | "skipped";

const MATCH: Record<QuestionListFilter, (cell: QuestionCell) => boolean> = {
  all: () => true,
  // The current question is still unanswered from the student's point of view.
  todo: (cell) => cell.state === "todo" || cell.state === "current",
  flagged: (cell) => cell.flagged,
  wrong: (cell) => cell.state === "wrong",
  skipped: (cell) => cell.state === "skipped",
};

const LABEL: Record<QuestionListFilter, string> = { all: "Tất cả", todo: "Chưa làm", flagged: "Đánh dấu", wrong: "Sai", skipped: "Bỏ trống" };
const IDS: Record<QuestionListMode, QuestionListFilter[]> = {
  taking: ["all", "todo", "flagged"],
  review: ["all", "wrong", "skipped", "flagged"],
};

export function filterOptions(mode: QuestionListMode, cells: QuestionCell[]) {
  return IDS[mode].map((id) => ({ id, label: LABEL[id], count: cells.filter(MATCH[id]).length }));
}

// Filters only hide cells: indexes and totals stay intact.
export function applyFilter(cells: QuestionCell[], filter: QuestionListFilter): QuestionCell[] {
  return cells.map((cell) => ({ ...cell, hidden: !MATCH[filter](cell) }));
}

export function parseGoTo(input: string, total: number): { index: number } | { error: string } {
  const text = input.trim();
  const n = Number(text);
  return /^\d+$/.test(text) && n >= 1 && n <= total ? { index: n - 1 } : { error: `Nhập số từ 1 đến ${total}` };
}
