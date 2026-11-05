import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { AnswerPayload, Question } from "@/domain/quiz/types";

/** order[i] = response id in row i ("" = empty slot); connected = row ids whose pieces are pushed in. */
export type MatchingBoard = { order: string[]; connected: string[] };

export function readBoard(question: Question, value: AnswerPayload): MatchingBoard {
  const rowIds = (question.matching ?? []).map((pair) => pair.id);
  const assignments = value.matchingAssignments && Object.keys(value.matchingAssignments).length > 0 ? value.matchingAssignments : null;
  const order = value.matchingOrder?.length
    ? value.matchingOrder
    : assignments
      ? rowIds.map((id) => assignments[id] ?? "")
      : (createInitialAnswer(question).matchingOrder ?? []);
  const connected = Array.isArray(value.matchingConnectedRows)
    ? value.matchingConnectedRows
    : assignments
      ? rowIds.filter((id) => assignments[id])
      : value.matchingOrder?.length
        ? rowIds // old answers kept no connection state: every placed piece counted as pushed in
        : [];
  return { order, connected };
}

/** Learner drop (spec 7.1): outside detaches, own row toggles, another row swaps the two pieces only. */
export function dropPiece(board: MatchingBoard, rowIds: string[], from: number, to: number | null): MatchingBoard {
  const source = rowIds[from];
  if (to === null) return { order: board.order, connected: board.connected.filter((id) => id !== source) };
  if (to === from) {
    const connected = board.connected.includes(source) ? board.connected.filter((id) => id !== source) : [...board.connected, source];
    return { order: board.order, connected };
  }
  const order = [...board.order];
  [order[from], order[to]] = [order[to], order[from]];
  const target = rowIds[to];
  const connected = [...board.connected.filter((id) => id !== source && id !== target), target];
  return { order, connected };
}
