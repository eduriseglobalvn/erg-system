import { expect, test } from "vitest";

import { buildTopicBoard, scoreText, type ScoreBoardAttempt } from "@/features/lms/api/lms-class-score-board-api";

const attempt = (id: string, over: Partial<ScoreBoardAttempt>): ScoreBoardAttempt => ({
  id, studentId: "stu-1", assignmentId: "asg-1", quizId: "quiz-1", quizTitle: "Chủ đề 1", topicId: "t1", topicName: "Chủ đề 1",
  score: 60, maxScore: 90, submittedAt: "2026-11-03T08:00:00+07:00", durationSeconds: 1200, status: "submitted", ...over,
});

test("a topic cell keeps the highest score and the most recent attempt, across the quizzes of that topic", () => {
  const board = buildTopicBoard({ attempts: [
    attempt("a", { score: 60, submittedAt: "2026-11-03T08:00:00+07:00" }),
    attempt("b", { score: 68, submittedAt: "2026-11-06T08:00:00+07:00", assignmentId: "asg-2", quizId: "quiz-2" }),
    attempt("c", { score: 66, submittedAt: "2026-11-10T08:00:00+07:00" }),
  ] });

  expect(board.columns).toEqual([{ key: "topic:t1", title: "Chủ đề 1", byTopic: true, maxScore: 90 }]);
  const cell = board.cellOf("stu-1", "topic:t1");
  expect(cell?.best.id).toBe("b");
  expect(cell?.latest.id).toBe("c");
  expect(cell?.attempts).toBe(3);
  expect(cell?.tieMinutes).toBeNull();
});

test("equal highest scores go to the quicker attempt, and the cell notes how many minutes it took", () => {
  const board = buildTopicBoard({ attempts: [
    attempt("slow", { score: 68, durationSeconds: 1500, submittedAt: "2026-11-03T08:00:00+07:00" }),
    attempt("fast", { score: 68, durationSeconds: 900, submittedAt: "2026-11-06T08:00:00+07:00" }),
  ] });

  const cell = board.cellOf("stu-1", "topic:t1");
  expect(cell?.best.id).toBe("fast");
  expect(cell?.latest.id).toBe("fast");
  expect(cell?.tieMinutes).toBe(15);
});

test("the earlier of two equal scores stays highest when it was the quicker one", () => {
  const board = buildTopicBoard({ attempts: [
    attempt("fast", { score: 68, durationSeconds: 600, submittedAt: "2026-11-03T08:00:00+07:00" }),
    attempt("slow", { score: 68, durationSeconds: 1500, submittedAt: "2026-11-06T08:00:00+07:00" }),
  ] });

  const cell = board.cellOf("stu-1", "topic:t1");
  expect(cell?.best.id).toBe("fast");
  expect(cell?.latest.id).toBe("slow");
  expect(cell?.tieMinutes).toBe(10);
});

test("a quiz that is not of one topic gets its own column, titled with the quiz name", () => {
  const board = buildTopicBoard({ attempts: [
    attempt("a", {}),
    attempt("mix", { topicId: null, topicName: null, quizId: "quiz-mix", quizTitle: "Ôn tập giữa kỳ", maxScore: 1000, score: 800 }),
  ] });

  expect(board.columns.map((column) => column.title)).toEqual(["Chủ đề 1", "Ôn tập giữa kỳ"]);
  expect(board.columns[1]).toMatchObject({ key: "quiz:quiz-mix", byTopic: false, maxScore: 1000 });
  expect(board.cellOf("stu-1", "quiz:quiz-mix")?.best.id).toBe("mix");
  expect(board.cellOf("stu-2", "topic:t1")).toBeUndefined();
});

test("scores read like the sheet: whole numbers stay whole, others keep one decimal with a comma", () => {
  expect(scoreText(68)).toBe("68");
  expect(scoreText(923.07)).toBe("923,1");
  expect(scoreText(null)).toBe("–");
});
