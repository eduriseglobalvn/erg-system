import { beforeEach, expect, test, vi } from "vitest";

import {
  createQuizEditorQuiz,
  deleteQuizEditorQuiz,
  loadQuizEditorDraft,
  normalizeQuizEditorGroups,
  normalizeQuizPlayerTemplate,
  normalizeQuizProjectSettings,
  reorderQuizEditorSlides,
  upsertQuizEditorSlide,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { apiRequest } from "@/lib/api-client";
import { graphQlRequest } from "@/lib/graphql-client";

vi.mock("@/lib/api-client", () => ({
  apiRequest: vi.fn(),
  hasApiBase: () => true,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-a",
  graphQlRequest: vi.fn(),
}));

const graphQlRequestMock = vi.mocked(graphQlRequest);
const apiRequestMock = vi.mocked(apiRequest);

beforeEach(() => {
  apiRequestMock.mockReset();
  graphQlRequestMock.mockReset();
});

test("normalizes backend authoring draft settings into the full editor settings shape", () => {
  const settings = normalizeQuizProjectSettings({
    info: {
      title: "ERG testing demo",
      author: "Seed",
      introduction: "Real BE draft",
    },
    runtime: {
      mode: "testing",
      timeLimitMinutes: 20,
      passPercent: 75,
      shuffleQuestions: true,
      shuffleChoices: true,
      revealFeedbackPerStep: false,
    },
    result: {
      passMessage: "Pass",
      failMessage: "Try again",
    },
  });

  expect(settings.info.title).toBe("ERG testing demo");
  expect(settings.info.page.testTitle).toBe("ERG testing demo");
  expect(settings.settings.enableTimeLimit).toBe(true);
  expect(settings.settings.timeLimit).toBe("20:00");
  expect(settings.settings.passingRate).toBe(75);
  expect(settings.settings.randomizeQuestionOrder).toBe(true);
  expect(settings.settings.showCorrectAnswersAfterSubmission).toBe(false);
  expect(settings.questionDefaults.shuffleAnswers).toBe(true);
  expect(settings.questionDefaults.shuffleQuestions).toBe(true);
  expect(settings.result.passMessage).toBe("Pass");
  expect(settings.result.reviewButtonLabel).toBeTruthy();
});

test("normalizes backend groupId tree into editor groups without losing slides", () => {
  const groups = normalizeQuizEditorGroups([
    {
      groupId: "group-question-types",
      title: "Question types",
      rule: "all",
      randomCount: 0,
      slides: [
        {
          id: "q1",
          kind: "multiple-choice",
          title: "Pick one",
          choices: [{ id: "a", label: "A", correct: true }],
        },
      ],
    },
  ]);

  expect(groups).toHaveLength(1);
  expect(groups[0]?.id).toBe("group-question-types");
  expect(groups[0]?.slides[0]?.id).toBe("q1");
  expect(groups[0]?.slides[0]?.kind).toBe("multiple-choice");
  expect(groups[0]?.slides[0]?.choices).toHaveLength(1);
});

test("fills missing player template fields so hydrated editor UI stays stable", () => {
  const template = normalizeQuizPlayerTemplate({
    layout: "classic",
    showToolbar: true,
    accentColor: "#d12b2b",
  });

  expect(template.layout).toBe("classic");
  expect(template.showToolbar).toBe(true);
  expect(template.accentColor).toBe("#d12b2b");
  expect(template.showPanel).toBe(true);
  expect(template.soundEffect).toBeTruthy();
  expect(template.textLabels).toBe(true);
});

test("fails API-enabled draft hydrate when BE returns invalid JSON instead of falling back to mock", async () => {
  graphQlRequestMock.mockResolvedValueOnce({
    lcms: {
      quizDraft: {
        quizId: "quiz-1",
        draftId: "draft-1",
        docVersion: 1,
        settings: "{invalid-json",
        playerTemplate: "{}",
        tree: "[]",
      },
    },
  } as never);

  await expect(loadQuizEditorDraft("quiz-1")).rejects.toThrow("Quiz editor draft JSON is invalid");
});

test("upserts a single slide through the BE authoring endpoint", async () => {
  apiRequestMock.mockResolvedValueOnce({ docVersion: 4 } as never);

  const result = await upsertQuizEditorSlide({
    afterSlideId: "slide-before",
    docVersion: 3,
    groupId: "group-a",
    quizId: "quiz-a",
    slide: {
      id: "slide-a",
      kind: "multiple-choice",
      title: "Pick one",
    } as never,
  });

  expect(result.docVersion).toBe(4);
  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lcms/quizzes/quiz-a/slides", {
    body: JSON.stringify({
      afterSlideId: "slide-before",
      docVersion: 3,
      groupId: "group-a",
      slide: {
        id: "slide-a",
        kind: "multiple-choice",
        title: "Pick one",
      },
    }),
    method: "POST",
    portal: "lcms",
  });
});

test("reorders slides through the BE authoring endpoint", async () => {
  apiRequestMock.mockResolvedValueOnce({ docVersion: 6 } as never);

  const result = await reorderQuizEditorSlides({
    docVersion: 5,
    groups: [{ groupId: "group-a", slideIds: ["slide-b", "slide-a"] }],
    quizId: "quiz-a",
  });

  expect(result.docVersion).toBe(6);
  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lcms/quizzes/quiz-a/reorder", {
    body: JSON.stringify({
      docVersion: 5,
      groups: [{ groupId: "group-a", slideIds: ["slide-b", "slide-a"] }],
    }),
    method: "POST",
    portal: "lcms",
  });
});

test("creates quiz with selected question ids so quiz bank metadata stays DB-backed", async () => {
  apiRequestMock.mockResolvedValueOnce({ quizId: "quiz-a", draftId: "draft-a", docVersion: 0 } as never);

  await createQuizEditorQuiz({
    categoryId: "topic-a",
    idempotencyKey: "idem-a",
    kind: "train",
    levelId: "level-a",
    questionIds: ["q-1", "q-2"],
    subjectId: "subject-a",
    title: "Quiz A",
  });

  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lcms/quizzes", expect.objectContaining({
    body: JSON.stringify({
      title: "Quiz A",
      subtitle: undefined,
      kind: "train",
      subjectId: "subject-a",
      levelId: "level-a",
      categoryId: "topic-a",
      questionIds: ["q-1", "q-2"],
    }),
    method: "POST",
    portal: "lcms",
  }));
});

test("deletes quiz through the BE authoring endpoint", async () => {
  apiRequestMock.mockResolvedValueOnce({ quizId: "quiz-a", deleted: true } as never);

  const result = await deleteQuizEditorQuiz("quiz-a");

  expect(result.deleted).toBe(true);
  expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lcms/quizzes/quiz-a", {
    method: "DELETE",
    portal: "lcms",
  });
});
