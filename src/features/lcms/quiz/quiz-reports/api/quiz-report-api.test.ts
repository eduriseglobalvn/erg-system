import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  loadAssignmentReport,
  loadQuizQuestionAnalytics,
} from "@/features/lcms/quiz/quiz-reports/api/quiz-report-api";
import { graphQlRequest } from "@/lib/graphql-client";

vi.mock("@/lib/api-client", () => ({
  hasApiBase: () => true,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-a",
  graphQlRequest: vi.fn(),
}));

const graphQlRequestMock = vi.mocked(graphQlRequest);

describe("quiz report API", () => {
  beforeEach(() => {
    graphQlRequestMock.mockReset();
  });

  test("loads per-question analytics from LCMS GraphQL", async () => {
    graphQlRequestMock.mockResolvedValueOnce({
      lcms: {
        quizQuestionAnalytics: {
          quizVersionId: "version-a",
          questions: [
            {
              quizVersionQuestionId: "qv-1",
              questionKind: "single_choice",
              answeredCount: 12,
              correctCount: 9,
              partialCount: 1,
              correctRate: 0.75,
              averageAwardedPoints: 0.8,
              maxPoints: 1,
            },
          ],
        },
      },
    } as never);

    const report = await loadQuizQuestionAnalytics({
      quizVersionId: "version-a",
      tenantId: "tenant-a",
    });

    expect(report.questions).toHaveLength(1);
    expect(report.questions[0]).toMatchObject({
      quizVersionQuestionId: "qv-1",
      correctRate: 0.75,
    });
    expect(graphQlRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        operationName: "LcmsQuizQuestionAnalytics",
        portal: "lcms",
        tenantId: "tenant-a",
        variables: { quizVersionId: "version-a" },
      }),
    );
  });

  test("loads assignment progress report from LCMS GraphQL", async () => {
    graphQlRequestMock.mockResolvedValueOnce({
      lcms: {
        assignmentReport: {
          assignmentId: "assignment-a",
          totalRecipients: 30,
          submittedCount: 18,
          inProgressCount: 7,
          notStartedCount: 5,
          needsReviewCount: 2,
          averagePercent: 81.5,
          students: [
            {
              studentUserId: "student-a",
              studentName: "Learner A",
              status: "submitted",
              answeredCount: 14,
              totalQuestions: 14,
              percentComplete: 100,
              score: 11.5,
              passed: true,
              submittedAt: "2026-07-09T09:00:00Z",
            },
          ],
        },
      },
    } as never);

    const report = await loadAssignmentReport({
      assignmentId: "assignment-a",
      tenantId: "tenant-a",
    });

    expect(report.totalRecipients).toBe(30);
    expect(report.students[0]).toMatchObject({
      studentUserId: "student-a",
      passed: true,
      score: 11.5,
    });
    expect(graphQlRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        operationName: "LcmsAssignmentReport",
        portal: "lcms",
        tenantId: "tenant-a",
        variables: { assignmentId: "assignment-a" },
      }),
    );
  });

  test("propagates API-enabled GraphQL failures instead of returning mock report data", async () => {
    graphQlRequestMock.mockRejectedValueOnce(new Error("permission denied"));

    await expect(
      loadAssignmentReport({
        assignmentId: "assignment-a",
        tenantId: "tenant-a",
      }),
    ).rejects.toThrow("permission denied");
  });
});
