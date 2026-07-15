import { describe, expect, test } from "vitest";

import {
  QUIZ_REPORT_GC_TIME_MS,
  QUIZ_REPORT_STALE_TIME_MS,
  assignmentReportQueryOptions,
  quizQuestionAnalyticsQueryOptions,
  quizReportQueryKeys,
} from "@/features/lcms/quiz/quiz-reports/api/quiz-report-query";

describe("quiz report query options", () => {
  test("scopes report caches by tenant and report id", () => {
    expect(quizReportQueryKeys.reportTenantRoot("tenant-a")).toEqual([
      "quiz-reports",
      "tenant-a",
    ]);
    expect(quizReportQueryKeys.questionAnalytics("version-a", "tenant-a")).toEqual([
      "quiz-reports",
      "tenant-a",
      "question-analytics",
      "version-a",
    ]);
    expect(quizReportQueryKeys.assignmentReport("assignment-a", "tenant-a")).toEqual([
      "quiz-reports",
      "tenant-a",
      "assignment-report",
      "assignment-a",
    ]);
  });

  test("uses short-lived report cache policy", () => {
    const questionOptions = quizQuestionAnalyticsQueryOptions("version-a", "tenant-a");
    const assignmentOptions = assignmentReportQueryOptions("assignment-a", "tenant-a");

    expect(questionOptions.queryKey).toEqual([
      "quiz-reports",
      "tenant-a",
      "question-analytics",
      "version-a",
    ]);
    expect(assignmentOptions.queryKey).toEqual([
      "quiz-reports",
      "tenant-a",
      "assignment-report",
      "assignment-a",
    ]);
    expect(questionOptions.staleTime).toBe(QUIZ_REPORT_STALE_TIME_MS);
    expect(assignmentOptions.staleTime).toBe(QUIZ_REPORT_STALE_TIME_MS);
    expect(questionOptions.gcTime).toBe(QUIZ_REPORT_GC_TIME_MS);
    expect(assignmentOptions.gcTime).toBe(QUIZ_REPORT_GC_TIME_MS);
  });
});
