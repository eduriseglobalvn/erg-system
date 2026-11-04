import { useQuery } from "@tanstack/react-query";

import {
  loadAssignmentReport,
  loadQuizQuestionAnalytics,
} from "@/features/lcms/quiz/quiz-reports/api/quiz-report-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { quizReportQueryKeys } from "@/lib/quiz-report-query-keys";

export const QUIZ_REPORT_STALE_TIME_MS = 60_000;
export const QUIZ_REPORT_GC_TIME_MS = 30 * 60_000;

export { quizReportQueryKeys };

export function quizQuestionAnalyticsQueryOptions(
  quizVersionId: string,
  tenantId: string = getDefaultTenantId(),
) {
  return {
    enabled: Boolean(quizVersionId),
    gcTime: QUIZ_REPORT_GC_TIME_MS,
    queryFn: ({ signal }: { signal: AbortSignal }) => loadQuizQuestionAnalytics({ quizVersionId, tenantId }, signal),
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
    queryFn: ({ signal }: { signal: AbortSignal }) => loadAssignmentReport({ assignmentId, tenantId }, signal),
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
