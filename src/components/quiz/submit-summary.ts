import { formatTimer } from "@/components/quiz/player-shell-utils";

/** Question numbers are 1-based, as shown to the student. */
export type SubmitSummary = { unanswered: number[]; flagged: number[]; answeredCount: number };

/** `answered` / `flagged` hold 0-based question indexes. */
export function buildSubmitSummary(total: number, answered: ReadonlySet<number>, flagged: ReadonlySet<number>): SubmitSummary {
  const unanswered = Array.from({ length: total }, (_, index) => index).filter((index) => !answered.has(index)).map((index) => index + 1);
  const flaggedNumbers = [...flagged].filter((index) => index >= 0 && index < total).sort((a, b) => a - b).map((index) => index + 1);
  return { unanswered, flagged: flaggedNumbers, answeredCount: total - unanswered.length };
}

/** `null` = unknown / untimed (remaining) or unlimited / unknown (attempts left); that clause is dropped. */
export function submitLeadText(remainingSeconds: number | null, attemptsLeft: number | null): string {
  const time = remainingSeconds === null ? "" : `Còn ${formatTimer(remainingSeconds)}. `;
  const retry = attemptsLeft !== null && attemptsLeft > 0 ? `, bạn còn ${attemptsLeft} lần làm lại` : "";
  return `${time}Sau khi nộp không sửa được nữa${retry}.`;
}
