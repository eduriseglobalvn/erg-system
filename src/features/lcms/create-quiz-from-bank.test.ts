import { describe, expect, test, vi } from "vitest";

import { createQuizFromBankQuestions } from "@/features/lcms/create-quiz-from-bank";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

const question: QuestionBankQuestion = {
  answer: "A",
  categoryId: "topic-a",
  categoryLabel: "Topic A",
  choices: [],
  difficulty: "core",
  gradeLabel: "Grade 6",
  id: "qb-a",
  lastUsedAt: "today",
  levelId: "level-a",
  levelLabel: "Level A",
  masteryRate: 80,
  objective: "Objective",
  recommendedCluster: "Cluster",
  schoolsUsing: 1,
  settings: { shuffleChoices: false },
  scope: { type: "global" },
  status: "ready",
  stem: "Question",
  subjectId: "subject-a",
  subjectLabel: "Subject A",
  tags: [],
  type: "multiple-choice",
  usageCount: 1,
};

function dependencies(overrides: Partial<Parameters<typeof createQuizFromBankQuestions>[1]> = {}) {
  return {
    createIdempotencyKey: vi.fn(() => "idem-1"),
    createQuiz: vi.fn(async () => ({ docVersion: 0, draftId: "draft-a", quizId: "quiz-a" })),
    hasApiBase: vi.fn(() => true),
    navigate: vi.fn(),
    saveDraft: vi.fn(async () => ({ docVersion: 1 })),
    setPendingQuestionImports: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    ...overrides,
  };
}

describe("createQuizFromBankQuestions", () => {
  test("uses local import only when no API base is configured", async () => {
    const deps = dependencies({ hasApiBase: vi.fn(() => false) });

    await createQuizFromBankQuestions([question], deps);

    expect(deps.setPendingQuestionImports).toHaveBeenCalledWith([question]);
    expect(deps.navigate).toHaveBeenCalledWith("/quiz-editor");
    expect(deps.createQuiz).not.toHaveBeenCalled();
    expect(deps.saveDraft).not.toHaveBeenCalled();
  });

  test("creates and saves BE draft before navigating to editor", async () => {
    const deps = dependencies();

    await createQuizFromBankQuestions([question], deps);

    expect(deps.createQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "topic-a",
        idempotencyKey: "idem-1",
        kind: "train",
        levelId: "level-a",
        questionIds: ["qb-a"],
        subjectId: "subject-a",
        subtitle: "Topic A",
        title: "Subject A - Level A",
      }),
    );
    expect(deps.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ quizId: "quiz-a", docVersion: 0 }));
    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        tree: [
          expect.objectContaining({
            slides: [
              expect.objectContaining({
                bankQuestionId: "qb-a",
                questionId: "qb-a",
                questionSettings: { shuffleChoices: false },
                questionSetSettings: expect.objectContaining({
                  points: 1000,
                }),
              }),
            ],
          }),
        ],
      }),
    );
    expect(deps.navigate).toHaveBeenCalledWith("/quiz-editor?quizId=quiz-a");
    expect(deps.setPendingQuestionImports).not.toHaveBeenCalled();
    expect(deps.toastSuccess).toHaveBeenCalled();
  });

  test("applies package settings to the saved quiz draft", async () => {
    const deps = dependencies();

    await createQuizFromBankQuestions([question], deps, {
      kind: "test",
      passingRate: 75,
      playerSize: "wide",
      shuffleAnswers: false,
      shuffleQuestions: true,
      templateLayout: "split",
      timeLimitMinutes: 35,
      title: "Package A",
    });

    expect(deps.createQuiz).toHaveBeenCalledWith(expect.objectContaining({ kind: "test", title: "Package A" }));
    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        playerTemplate: expect.objectContaining({ layout: "split", playerSize: "wide" }),
        settings: expect.objectContaining({
          questionDefaults: expect.objectContaining({ shuffleAnswers: false, shuffleQuestions: true }),
          settings: expect.objectContaining({
            enableTimeLimit: true,
            passingRate: 75,
            randomizeQuestionOrder: true,
            timeLimit: "35:00",
          }),
        }),
      }),
    );
  });

  test("converts point-based passing score and supports no time limit", async () => {
    const deps = dependencies();

    await createQuizFromBankQuestions([question], deps, {
      passingScoreMode: "points",
      passingScorePoints: 800,
      timeLimitMinutes: 0,
      title: "Question edit draft",
    });

    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          settings: expect.objectContaining({
            enableTimeLimit: false,
            passingRate: 80,
            timeLimit: "00:00",
          }),
        }),
      }),
    );
  });

  test("distributes the fixed 1000 package points across selected questions", async () => {
    const deps = dependencies();
    const secondQuestion: QuestionBankQuestion = {
      ...question,
      answer: "B",
      id: "qb-b",
      stem: "Question B",
    };

    await createQuizFromBankQuestions([question, secondQuestion], deps);

    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        tree: [
          expect.objectContaining({
            slides: [
              expect.objectContaining({
                questionSetSettings: expect.objectContaining({ points: 500 }),
                feedbackRows: expect.arrayContaining([
                  expect.objectContaining({ kind: "correct", score: 500 }),
                ]),
              }),
              expect.objectContaining({
                questionSetSettings: expect.objectContaining({ points: 500 }),
                feedbackRows: expect.arrayContaining([
                  expect.objectContaining({ kind: "correct", score: 500 }),
                ]),
              }),
            ],
          }),
        ],
      }),
    );
  });

  test("does not open a local editor draft when API create fails", async () => {
    const deps = dependencies({ createQuiz: vi.fn(async () => Promise.reject(new Error("create failed"))) });

    await createQuizFromBankQuestions([question], deps);

    expect(deps.saveDraft).not.toHaveBeenCalled();
    expect(deps.navigate).not.toHaveBeenCalled();
    expect(deps.setPendingQuestionImports).not.toHaveBeenCalled();
    expect(deps.toastError).toHaveBeenCalledWith("create failed");
  });

  test("does not open a local editor draft when API save fails", async () => {
    const deps = dependencies({ saveDraft: vi.fn(async () => Promise.reject(new Error("save failed"))) });

    await createQuizFromBankQuestions([question], deps);

    expect(deps.navigate).not.toHaveBeenCalled();
    expect(deps.setPendingQuestionImports).not.toHaveBeenCalled();
    expect(deps.toastError).toHaveBeenCalledWith("save failed");
  });
});
