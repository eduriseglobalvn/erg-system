import { beforeEach, describe, expect, test, vi } from "vitest";

import { hasApiBase } from "@/lib/api-client";

import {
  QUESTION_BANK_WORKSPACE_GC_TIME_MS,
  QUESTION_BANK_WORKSPACE_STALE_TIME_MS,
  questionBankWorkspaceQueryOptions,
} from "@/features/lcms/quiz/question-bank/api/question-bank-query";

vi.mock("@/lib/api-client", () => ({
  hasApiBase: vi.fn(),
}));

const hasApiBaseMock = vi.mocked(hasApiBase);

const defaultFilterKey = {
  includeQuestions: true,
  levelId: "",
  page: 0,
  quizKind: "",
  search: "",
  size: 50,
  status: "",
  subjectId: "",
  topicId: "",
};

describe("questionBankWorkspaceQueryOptions", () => {
  beforeEach(() => {
    hasApiBaseMock.mockReset();
  });

  test("keeps local question-bank fallback and cache policy when API is not configured", () => {
    hasApiBaseMock.mockReturnValue(false);

    const options = questionBankWorkspaceQueryOptions("tenant-a");
    const initialData =
      typeof options.initialData === "function" ? options.initialData() : options.initialData;

    expect(options.queryKey).toEqual(["question-bank", "workspace", "tenant-a", defaultFilterKey]);
    expect(options.staleTime).toBe(QUESTION_BANK_WORKSPACE_STALE_TIME_MS);
    expect(options.gcTime).toBe(QUESTION_BANK_WORKSPACE_GC_TIME_MS);
    expect(options.initialDataUpdatedAt).toBe(0);
    expect(initialData.questions.length).toBeGreaterThan(0);
    expect(initialData.quizzes.length).toBeGreaterThan(0);
    expect(initialData.subjects.length).toBeGreaterThan(0);
    expect(options.placeholderData(undefined)).toEqual(initialData);
  });

  test("does not seed mock question-bank data into API-backed workspaces", () => {
    hasApiBaseMock.mockReturnValue(true);

    const options = questionBankWorkspaceQueryOptions("tenant-a");
    const previousData = {
      questions: [],
      questionPage: { page: 0, size: 50, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      quizzes: [],
      subjects: [],
    };

    expect(options.queryKey).toEqual(["question-bank", "workspace", "tenant-a", defaultFilterKey]);
    expect(options.staleTime).toBe(QUESTION_BANK_WORKSPACE_STALE_TIME_MS);
    expect(options.gcTime).toBe(QUESTION_BANK_WORKSPACE_GC_TIME_MS);
    expect("initialData" in options).toBe(false);
    expect("initialDataUpdatedAt" in options).toBe(false);
    expect(options.placeholderData(undefined)).toBeUndefined();
    expect(options.placeholderData(previousData)).toBe(previousData);
  });

  test("keeps filter values in the cache key for scoped editor lookups", () => {
    hasApiBaseMock.mockReturnValue(true);

    const options = questionBankWorkspaceQueryOptions("tenant-a", {
      levelId: "ic3-l1",
      includeQuestions: false,
      page: 0,
      search: " online ",
      quizKind: "test",
      size: 20,
      status: "ready",
      subjectId: "ic3-gs6",
      topicId: "ic3-l1-topic-7",
    });

    expect(options.queryKey).toEqual([
      "question-bank",
      "workspace",
      "tenant-a",
      {
        includeQuestions: false,
        levelId: "ic3-l1",
        page: 0,
        quizKind: "test",
        search: "online",
        size: 20,
        status: "ready",
        subjectId: "ic3-gs6",
        topicId: "ic3-l1-topic-7",
      },
    ]);
  });
});
