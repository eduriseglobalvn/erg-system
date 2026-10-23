import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  graphQlRequest: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest: mocks.apiRequest,
  hasApiBase: () => true,
}));

vi.mock("@/lib/graphql-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/graphql-client")>()),
  getDefaultTenantId: () => "tenant-a",
  graphQlRequest: mocks.graphQlRequest,
}));

import { questionBankWorkspaceQueryOptions } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { loadQuestionBankData } from "@/features/lcms/quiz/question-bank/api/question-bank-api";
import {
  loadQuizEditorDraft,
  loadQuizEditorVersions,
  loadQuizEditorWorkspace,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  quizEditorDraftQueryOptions,
  quizEditorVersionsQueryOptions,
  quizEditorWorkspaceQueryOptions,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import {
  assignmentReportQueryOptions,
  quizQuestionAnalyticsQueryOptions,
} from "@/features/lcms/quiz/quiz-reports/api/quiz-report-query";
import {
  loadAssignmentReport,
  loadQuizQuestionAnalytics,
} from "@/features/lcms/quiz/quiz-reports/api/quiz-report-api";
import {
  getSchoolDirectory,
  getSchoolOperations,
} from "@/features/lcms/school-management/api/school-management-api";
import { loadAccessManagementWorkspace } from "@/features/lcms/admin-operations/api/access-management-api";
import { loadLearningResourceStudioWorkspaceData } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";

describe("LCMS query cancellation boundary", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.graphQlRequest.mockReset();
  });

  test.each([
    ["question bank", () => questionBankWorkspaceQueryOptions("tenant-a")],
    ["quiz editor workspace", () => quizEditorWorkspaceQueryOptions({ tenantId: "tenant-a" })],
    ["quiz editor draft", () => quizEditorDraftQueryOptions("quiz-a", "tenant-a")],
    ["quiz editor versions", () => quizEditorVersionsQueryOptions("quiz-a", "tenant-a")],
    ["quiz question analytics", () => quizQuestionAnalyticsQueryOptions("version-a", "tenant-a")],
    ["quiz assignment report", () => assignmentReportQueryOptions("assignment-a", "tenant-a")],
  ])("forwards the exact signal for %s", async (_name, createOptions) => {
    const expectedError = new Error("transport stopped");
    const controller = new AbortController();
    mocks.graphQlRequest.mockRejectedValueOnce(expectedError);

    const options = createOptions();
    await expect(options.queryFn({ signal: controller.signal } as never)).rejects.toBe(expectedError);

    expect(mocks.graphQlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  test.each([
    ["question bank", () => loadQuestionBankData("tenant-a")],
    ["quiz editor workspace", () => loadQuizEditorWorkspace({ tenantId: "tenant-a" })],
    ["quiz editor draft", () => loadQuizEditorDraft("quiz-a")],
    ["quiz editor versions", () => loadQuizEditorVersions("quiz-a")],
    ["quiz question analytics", () => loadQuizQuestionAnalytics({ quizVersionId: "version-a", tenantId: "tenant-a" })],
    ["quiz assignment report", () => loadAssignmentReport({ assignmentId: "assignment-a", tenantId: "tenant-a" })],
    ["school directory", () => getSchoolDirectory()],
    ["school operations", () => getSchoolOperations("school-a")],
    ["access workspace", () => loadAccessManagementWorkspace()],
    ["learning-resource authoring", () => loadLearningResourceStudioWorkspaceData()],
  ])("normalizes malformed %s payloads at the transport boundary", async (_name, load) => {
    mocks.graphQlRequest.mockResolvedValueOnce({});

    await expect(load()).rejects.toMatchObject({ code: "INVALID_RESPONSE_SHAPE" });
  });
});
