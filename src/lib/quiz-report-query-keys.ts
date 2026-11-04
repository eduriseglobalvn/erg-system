import { getDefaultTenantId } from "@/lib/graphql-client";

export const quizReportQueryKeys = {
  root: ["quiz-reports"] as const,
  reportTenantRoot: (tenantId: string = getDefaultTenantId()) => [...quizReportQueryKeys.root, tenantId] as const,
  assignmentReport: (assignmentId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizReportQueryKeys.reportTenantRoot(tenantId), "assignment-report", assignmentId] as const,
  questionAnalytics: (quizVersionId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizReportQueryKeys.reportTenantRoot(tenantId), "question-analytics", quizVersionId] as const,
};
