import { describe, expect, test } from "vitest";

import {
  mapAssignmentReportRows,
  resolveSelectedQuizVersionId,
  summarizeQuestionAnalytics,
} from "@/features/lms/components/homework-progress-page";
import type { AssignmentReport } from "@/features/lcms/quiz/quiz-reports";

describe("mapAssignmentReportRows", () => {
  test("maps BE assignment report rows into the existing homework progress table shape", () => {
    const report: AssignmentReport = {
      assignmentId: "assignment-a",
      averagePercent: 80,
      inProgressCount: 1,
      needsReviewCount: 1,
      notStartedCount: 1,
      students: [
        {
          answeredCount: 10,
          passed: true,
          percentComplete: 100,
          score: 92.4,
          status: "submitted",
          studentName: "Learner Done",
          studentUserId: "student-done",
          submittedAt: "2026-07-09T09:00:00Z",
          totalQuestions: 10,
        },
        {
          answeredCount: 3,
          percentComplete: 30,
          score: null,
          status: "in_progress",
          studentName: "Learner Working",
          studentUserId: "student-working",
          totalQuestions: 10,
        },
        {
          answeredCount: 0,
          status: "not_started",
          studentName: "Learner New",
          studentUserId: "student-new",
          totalQuestions: 10,
        },
      ],
      submittedCount: 1,
      totalRecipients: 3,
    };

    const rows = mapAssignmentReportRows(report, { className: "IC3 A" } as never);

    expect(rows).toEqual([
      expect.objectContaining({
        className: "IC3 A",
        id: "student-done",
        name: "Learner Done",
        progress: 100,
        score: 92,
        status: "completed",
      }),
      expect.objectContaining({
        id: "student-working",
        progress: 30,
        score: null,
        status: "inprogress",
      }),
      expect.objectContaining({
        id: "student-new",
        progress: 0,
        status: "notstarted",
      }),
    ]);
  });
});

describe("quiz analytics helpers", () => {
  test("resolves pinned quiz version from selected run before workspace resources", () => {
    expect(
      resolveSelectedQuizVersionId(
        { id: "assignment-a", quizVersionId: "version-run" } as never,
        {
          assignment: {
            resources: [{ quizId: "quiz-a", quizVersionId: "version-workspace", orderIndex: 0 }],
          },
        } as never,
      ),
    ).toBe("version-run");
  });

  test("summarizes question analytics for the existing overview surface", () => {
    expect(
      summarizeQuestionAnalytics({
        quizVersionId: "version-a",
        questions: [
          {
            answeredCount: 10,
            averageAwardedPoints: 1,
            correctCount: 8,
            correctRate: 80,
            maxPoints: 1,
            partialCount: 1,
            questionKind: "single_choice",
            quizVersionQuestionId: "q1",
          },
          {
            answeredCount: 0,
            averageAwardedPoints: 0,
            correctCount: 0,
            correctRate: 20,
            maxPoints: 1,
            partialCount: 0,
            questionKind: "single_choice",
            quizVersionQuestionId: "q2",
          },
        ],
      }),
    ).toEqual({ averageCorrectRate: 80, questionCount: 2 });
  });
});
