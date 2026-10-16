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
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";

export const QUESTION_BANK_WORKSPACE_STALE_TIME_MS = QUERY_POLICIES.reference.staleTime;
export const QUESTION_BANK_WORKSPACE_GC_TIME_MS = QUERY_POLICIES.reference.gcTime;

export const questionBankQueryKeys = {
  root: (tenantId: string = getDefaultTenantId()) => ["question-bank", tenantId] as const,
  workspace: (
    tenantId: string = getDefaultTenantId(),
    filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
  ) => [...questionBankQueryKeys.root(tenantId), "workspace", normalizeQuestionBankWorkspaceFilters(filters)] as const,
};

export function questionBankWorkspaceQueryOptions(
  tenantId: string = getDefaultTenantId(),
  filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
) {
  const fixtureBacked = runtimeFixturesEnabled();

  return {
    gcTime: QUESTION_BANK_WORKSPACE_GC_TIME_MS,
    ...(fixtureBacked ? { initialData: mockQuestionBankData, initialDataUpdatedAt: 0 } : {}),
    placeholderData: (previousData: ReturnType<typeof mockQuestionBankData> | undefined) =>
      previousData ?? (fixtureBacked ? mockQuestionBankData() : undefined),
    queryFn: ({ signal }: { signal: AbortSignal }) => loadQuestionBankData(tenantId, filters, signal),
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

export function useCreateQuestionBankQuestionMutation(tenantId: string = getDefaultTenantId()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuestionBankSaveQuestionInput) => createQuestionBankQuestion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root(tenantId) }),
  });
}

export function useUpdateQuestionBankQuestionMutation(tenantId: string = getDefaultTenantId()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuestionBankSaveQuestionInput) => updateQuestionBankQuestion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root(tenantId) }),
  });
}

export function useDeleteQuestionBankQuestionMutation(tenantId: string = getDefaultTenantId()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestionBankQuestion(questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root(tenantId) }),
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
