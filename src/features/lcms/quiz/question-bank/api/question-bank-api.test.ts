import { beforeEach, describe, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import { graphQlRequest } from "@/lib/graphql-client";
import {
  createQuestionBankQuestion,
  deleteQuestionBankQuestion,
  loadQuestionBankData,
  updateQuestionBankQuestion,
} from "@/features/lcms/quiz/question-bank/api/question-bank-api";

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

function workspace(overrides: Record<string, unknown> = {}) {
  return {
    lcms: {
      questionBankWorkspace: {
        tenantId: "tenant-a",
        questions: {
          items: [],
          page: 0,
          size: 50,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
        subjects: [],
        levels: [],
        topics: [],
        quizzes: [],
        ...overrides,
      },
    },
  };
}

describe("loadQuestionBankData", () => {
  beforeEach(() => {
    graphQlRequestMock.mockReset();
    apiRequestMock.mockReset();
  });

  test("does not replace an API-enabled empty BE workspace with mock question-bank data", async () => {
    graphQlRequestMock.mockResolvedValueOnce(workspace() as never);

    const data = await loadQuestionBankData("tenant-a");

    expect(data.questions).toEqual([]);
    expect(data.quizzes).toEqual([]);
    expect(data.subjects).toEqual([]);
  });

  test("enriches BE question IDs from local templates without inventing extra mock rows", async () => {
    graphQlRequestMock.mockResolvedValueOnce(
      workspace({
        questions: {
          items: [
            {
              id: "qb-ic3-001",
              scopeType: "school",
              scopeId: "school-alpha",
              scopeLabel: "ERG Alpha",
              subjectId: "ic3-gs6",
              subjectLabel: "BE IC3",
              levelId: "ic3-l1",
              levelLabel: "BE Level 1",
              topicId: "ic3-l1-topic-1",
              categoryLabel: "BE Topic 1",
              gradeLabel: "BE Grade 6",
              title: "BE title",
              objective: "BE objective",
              type: "multiple_choice",
              difficulty: "challenge",
              status: "ready",
              tags: ["be-tag", "ic3"],
              choices: [{ id: "a", label: "BE choice", correct: true }],
              answer: "BE answer",
              masteryRate: 91,
              usageCount: 12,
              schoolsUsing: 6,
              lastUsedAt: "2026-07-09T10:00:00.000Z",
              recommendedCluster: "BE Cluster",
              rationale: "BE rationale",
            },
          ],
          page: 0,
          size: 50,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        subjects: [{ id: "ic3-gs6", label: "IC3 GS6" }],
        levels: [{ id: "ic3-l1", label: "Level 1" }],
        topics: [{ id: "ic3-l1-topic-1", label: "Topic 1" }],
        quizzes: [],
      }) as never,
    );

    const data = await loadQuestionBankData("tenant-a");

    expect(data.questions).toHaveLength(1);
    expect(data.questions[0]).toMatchObject({
      id: "qb-ic3-001",
      stem: "BE title",
      objective: "BE objective",
      difficulty: "challenge",
      subjectId: "ic3-gs6",
      levelId: "ic3-l1",
      categoryId: "ic3-l1-topic-1",
      tags: ["be-tag", "ic3"],
      answer: "BE answer",
      masteryRate: 91,
      usageCount: 12,
      schoolsUsing: 6,
      subjectLabel: "BE IC3",
      levelLabel: "BE Level 1",
      categoryLabel: "BE Topic 1",
      gradeLabel: "BE Grade 6",
      recommendedCluster: "BE Cluster",
      rationale: "BE rationale",
    });
    expect(data.questions[0]?.scope).toEqual({ type: "center", centerId: "school-alpha", centerName: "ERG Alpha" });
    expect(data.questions[0]?.choices).toEqual([{ id: "a", label: "BE choice", correct: true }]);
    expect(data.quizzes).toEqual([]);
  });

  test("maps quiz-bank composition from BE metadata instead of guessing from local templates", async () => {
    graphQlRequestMock.mockResolvedValueOnce(
      workspace({
        questions: {
          items: [
            {
              id: "qb-ic3-006",
              subjectId: "ic3-gs6",
              levelId: "ic3-l2",
              topicId: "ic3-l2-topic-2",
              title: "Excel formula",
              type: "multiple_choice",
              status: "ready",
              usageCount: 7,
            },
          ],
          page: 0,
          size: 50,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        subjects: [{ id: "ic3-gs6", label: "IC3 GS6" }],
        levels: [{ id: "ic3-l2", label: "Level 2" }],
        topics: [{ id: "ic3-l2-topic-2", label: "Excel nhập môn" }],
        quizzes: [
          {
            id: "quiz-ic3-l2-excel-test",
            title: "BE Excel test",
            status: "ready",
            kind: "test",
            subjectId: "ic3-gs6",
            levelId: "ic3-l2",
            categoryId: "ic3-l2-topic-2",
            questionIds: ["qb-ic3-006"],
          },
        ],
      }) as never,
    );

    const data = await loadQuestionBankData("tenant-a");

    expect(data.quizzes).toHaveLength(1);
    expect(data.quizzes[0]).toMatchObject({
      id: "quiz-ic3-l2-excel-test",
      title: "BE Excel test",
      kind: "test",
      status: "ready",
      subjectId: "ic3-gs6",
      levelId: "ic3-l2",
      categoryId: "ic3-l2-topic-2",
      questionIds: ["qb-ic3-006"],
      questionCount: 1,
    });
    expect(data.quizzes[0]?.topicLabels).toEqual(["Excel nhập môn"]);
  });
  test("uses BE taxonomy descriptions, scope labels, and level category IDs", async () => {
    graphQlRequestMock.mockResolvedValueOnce(
      workspace({
        questions: {
          items: [],
          page: 0,
          size: 50,
          totalItems: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        subjects: [{ id: "python", label: "Python", description: "BE Python subject", scopeLabel: "Company Python" }],
        levels: [{ id: "python-foundation", label: "Foundation", subjectId: "python", description: "BE Python Foundation", categoryIds: ["python-foundation-topic-1"] }],
        topics: [{ id: "python-foundation-topic-1", label: "Variables", levelId: "python-foundation", description: "BE Variables" }],
        quizzes: [],
      }) as never,
    );

    const data = await loadQuestionBankData("tenant-a");

    expect(data.subjects).toEqual([
      expect.objectContaining({
        id: "python",
        description: "BE Python subject",
        companyScopeLabel: "Company Python",
        levels: [expect.objectContaining({ id: "python-foundation", description: "BE Python Foundation", categoryIds: ["python-foundation-topic-1"] })],
        categories: [expect.objectContaining({ id: "python-foundation-topic-1", label: "Variables", levelId: "python-foundation" })],
      }),
    ]);
  });

  test("passes scoped filters to the GraphQL question-bank workspace query", async () => {
    graphQlRequestMock.mockResolvedValueOnce(workspace() as never);

    await loadQuestionBankData("tenant-a", {
      includeQuestions: false,
      levelId: "ic3-l1",
      page: 0,
      quizKind: "test",
      search: " excel ",
      size: 20,
      status: "ready",
      subjectId: "ic3-gs6",
      topicId: "ic3-l1-topic-7",
    });

    expect(graphQlRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        operationName: "LcmsQuestionBankWorkspace",
        variables: {
          input: {
            includeQuestions: false,
            levelId: "ic3-l1",
            page: 0,
            quizKind: "test",
            search: "excel",
            size: 20,
            status: "ready",
            subjectId: "ic3-gs6",
            tenantId: "tenant-a",
            topicId: "ic3-l1-topic-7",
          },
        },
      }),
    );
  });

  test("keeps question-bank reads paged instead of fetching every remaining page", async () => {
    graphQlRequestMock.mockResolvedValueOnce(
      workspace({
        questions: {
          items: [{ id: "qb-ic3-001", subjectId: "ic3-gs6", levelId: "ic3-l1", topicId: "ic3-topic", title: "First page question" }],
          page: 0,
          size: 1,
          totalItems: 3,
          totalPages: 3,
          hasNext: true,
          hasPrevious: false,
        },
        subjects: [{ id: "ic3-gs6", label: "IC3 GS6" }],
        levels: [{ id: "ic3-l1", label: "Level 1" }],
        topics: [{ id: "ic3-topic", label: "Topic", levelId: "ic3-l1" }],
      }) as never,
    );

    const data = await loadQuestionBankData("tenant-a", { size: 1 });

    expect(graphQlRequestMock).toHaveBeenCalledTimes(1);
    expect(data.questions).toHaveLength(1);
    expect(data.questionPage).toMatchObject({ page: 0, size: 1, totalItems: 3, totalPages: 3, hasNext: true });
  });

  test("creates, updates, and archives questions through LCMS REST authoring APIs", async () => {
    apiRequestMock
      .mockResolvedValueOnce({ questionId: "question-1", status: "ready" } as never)
      .mockResolvedValueOnce({ questionId: "question-1", status: "reviewing" } as never)
      .mockResolvedValueOnce({ questionId: "question-1", archived: true } as never);

    const payload = {
      subjectId: "ic3-gs6",
      levelId: "ic3-l1",
      topicId: "ic3-hardware",
      type: "multiple-choice",
      stem: "What is a CPU?",
      difficulty: "core" as const,
      status: "ready" as const,
      tags: ["hardware"],
      choices: [{ id: "a", label: "Processor", correct: true }],
      answer: "a",
      settings: { shuffleChoices: false },
    };

    await createQuestionBankQuestion(payload);
    await updateQuestionBankQuestion({ ...payload, questionId: "question-1", status: "reviewing" });
    await deleteQuestionBankQuestion("question-1");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/v1/lcms/questions", expect.objectContaining({ method: "POST", portal: "lcms" }));
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/v1/lcms/questions/question-1", expect.objectContaining({ method: "PUT", portal: "lcms" }));
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/v1/lcms/questions/question-1", expect.objectContaining({ method: "DELETE", portal: "lcms" }));
    expect(JSON.parse(String(apiRequestMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      subjectId: "ic3-gs6",
      levelId: "ic3-l1",
      topicId: "ic3-hardware",
      stem: "What is a CPU?",
      settings: { shuffleChoices: false },
    });
  });
});
