import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  commitQuizEditorMedia,
  createQuizEditorQuiz,
  deleteQuizEditorQuiz,
  exportQuizEditorBundle,
  forkQuizEditorVersion,
  loadQuizEditorDraft,
  loadQuizEditorVersions,
  loadQuizEditorWorkspace,
  presignQuizEditorMedia,
  publishQuizEditorDraft,
  reorderQuizEditorSlides,
  saveQuizEditorDraft,
  upsertQuizEditorSlide,
  validateQuizEditorDraft,
  type QuizEditorCreateInput,
  type QuizEditorMediaCommitInput,
  type QuizEditorMediaPresignInput,
  type QuizEditorPublishInput,
  type QuizEditorReorderInput,
  type QuizEditorSaveDraftInput,
  type QuizEditorUpsertSlideInput,
  type QuizEditorWorkspaceInput,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { questionBankQueryKeys } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import {
  clearNormalizedQuizPackageCache,
  quizRuntimeQueryKeys,
} from "@/features/lcms/quiz/quiz-runtime";
import { getDefaultTenantId } from "@/lib/graphql-client";

export const QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS = 60_000;
export const QUIZ_EDITOR_DRAFT_STALE_TIME_MS = 15_000;
export const QUIZ_EDITOR_REFERENCE_GC_TIME_MS = 30 * 60_000;

export const quizEditorQueryKeys = {
  root: ["quiz-editor"] as const,
  workspaceRoot: (tenantId: string = getDefaultTenantId()) =>
    [...quizEditorQueryKeys.root, "workspace", tenantId] as const,
  workspace: (input: QuizEditorWorkspaceInput = {}) =>
    [
      ...quizEditorQueryKeys.workspaceRoot(input.tenantId ?? getDefaultTenantId()),
      normalizeWorkspaceInput(input),
    ] as const,
  draft: (quizId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizEditorQueryKeys.root, "draft", tenantId, quizId] as const,
  versions: (quizId: string, tenantId: string = getDefaultTenantId()) =>
    [...quizEditorQueryKeys.root, "versions", tenantId, quizId] as const,
};

export const quizEditorMutationKeys = {
  create: [...quizEditorQueryKeys.root, "mutation", "create"] as const,
  delete: [...quizEditorQueryKeys.root, "mutation", "delete"] as const,
  saveDraft: [...quizEditorQueryKeys.root, "mutation", "save-draft"] as const,
  upsertSlide: [...quizEditorQueryKeys.root, "mutation", "upsert-slide"] as const,
  reorderSlides: [...quizEditorQueryKeys.root, "mutation", "reorder-slides"] as const,
  validate: [...quizEditorQueryKeys.root, "mutation", "validate"] as const,
  publish: [...quizEditorQueryKeys.root, "mutation", "publish"] as const,
  fork: [...quizEditorQueryKeys.root, "mutation", "fork"] as const,
  mediaPresign: [...quizEditorQueryKeys.root, "mutation", "media-presign"] as const,
  mediaCommit: [...quizEditorQueryKeys.root, "mutation", "media-commit"] as const,
  exportBundle: [...quizEditorQueryKeys.root, "mutation", "export-bundle"] as const,
};

export function quizEditorWorkspaceQueryOptions(input: QuizEditorWorkspaceInput = {}) {
  return {
    gcTime: QUIZ_EDITOR_REFERENCE_GC_TIME_MS,
    queryFn: () => loadQuizEditorWorkspace(input),
    queryKey: quizEditorQueryKeys.workspace(input),
    staleTime: QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS,
  };
}

export function quizEditorDraftQueryOptions(quizId: string, tenantId: string = getDefaultTenantId()) {
  return {
    enabled: Boolean(quizId),
    gcTime: QUIZ_EDITOR_REFERENCE_GC_TIME_MS,
    queryFn: () => loadQuizEditorDraft(quizId),
    queryKey: quizEditorQueryKeys.draft(quizId, tenantId),
    staleTime: QUIZ_EDITOR_DRAFT_STALE_TIME_MS,
  };
}

export function quizEditorVersionsQueryOptions(quizId: string, tenantId: string = getDefaultTenantId()) {
  return {
    enabled: Boolean(quizId),
    gcTime: QUIZ_EDITOR_REFERENCE_GC_TIME_MS,
    queryFn: () => loadQuizEditorVersions(quizId),
    queryKey: quizEditorQueryKeys.versions(quizId, tenantId),
    staleTime: QUIZ_EDITOR_WORKSPACE_STALE_TIME_MS,
  };
}

export function useQuizEditorWorkspaceQuery(input: QuizEditorWorkspaceInput = {}) {
  return useQuery(quizEditorWorkspaceQueryOptions(input));
}

export function useQuizEditorDraftQuery(quizId: string, tenantId: string = getDefaultTenantId()) {
  return useQuery(quizEditorDraftQueryOptions(quizId, tenantId));
}

export function useQuizEditorVersionsQuery(quizId: string, tenantId: string = getDefaultTenantId()) {
  return useQuery(quizEditorVersionsQueryOptions(quizId, tenantId));
}

export function useCreateQuizEditorQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizEditorCreateInput) => createQuizEditorQuiz(input),
    mutationKey: quizEditorMutationKeys.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
    },
  });
}

export function useDeleteQuizEditorQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quizId: string) => deleteQuizEditorQuiz(quizId),
    mutationKey: quizEditorMutationKeys.delete,
    onSuccess: (_result, quizId) => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.versions(quizId) });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
      clearNormalizedQuizPackageCache(quizId);
      void queryClient.invalidateQueries({ queryKey: quizRuntimeQueryKeys.packageRoot() });
    },
  });
}

export function useSaveQuizEditorDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizEditorSaveDraftInput) => saveQuizEditorDraft(input),
    mutationKey: quizEditorMutationKeys.saveDraft,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
    },
  });
}

export function useUpsertQuizEditorSlideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizEditorUpsertSlideInput) => upsertQuizEditorSlide(input),
    mutationKey: quizEditorMutationKeys.upsertSlide,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
    },
  });
}

export function useReorderQuizEditorSlidesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizEditorReorderInput) => reorderQuizEditorSlides(input),
    mutationKey: quizEditorMutationKeys.reorderSlides,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
    },
  });
}

export function useValidateQuizEditorDraftMutation() {
  return useMutation({
    mutationFn: (quizId: string) => validateQuizEditorDraft(quizId),
    mutationKey: quizEditorMutationKeys.validate,
  });
}

export function usePublishQuizEditorDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuizEditorPublishInput) => publishQuizEditorDraft(input),
    mutationKey: quizEditorMutationKeys.publish,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.versions(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.workspaceRoot() });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
      clearNormalizedQuizPackageCache(input.quizId);
      void queryClient.invalidateQueries({ queryKey: quizRuntimeQueryKeys.packageRoot() });
    },
  });
}

export function useForkQuizEditorVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { quizId: string; versionId: string }) => forkQuizEditorVersion(input),
    mutationKey: quizEditorMutationKeys.fork,
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.draft(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: quizEditorQueryKeys.versions(input.quizId) });
      void queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
    },
  });
}

export function usePresignQuizEditorMediaMutation() {
  return useMutation({
    mutationFn: (input: QuizEditorMediaPresignInput) => presignQuizEditorMedia(input),
    mutationKey: quizEditorMutationKeys.mediaPresign,
  });
}

export function useCommitQuizEditorMediaMutation() {
  return useMutation({
    mutationFn: (input: QuizEditorMediaCommitInput) => commitQuizEditorMedia(input),
    mutationKey: quizEditorMutationKeys.mediaCommit,
  });
}

export function useExportQuizEditorBundleMutation() {
  return useMutation({
    mutationFn: (input: { quizId?: string; quizVersionId?: string }) => exportQuizEditorBundle(input),
    mutationKey: quizEditorMutationKeys.exportBundle,
  });
}

function normalizeWorkspaceInput(input: QuizEditorWorkspaceInput) {
  return {
    categoryId: input.categoryId ?? "",
    kind: input.kind ?? "",
    levelId: input.levelId ?? "",
    page: Math.max(0, input.page ?? 0),
    search: input.search?.trim() ?? "",
    size: Math.min(Math.max(input.size ?? 20, 1), 50),
    status: input.status ?? "",
    subjectId: input.subjectId ?? "",
  };
}
