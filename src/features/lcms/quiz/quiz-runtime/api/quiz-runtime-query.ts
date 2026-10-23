import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getQuizPackage,
  saveAttemptAnswer,
  saveAttemptDraft,
  syncAttempt,
} from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-api";
import type { QuizRuntimePortal } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

export const QUIZ_RUNTIME_PACKAGE_STALE_TIME_MS = QUERY_POLICIES.offlineCore.staleTime;
export const QUIZ_RUNTIME_PACKAGE_GC_TIME_MS = QUERY_POLICIES.offlineCore.gcTime;

export const quizRuntimeQueryKeys = {
  root: ["quiz-runtime"] as const,
  packageRoot: (tenantId: string = getDefaultTenantId()) => [...quizRuntimeQueryKeys.root, "package", tenantId] as const,
  package: (portal: QuizRuntimePortal, quizId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizRuntimeQueryKeys.packageRoot(tenantId), portal, quizId] as const,
};

export const quizRuntimeMutationKeys = {
  saveDraft: [...quizRuntimeQueryKeys.root, "mutation", "attempt-draft"] as const,
  saveAnswer: [...quizRuntimeQueryKeys.root, "mutation", "attempt-answer"] as const,
  syncAttempt: [...quizRuntimeQueryKeys.root, "mutation", "attempt-sync"] as const,
};

export function quizPackageQueryOptions(
  quizId: string,
  portal: QuizRuntimePortal = "elearning",
  tenantId: string = getDefaultTenantId(),
) {
  return {
    enabled: Boolean(quizId),
    gcTime: QUIZ_RUNTIME_PACKAGE_GC_TIME_MS,
    queryFn: ({ signal }: { signal: AbortSignal }) => getQuizPackage(quizId, portal, tenantId, signal),
    queryKey: quizRuntimeQueryKeys.package(portal, quizId, tenantId),
    staleTime: QUIZ_RUNTIME_PACKAGE_STALE_TIME_MS,
  };
}

export function useQuizPackageQuery(
  quizId: string,
  portal: QuizRuntimePortal = "elearning",
  tenantId: string = getDefaultTenantId(),
) {
  return useQuery(quizPackageQueryOptions(quizId, portal, tenantId));
}

export function useSaveAttemptDraftMutation() {
  return useMutation({
    meta: {
      feature: "quiz-runtime",
      persistence: "debounced-draft",
    },
    mutationFn: saveAttemptDraft,
    mutationKey: quizRuntimeMutationKeys.saveDraft,
  });
}

export function useSaveAttemptAnswerMutation() {
  return useMutation({
    meta: {
      feature: "quiz-runtime",
      persistence: "training-answer",
    },
    mutationFn: saveAttemptAnswer,
    mutationKey: quizRuntimeMutationKeys.saveAnswer,
  });
}

export function useSyncAttemptMutation() {
  return useMutation({
    meta: {
      feature: "quiz-runtime",
      persistence: "offline-replay",
    },
    mutationFn: syncAttempt,
    mutationKey: quizRuntimeMutationKeys.syncAttempt,
  });
}
