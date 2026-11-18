import { beforeEach, expect, it, vi } from "vitest";

import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", () => ({ apiRequest }));
vi.mock("@/features/question-bank/api/question-bank-to-quiz", () => ({
  createQuizDraftFromBankQuestions: () => ({ playerTemplate: {}, settings: {}, tree: [] }),
  createQuizDraftFromQuiz: async (_id: string, title: string) => ({ playerTemplate: {}, settings: { info: { title } }, tree: [{ slides: [{ id: "s1" }] }] }),
}));
import { saveTeacherExercise } from "./teacher-exercise-api";

const question = { id: "q1", subjectId: "ic3", levelId: "l1" } as QuestionBankQuestion;
const calls = () => apiRequest.mock.calls.map(([path, init]) => `${init.method} ${path}`);

beforeEach(() => {
  apiRequest.mockReset();
  apiRequest.mockImplementation(async (_path: string, init: { method: string }) => (init.method === "POST" ? { quizId: "quiz-1" } : { docVersion: 2 }));
});

it("creates, saves and publishes a new quiz as the signed-in teacher", async () => {
  await expect(saveTeacherExercise({ title: "Ôn tập", kind: "train", questions: [question], timeLimitMinutes: 15 })).resolves.toBe("quiz-1");
  expect(calls()).toEqual(["POST /api/v1/lcms/quizzes", "PUT /api/v1/lcms/quizzes/quiz-1/draft", "POST /api/v1/lcms/quizzes/quiz-1/publish"]);
  expect(apiRequest.mock.calls.every(([, init]) => init.portal === "lms")).toBe(true);
  expect(JSON.parse(apiRequest.mock.calls[2][1].body)).toEqual({ docVersion: 2 });
});

it("renames and republishes a quiz the teacher already owns instead of creating another", async () => {
  await saveTeacherExercise({ quizId: "mine", title: "Ôn tập 2", kind: "test", questions: [question], timeLimitMinutes: 15 });
  expect(calls()).toEqual(["PATCH /api/v1/lcms/quizzes/mine", "PUT /api/v1/lcms/quizzes/mine/draft", "POST /api/v1/lcms/quizzes/mine/publish"]);
});

it("refuses an exercise without questions before calling the server", async () => {
  await expect(saveTeacherExercise({ title: "Rỗng", kind: "train", questions: [], timeLimitMinutes: 15 })).rejects.toThrow("Chọn ít nhất một câu hỏi.");
  expect(apiRequest).not.toHaveBeenCalled();
});

it("copies a quiz that keeps its own questions: same slides, new title, source untouched", async () => {
  const { copyQuizAsTeacherExercise } = await import("./teacher-exercise-api");
  await expect(copyQuizAsTeacherExercise({ sourceQuizId: "system", title: "Bài riêng", kind: "train", subjectId: "ic3", levelId: "l1" })).resolves.toBe("quiz-1");
  expect(calls()).toEqual(["POST /api/v1/lcms/quizzes", "PUT /api/v1/lcms/quizzes/quiz-1/draft", "POST /api/v1/lcms/quizzes/quiz-1/publish"]);
  const draft = JSON.parse(apiRequest.mock.calls[1][1].body);
  expect(draft.tree).toEqual([{ slides: [{ id: "s1" }] }]);
  expect(JSON.parse(apiRequest.mock.calls[0][1].body).sourceQuizId).toBe("system");
  expect(draft.settings.info.title).toBe("Bài riêng");
});
