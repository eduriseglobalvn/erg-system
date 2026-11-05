import { describe, expect, test, vi } from "vitest";

import { createQuizFromBankQuestions } from "@/features/lcms/create-quiz-from-bank";
import { applyQuizThemePreset, quizThemePresets } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { createQuestionBankPlayerTemplate } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

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
    expect(deps.navigate).toHaveBeenCalledWith("/admin/content/quiz-editor");
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
    expect(deps.navigate).toHaveBeenCalledWith("/admin/content/quiz-editor?quizId=quiz-a");
    expect(deps.setPendingQuestionImports).not.toHaveBeenCalled();
    expect(deps.toastSuccess).toHaveBeenCalled();
  });

  test("applies package settings to the saved quiz draft", async () => {
    const deps = dependencies();

    await createQuizFromBankQuestions([question], deps, {
      kind: "test",
      passingRate: 75,
      shuffleAnswers: false,
      shuffleQuestions: true,
      timeLimitMinutes: 35,
      title: "Package A",
    });

    expect(deps.createQuiz).toHaveBeenCalledWith(expect.objectContaining({ kind: "test", title: "Package A" }));
    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        playerTemplate: createQuestionBankPlayerTemplate(),
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

  test("equal split of an uneven count still adds up to exactly 1000", async () => {
    const deps = dependencies();
    const three = ["qb-a", "qb-b", "qb-c"].map((id) => ({ ...question, id }));

    await createQuizFromBankQuestions(three, deps);

    const draft = vi.mocked(deps.saveDraft).mock.calls[0]?.[0];
    const points = draft?.tree[0]?.slides.map((slide) => slide.questionSetSettings?.points);
    expect(points).toEqual([333.34, 333.33, 333.33]);
  });

  test("writes custom per-question points and derives the passing rate from their sum", async () => {
    const deps = dependencies();
    const secondQuestion: QuestionBankQuestion = { ...question, id: "qb-b", stem: "Question B" };

    await createQuizFromBankQuestions([question, secondQuestion], deps, {
      passingScoreMode: "points",
      passingScorePoints: 6,
      pointsMode: "custom",
      questionPoints: { "qb-a": 3, "qb-b": 7 },
    });

    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ settings: expect.objectContaining({ passingRate: 60 }) }),
        tree: [
          expect.objectContaining({
            slides: [
              expect.objectContaining({
                questionSetSettings: expect.objectContaining({ points: 3 }),
                feedbackRows: expect.arrayContaining([expect.objectContaining({ kind: "correct", score: 3 })]),
              }),
              expect.objectContaining({
                questionSetSettings: expect.objectContaining({ points: 7 }),
                feedbackRows: expect.arrayContaining([expect.objectContaining({ kind: "correct", score: 7 })]),
              }),
            ],
          }),
        ],
      }),
    );
  });

  test("passes acceptPartial onto every slide and the chosen theme into the player template", async () => {
    const deps = dependencies();
    const theme = applyQuizThemePreset(createQuestionBankPlayerTemplate(), quizThemePresets[4]);

    await createQuizFromBankQuestions([question], deps, { acceptPartial: true, playerTemplate: theme });

    expect(deps.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        playerTemplate: theme,
        tree: [expect.objectContaining({ slides: [expect.objectContaining({ options: expect.objectContaining({ acceptPartial: true }) })] })],
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
