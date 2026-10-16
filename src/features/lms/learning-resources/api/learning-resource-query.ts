import { keepPreviousData } from "@tanstack/react-query";

import {
  loadLearningResourceLibraryBootstrap,
  loadLearningResourceLibraryProgress,
} from "@/features/lms/learning-resources/api/learning-resource-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

export type LearningResourceLibraryScope = {
  accountId?: string | null;
  academicYear: string;
  schoolId: string;
  tenantId?: string | null;
};

function normalizeLibraryTenant(tenantId: LearningResourceLibraryScope["tenantId"]) {
  return tenantId?.trim() || getDefaultTenantId();
}

function normalizeLibraryAccount(accountId: LearningResourceLibraryScope["accountId"]) {
  return accountId?.trim() || "anonymous";
}

export const learningResourceLibraryQueryKeys = {
  root: ["learning-resources"] as const,
  bootstrap: ({ accountId, academicYear, schoolId, tenantId }: LearningResourceLibraryScope) =>
    [
      ...learningResourceLibraryQueryKeys.root,
      "library-bootstrap",
      normalizeLibraryTenant(tenantId),
      normalizeLibraryAccount(accountId),
      schoolId,
      academicYear,
    ] as const,
  progress: ({ accountId, academicYear, schoolId, tenantId }: LearningResourceLibraryScope) =>
    [
      ...learningResourceLibraryQueryKeys.root,
      "library-progress",
      normalizeLibraryTenant(tenantId),
      normalizeLibraryAccount(accountId),
      schoolId,
      academicYear,
    ] as const,
};

export function learningResourceLibraryBootstrapQueryOptions(scope: LearningResourceLibraryScope) {
  const { academicYear, schoolId } = scope;
  const tenantId = normalizeLibraryTenant(scope.tenantId);
  return {
    queryKey: learningResourceLibraryQueryKeys.bootstrap(scope),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      loadLearningResourceLibraryBootstrap({ schoolId, academicYear, tenantId }, signal),
    enabled: Boolean(schoolId),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  };
}

export function learningResourceLibraryProgressQueryOptions(scope: LearningResourceLibraryScope) {
  const { academicYear, schoolId } = scope;
  const tenantId = normalizeLibraryTenant(scope.tenantId);
  return {
    queryKey: learningResourceLibraryQueryKeys.progress(scope),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      loadLearningResourceLibraryProgress({ schoolId, academicYear, tenantId }, signal),
    enabled: Boolean(schoolId),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  };
}
