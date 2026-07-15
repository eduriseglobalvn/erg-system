import { useQuery } from "@tanstack/react-query";

import {
  loadAssignmentReport,
  loadQuizQuestionAnalytics,
} from "@/features/lcms/quiz/quiz-reports/api/quiz-report-api";
import { getDefaultTenantId } from "@/lib/graphql-client";

export const QUIZ_REPORT_STALE_TIME_MS = 60_000;
export const QUIZ_REPORT_GC_TIME_MS = 30 * 60_000;

export const quizReportQueryKeys = {
  root: ["quiz-reports"] as const,
  reportTenantRoot: (tenantId: string = getDefaultTenantId()) => [...quizReportQueryKeys.root, tenantId] as const,
  assignmentReport: (assignmentId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizReportQueryKeys.reportTenantRoot(tenantId), "assignment-report", assignmentId] as const,
  questionAnalytics: (quizVersionId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizReportQueryKeys.reportTenantRoot(tenantId), "question-analytics", quizVersionId] as const,
};

export function quizQuestionAnalyticsQueryOptions(
  quizVersionId: string,
  tenantId: string = getDefaultTenantId(),
) {
  return {
    enabled: Boolean(quizVersionId),
    gcTime: QUIZ_REPORT_GC_TIME_MS,
    queryFn: () => loadQuizQuestionAnalytics({ quizVersionId, tenantId }),
    queryKey: quizReportQueryKeys.questionAnalytics(quizVersionId, tenantId),
    staleTime: QUIZ_REPORT_STALE_TIME_MS,
  };
}

export function assignmentReportQueryOptions(
  assignmentId: string,
  tenantId: string = getDefaultTenantId(),
) {
  return {
    enabled: Boolean(assignmentId),
    gcTime: QUIZ_REPORT_GC_TIME_MS,
    queryFn: () => loadAssignmentReport({ assignmentId, tenantId }),
    queryKey: quizReportQueryKeys.assignmentReport(assignmentId, tenantId),
    staleTime: QUIZ_REPORT_STALE_TIME_MS,
  };
}

export function useQuizQuestionAnalyticsQuery(
  quizVersionId: string,
  tenantId: string = getDefaultTenantId(),
) {
  return useQuery(quizQuestionAnalyticsQueryOptions(quizVersionId, tenantId));
}

export function useAssignmentReportQuery(
  assignmentId: string,
  tenantId: string = getDefaultTenantId(),
) {
  return useQuery(assignmentReportQueryOptions(assignmentId, tenantId));
}
