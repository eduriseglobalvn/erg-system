import { withTenant } from "@/features/lms/api/lms-graphql-shared";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";

export type ScoreBoardStudent = { id: string; studentCode?: string | null; fullName?: string | null };

/** One handed-in attempt of the class; `topicId` is set when the quiz belongs to a single topic. */
export type ScoreBoardAttempt = {
  id: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle?: string | null;
  quizId?: string | null;
  quizTitle?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  score?: number | null;
  maxScore?: number | null;
  percent?: number | null;
  status?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  durationSeconds?: number | null;
};

export type ClassScoreBoard = {
  classId: string;
  className?: string | null;
  students: ScoreBoardStudent[];
  attempts: ScoreBoardAttempt[];
  truncated: boolean;
};

const LmsClassScoreBoardDocument = `
query LmsClassScoreBoard($input: ClassScoreBoardInput!) {
  lms {
    classScoreBoard(input: $input) {
      classId
      className
      truncated
      students { id studentCode fullName }
      attempts {
        id studentId assignmentId assignmentTitle quizId quizTitle topicId topicName
        score maxScore percent status startedAt submittedAt durationSeconds
      }
    }
  }
}
`;

export async function loadClassScoreBoard(classId: string, signal?: AbortSignal) {
  const response = await graphQlRequest<{ lms: { classScoreBoard: ClassScoreBoard } }, { input: { classId: string; tenantId?: string } }>({
    operationName: "LmsClassScoreBoard",
    portal: "lms",
    query: LmsClassScoreBoardDocument,
    signal,
    tenantId: getDefaultTenantId(),
    variables: { input: withTenant<{ classId: string; tenantId?: string }>({ classId }) },
  });
  return validateResponse(
    response,
    (value): value is { lms: { classScoreBoard: ClassScoreBoard } } =>
      isObject(value) && isObject(value.lms) && isObject(value.lms.classScoreBoard)
      && Array.isArray(value.lms.classScoreBoard.students) && Array.isArray(value.lms.classScoreBoard.attempts),
    "lms.class-score-board",
  ).lms.classScoreBoard;
}

export type ScoreBoardColumn = { key: string; title: string; byTopic: boolean; maxScore: number | null };
/** `fasterByMinutes`: set when the best attempt won a tie on score by being quicker; the minutes it took. */
export type ScoreBoardCell = { best: ScoreBoardAttempt; latest: ScoreBoardAttempt; attempts: number; tieMinutes: number | null };

const REVIEW_STATES = new Set(["needs_review", "review_required"]);
export const awaitsGrading = (attempt: ScoreBoardAttempt) => REVIEW_STATES.has((attempt.status ?? "").toLowerCase());
export const attemptMinutes = (attempt: ScoreBoardAttempt) =>
  attempt.durationSeconds === null || attempt.durationSeconds === undefined ? null : Math.max(1, Math.round(attempt.durationSeconds / 60));

const columnKey = (attempt: ScoreBoardAttempt) => (attempt.topicId ? `topic:${attempt.topicId}` : `quiz:${attempt.quizId ?? attempt.assignmentId}`);
const time = (value?: string | null) => (value ? Date.parse(value) || 0 : 0);
const seconds = (attempt: ScoreBoardAttempt) => attempt.durationSeconds ?? Number.POSITIVE_INFINITY;

/**
 * The "by topic" board (owner rule 18/11): one column per topic, or per quiz when the quiz is not of a single topic.
 * A cell keeps the highest score and the most recent attempt; equal highest scores go to the quicker attempt.
 */
export function buildTopicBoard(board: Pick<ClassScoreBoard, "attempts">) {
  const columns = new Map<string, ScoreBoardColumn>();
  const cells = new Map<string, ScoreBoardCell>();
  // oldest first, so columns appear in the order the class first met them
  for (const attempt of [...board.attempts].sort((a, b) => time(a.submittedAt) - time(b.submittedAt))) {
    const key = columnKey(attempt);
    const column = columns.get(key);
    const maxScore = attempt.maxScore ?? null;
    if (!column) {
      columns.set(key, { key, byTopic: Boolean(attempt.topicId), maxScore, title: (attempt.topicId ? attempt.topicName : null) || attempt.quizTitle || attempt.assignmentTitle || "Bài tập" });
    } else if (column.maxScore !== maxScore) {
      column.maxScore = null; // attempts on different scales: the header cannot name one
    }
    const cellKey = `${attempt.studentId}|${key}`;
    const cell = cells.get(cellKey);
    if (!cell) {
      cells.set(cellKey, { best: attempt, latest: attempt, attempts: 1, tieMinutes: null });
      continue;
    }
    cell.attempts += 1;
    if (time(attempt.submittedAt) >= time(cell.latest.submittedAt)) cell.latest = attempt;
    const score = attempt.score ?? 0;
    const bestScore = cell.best.score ?? 0;
    if (score > bestScore) {
      cell.best = attempt;
      cell.tieMinutes = null;
    } else if (score === bestScore) {
      if (seconds(attempt) < seconds(cell.best)) cell.best = attempt;
      cell.tieMinutes = attemptMinutes(cell.best);
    }
  }
  return { columns: [...columns.values()], cellOf: (studentId: string, key: string) => cells.get(`${studentId}|${key}`) };
}

/** A score as the sheet shows it: whole when it is whole, else one decimal with a comma. */
export function scoreText(value?: number | null) {
  if (value === null || value === undefined) return "–";
  return (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}
