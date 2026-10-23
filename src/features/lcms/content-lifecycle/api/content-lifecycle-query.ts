import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { questionBankQueryKeys } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { quizEditorQueryKeys } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { queryKeys } from "@/lib/query-keys";
import {
  transitionContentLifecycle,
  type ContentLifecycleRequestContext,
  type TransitionContentLifecycleInput,
} from "@/features/lcms/content-lifecycle/api/content-lifecycle-api";
import type {
  ContentLifecycleScope,
  ContentLifecycleTransitionResult,
} from "@/features/lcms/content-lifecycle/types/content-lifecycle-types";

export const contentLifecycleQueryKeys = {
  root: (scope: ContentLifecycleScope) => [
    "content-lifecycle",
    scope.tenantId,
    scope.accountId,
    scope.workspace,
  ] as const,
  transition: (scope: ContentLifecycleScope, resourceKind: string, resourceId: string) => [
    ...contentLifecycleQueryKeys.root(scope),
    "transition",
    resourceKind,
    resourceId,
  ] as const,
};

export function createAdminContentLifecycleScope(): ContentLifecycleScope {
  return {
    tenantId: getDefaultTenantId(),
    accountId: getCurrentAccount("lcms")?.id?.trim() || "anonymous",
    workspace: "ADMIN",
    portal: "lcms",
  };
}

export function useContentLifecycleTransitionMutation(scope: ContentLifecycleScope) {
  const queryClient = useQueryClient();
  return useMutation<ContentLifecycleTransitionResult, Error, TransitionContentLifecycleInput>({
    mutationKey: contentLifecycleQueryKeys.root(scope),
    mutationFn: (input) => transitionContentLifecycle(input, contextFor(scope)),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.learningResourcesV2(scope.tenantId, scope.accountId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.learningResourcesWorkspace(120, scope.tenantId, scope.accountId) });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root(scope.tenantId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot(scope.tenantId) });
      void queryClient.invalidateQueries({ queryKey: contentLifecycleQueryKeys.transition(scope, variables.resourceKind, variables.resourceId) });
    },
  });
}

function contextFor(scope: ContentLifecycleScope, signal?: AbortSignal): ContentLifecycleRequestContext {
  return signal ? { portal: scope.portal, signal } : { portal: scope.portal };
}

