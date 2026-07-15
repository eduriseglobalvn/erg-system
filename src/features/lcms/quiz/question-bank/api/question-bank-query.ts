import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createQuestionBankQuestion,
  deleteQuestionBankQuestion,
  loadQuestionBankData,
  mockQuestionBankData,
  updateQuestionBankQuestion,
  type QuestionBankSaveQuestionInput,
  type QuestionBankWorkspaceInput,
} from "@/features/lcms/quiz/question-bank/api/question-bank-api";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";

export const QUESTION_BANK_WORKSPACE_STALE_TIME_MS = 5 * 60_000;
export const QUESTION_BANK_WORKSPACE_GC_TIME_MS = 30 * 60_000;

export const questionBankQueryKeys = {
  root: ["question-bank"] as const,
  workspace: (
    tenantId: string = getDefaultTenantId(),
    filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
  ) => [...questionBankQueryKeys.root, "workspace", tenantId, normalizeQuestionBankWorkspaceFilters(filters)] as const,
};

export function questionBankWorkspaceQueryOptions(
  tenantId: string = getDefaultTenantId(),
  filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
) {
  const apiBacked = hasApiBase();

  return {
    gcTime: QUESTION_BANK_WORKSPACE_GC_TIME_MS,
    ...(apiBacked ? {} : { initialData: mockQuestionBankData, initialDataUpdatedAt: 0 }),
    placeholderData: (previousData: ReturnType<typeof mockQuestionBankData> | undefined) =>
      previousData ?? (apiBacked ? undefined : mockQuestionBankData()),
    queryFn: () => loadQuestionBankData(tenantId, filters),
    queryKey: questionBankQueryKeys.workspace(tenantId, filters),
    refetchOnWindowFocus: false,
    staleTime: QUESTION_BANK_WORKSPACE_STALE_TIME_MS,
  };
}

export function useQuestionBankWorkspaceQuery(
  tenantId: string = getDefaultTenantId(),
  filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
) {
  return useQuery(questionBankWorkspaceQueryOptions(tenantId, filters));
}

export function useCreateQuestionBankQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuestionBankSaveQuestionInput) => createQuestionBankQuestion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root }),
  });
}

export function useUpdateQuestionBankQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuestionBankSaveQuestionInput) => updateQuestionBankQuestion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root }),
  });
}

export function useDeleteQuestionBankQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestionBankQuestion(questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root }),
  });
}

function normalizeQuestionBankWorkspaceFilters(filters: Omit<QuestionBankWorkspaceInput, "tenantId">) {
  return {
    includeQuestions: filters.includeQuestions ?? true,
    levelId: filters.levelId ?? "",
    page: Math.max(0, filters.page ?? 0),
    quizKind: filters.quizKind ?? "",
    search: filters.search?.trim() ?? "",
    size: Math.min(Math.max(filters.size ?? 50, 1), 50),
    status: filters.status ?? "",
    subjectId: filters.subjectId ?? "",
    topicId: filters.topicId ?? "",
  };
}
