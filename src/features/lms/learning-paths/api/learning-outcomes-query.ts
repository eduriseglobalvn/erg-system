import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  addPathNode,
  createCompetency,
  createLearningPath,
  evaluateCompletion,
  getLearningPath,
  issueCertificate,
  learningOutcomesQueryKeys,
  listAttainments,
  listCertificates,
  listCompetencies,
  listCompletions,
  listLearningPaths,
  publishLearningPath,
  recordAttainment,
  revokeCertificate,
  type AddPathNodeInput,
  type CreateCompetencyInput,
  type CreateLearningPathInput,
  type EvaluateCompletionInput,
  type IssueCertificateInput,
  type LearningOutcomeRequestContext,
  type LearningOutcomesPortal,
  type LearningPathFilters,
  type PublishLearningPathInput,
  type RecordAttainmentInput,
  type RevokeCertificateInput,
} from "@/features/lms/learning-paths/api/learning-outcomes-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";

export type LearningOutcomeWorkspace = "ADMIN" | "TEACHER" | "STUDENT";

export type LearningOutcomeScope = {
  tenantId: string;
  accountId: string;
  workspace: LearningOutcomeWorkspace;
  portal: LearningOutcomesPortal;
};

export function useLearningOutcomeScope(workspace: LearningOutcomeWorkspace): LearningOutcomeScope {
  const portal: LearningOutcomesPortal = workspace === "STUDENT" ? "elearning" : workspace === "ADMIN" ? "lcms" : "lms";
  const accountId = workspace === "STUDENT"
    ? getCurrentStudentSession()?.id?.trim() || "anonymous"
    : getCurrentAccount(portal)?.id?.trim() || "anonymous";
  return useMemo(() => ({
    tenantId: getDefaultTenantId(),
    accountId,
    workspace,
    portal,
  }), [accountId, portal, workspace]);
}

export function useLearningPaths(scope: LearningOutcomeScope, filters: LearningPathFilters = {}, enabled = true) {
  return useQuery({
    queryKey: learningOutcomesQueryKeys.paths(scope.tenantId, scope.accountId, scope.workspace, filters),
    queryFn: ({ signal }) => listLearningPaths(filters, contextFor(scope, signal)),
    enabled,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useLearningPath(scope: LearningOutcomeScope, pathId: string | undefined) {
  return useQuery({
    queryKey: learningOutcomesQueryKeys.path(scope.tenantId, scope.accountId, scope.workspace, pathId ?? ""),
    queryFn: ({ signal }) => getLearningPath(pathId ?? "", contextFor(scope, signal)),
    enabled: Boolean(pathId?.trim()),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useCompetencies(scope: LearningOutcomeScope, educationUnitId = "", enabled = true) {
  return useQuery({
    queryKey: learningOutcomesQueryKeys.competencies(scope.tenantId, scope.accountId, scope.workspace, educationUnitId),
    queryFn: ({ signal }) => listCompetencies(educationUnitId, contextFor(scope, signal)),
    enabled,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useLearnerOutcomeQueries(scope: LearningOutcomeScope, learnerId: string | undefined) {
  const normalizedLearnerId = learnerId?.trim() ?? "";
  const enabled = Boolean(normalizedLearnerId);
  const root = learningOutcomesQueryKeys.learner(scope.tenantId, scope.accountId, scope.workspace, normalizedLearnerId);
  const context = contextFor(scope);
  return {
    attainments: useQuery({
      queryKey: [...root, "attainments"] as const,
      queryFn: ({ signal }) => listAttainments(normalizedLearnerId, { ...context, signal }),
      enabled,
      staleTime: QUERY_POLICIES.transactional.staleTime,
      gcTime: QUERY_POLICIES.transactional.gcTime,
    }),
    completions: useQuery({
      queryKey: [...root, "completions"] as const,
      queryFn: ({ signal }) => listCompletions(normalizedLearnerId, { ...context, signal }),
      enabled,
      staleTime: QUERY_POLICIES.transactional.staleTime,
      gcTime: QUERY_POLICIES.transactional.gcTime,
    }),
    certificates: useQuery({
      queryKey: [...root, "certificates"] as const,
      queryFn: ({ signal }) => listCertificates(normalizedLearnerId, { ...context, signal }),
      enabled,
      staleTime: QUERY_POLICIES.transactional.staleTime,
      gcTime: QUERY_POLICIES.transactional.gcTime,
    }),
  };
}

export function useCreateLearningPath(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateLearningPathInput; idempotencyKey: string }) =>
      createLearningPath(input, idempotencyKey, contextFor(scope)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.root(scope.tenantId, scope.accountId, scope.workspace) }),
  });
}

export function usePublishLearningPath(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, input, idempotencyKey }: { pathId: string; input: PublishLearningPathInput; idempotencyKey: string }) =>
      publishLearningPath(pathId, input, idempotencyKey, contextFor(scope)),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.root(scope.tenantId, scope.accountId, scope.workspace) });
      void queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.path(scope.tenantId, scope.accountId, scope.workspace, variables.pathId) });
    },
  });
}

export function useAddPathNode(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, input, idempotencyKey }: { pathId: string; input: AddPathNodeInput; idempotencyKey: string }) =>
      addPathNode(pathId, input, idempotencyKey, contextFor(scope)),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.path(scope.tenantId, scope.accountId, scope.workspace, variables.pathId) }),
  });
}

export function useCreateCompetency(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateCompetencyInput; idempotencyKey: string }) =>
      createCompetency(input, idempotencyKey, contextFor(scope)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.root(scope.tenantId, scope.accountId, scope.workspace) }),
  });
}

export function useRecordAttainment(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: RecordAttainmentInput; idempotencyKey: string }) =>
      recordAttainment(input, idempotencyKey, contextFor(scope)),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.learner(scope.tenantId, scope.accountId, scope.workspace, variables.input.learnerId) });
    },
  });
}

export function useEvaluateCompletion(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, input, idempotencyKey }: { pathId: string; input: EvaluateCompletionInput; idempotencyKey: string }) =>
      evaluateCompletion(pathId, input, idempotencyKey, contextFor(scope)),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.learner(scope.tenantId, scope.accountId, scope.workspace, variables.input.learnerId) });
      void queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.path(scope.tenantId, scope.accountId, scope.workspace, variables.pathId) });
    },
  });
}

export function useIssueCertificate(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: IssueCertificateInput; idempotencyKey: string }) =>
      issueCertificate(input, idempotencyKey, contextFor(scope)),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.learner(scope.tenantId, scope.accountId, scope.workspace, variables.input.learnerId) }),
  });
}

export function useRevokeCertificate(scope: LearningOutcomeScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ certificateId, input, idempotencyKey }: { certificateId: string; input: RevokeCertificateInput; idempotencyKey: string }) =>
      revokeCertificate(certificateId, input, idempotencyKey, contextFor(scope)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningOutcomesQueryKeys.root(scope.tenantId, scope.accountId, scope.workspace) }),
  });
}

function contextFor(scope: LearningOutcomeScope, signal?: AbortSignal): LearningOutcomeRequestContext {
  return signal ? { portal: scope.portal, signal } : { portal: scope.portal };
}
