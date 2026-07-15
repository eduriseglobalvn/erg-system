import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";

export type QuizQuestionAnalyticsRow = {
  quizVersionQuestionId: string;
  questionKind?: string | null;
  answeredCount: number;
  correctCount: number;
  partialCount: number;
  correctRate: number;
  averageAwardedPoints: number;
  maxPoints: number;
};

export type QuizQuestionAnalyticsReport = {
  quizVersionId: string;
  questions: QuizQuestionAnalyticsRow[];
};

export type AssignmentReportStudentRow = {
  studentUserId: string;
  studentName?: string | null;
  status?: string | null;
  answeredCount: number;
  totalQuestions: number;
  percentComplete?: number | null;
  score?: number | null;
  passed?: boolean | null;
  submittedAt?: string | null;
};

export type AssignmentReport = {
  assignmentId: string;
  totalRecipients: number;
  submittedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  needsReviewCount: number;
  averagePercent: number;
  students: AssignmentReportStudentRow[];
};

type QuizQuestionAnalyticsResponse = {
  lcms: {
    quizQuestionAnalytics: QuizQuestionAnalyticsReport;
  };
};

type AssignmentReportResponse = {
  lcms: {
    assignmentReport: AssignmentReport;
  };
};

const QuizQuestionAnalyticsDocument = `
query LcmsQuizQuestionAnalytics($quizVersionId: String!) {
  lcms {
    quizQuestionAnalytics(quizVersionId: $quizVersionId) {
      quizVersionId
      questions {
        quizVersionQuestionId
        questionKind
        answeredCount
        correctCount
        partialCount
        correctRate
        averageAwardedPoints
        maxPoints
      }
    }
  }
}
`;

const AssignmentReportDocument = `
query LcmsAssignmentReport($assignmentId: String!) {
  lcms {
    assignmentReport(assignmentId: $assignmentId) {
      assignmentId
      totalRecipients
      submittedCount
      inProgressCount
      notStartedCount
      needsReviewCount
      averagePercent
      students {
        studentUserId
        studentName
        status
        answeredCount
        totalQuestions
        percentComplete
        score
        passed
        submittedAt
      }
    }
  }
}
`;

export async function loadQuizQuestionAnalytics(input: {
  quizVersionId: string;
  tenantId?: string;
}): Promise<QuizQuestionAnalyticsReport> {
  const tenantId = input.tenantId ?? getDefaultTenantId();
  if (!hasApiBase()) {
    return {
      quizVersionId: input.quizVersionId,
      questions: [],
    };
  }

  const response = await graphQlRequest<QuizQuestionAnalyticsResponse, { quizVersionId: string }>({
    operationName: "LcmsQuizQuestionAnalytics",
    portal: "lcms",
    query: QuizQuestionAnalyticsDocument,
    tenantId,
    variables: { quizVersionId: input.quizVersionId },
  });

  return response.lcms.quizQuestionAnalytics;
}

export async function loadAssignmentReport(input: {
  assignmentId: string;
  tenantId?: string;
}): Promise<AssignmentReport> {
  const tenantId = input.tenantId ?? getDefaultTenantId();
  if (!hasApiBase()) {
    return {
      assignmentId: input.assignmentId,
      averagePercent: 0,
      inProgressCount: 0,
      needsReviewCount: 0,
      notStartedCount: 0,
      students: [],
      submittedCount: 0,
      totalRecipients: 0,
    };
  }

  const response = await graphQlRequest<AssignmentReportResponse, { assignmentId: string }>({
    operationName: "LcmsAssignmentReport",
    portal: "lcms",
    query: AssignmentReportDocument,
    tenantId,
    variables: { assignmentId: input.assignmentId },
  });

  return response.lcms.assignmentReport;
}
