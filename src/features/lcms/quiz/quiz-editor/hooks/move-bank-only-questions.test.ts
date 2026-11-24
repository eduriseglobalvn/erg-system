import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { findBankOnlyQuestions, moveBankOnlyQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/move-bank-only-questions";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

const { loadQuizEditorDraft, loadQuestionBankData, moveQuestionsToTopic } = vi.hoisted(() => ({
  loadQuizEditorDraft: vi.fn(),
  loadQuestionBankData: vi.fn(),
  moveQuestionsToTopic: vi.fn(),
}));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-api", () => ({ loadQuizEditorDraft }));
vi.mock("@/features/lcms/quiz/quiz-editor/api/quiz-editor-query", () => ({
  quizEditorLevelQuizzesQueryOptions: () => ({
    queryKey: ["level-quizzes"],
    queryFn: () => [{ id: "quiz-a", status: "draft" }, { id: "quiz-gone", status: "deleted" }],
  }),
}));
vi.mock("@/features/question-bank/api/question-bank-api", () => ({ loadQuestionBankData }));
vi.mock("@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic", () => ({ moveQuestionsToTopic }));

const level = { subjectId: "s1", levelId: "l1" };
const question = (id: string, extra: Partial<QuestionBankQuestion> = {}) =>
  ({ id, stem: id, type: "multiple-choice", choices: [{ id: "c1", label: "A", correct: true }], ...extra }) as QuestionBankQuestion;

describe("findBankOnlyQuestions", () => {
  it("keeps bank-made rows that no quiz of the Level holds, across every page", async () => {
    loadQuizEditorDraft.mockResolvedValue({ tree: [{ slides: [{ id: "s1", bankQuestionId: "held-by-quiz" }] }] });
    loadQuestionBankData
      .mockResolvedValueOnce({ questions: [question("held-by-quiz"), question("mirror", { fromQuizEditor: true }), question("loose-1")], questionPage: { hasNext: true } })
      .mockResolvedValueOnce({ questions: [question("held-live"), question("loose-2")], questionPage: { hasNext: false } });

    const found = await findBankOnlyQuestions(new QueryClient(), level, [{ id: "x", questionId: "held-live" } as never]);

    expect(found.map((item) => item.id)).toEqual(["loose-1", "loose-2"]);
    expect(loadQuizEditorDraft).toHaveBeenCalledExactlyOnceWith("quiz-a");
    expect(loadQuestionBankData.mock.calls.map((call) => call[1].page)).toEqual([0, 1]);
  });
});

describe("moveBankOnlyQuestions", () => {
  it("moves each question into its topic's quiz, keeping the bank link, and the rest into Tất cả", async () => {
    moveQuestionsToTopic.mockResolvedValue(undefined);
    const importLoose = vi.fn();
    let next = 0;

    await moveBankOnlyQuestions(new QueryClient(), {
      level,
      topics: [{ id: "t1", label: "Phân số" }, { id: "t2", label: "Hình học" }],
      questions: [question("q1", { topicId: "t1" }), question("q2", { topicId: null }), question("q3", { topicId: "other-level-topic" })],
      createId: (prefix) => `${prefix}-${(next += 1)}`,
      questionDefaults: createNewQuizProjectSettings().questionDefaults,
      importLoose,
    });

    expect(moveQuestionsToTopic).toHaveBeenCalledOnce();
    expect(moveQuestionsToTopic.mock.lastCall?.[1]).toEqual({ ...level, topicId: "t1", topicLabel: "Phân số" });
    expect(moveQuestionsToTopic.mock.lastCall?.[2][0]).toMatchObject({ bankQuestionId: "q1" });
    expect(importLoose.mock.lastCall?.[0].map((item: QuestionBankQuestion) => item.id)).toEqual(["q2", "q3"]);
  });
});
