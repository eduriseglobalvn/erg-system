import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createLmsAssignment,
  createLmsStudentGroup,
  deleteLmsAssignment,
  deleteLmsStudentGroup,
  loadLmsStudentGroups,
  updateLmsAssignment,
  updateLmsAssignmentRecipients,
  updateLmsStudentGroup,
  type CreateLmsAssignmentInput,
  type CreateLmsAssignmentResult,
  type LmsStudentGroupInput,
  type UpdateLmsAssignmentInput,
  type UpdateLmsAssignmentRecipientsInput,
} from "@/features/lms/api/lms-assignment-command-api";
import { quizReportQueryKeys } from "@/features/lcms/quiz/quiz-reports";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { QUERY_POLICIES } from "@/lib/query-policy";
import {
  createOfflineTeachingCommandAdapter,
  type OfflineTeachingCommandResult,
} from "@/features/lms/offline-teaching/offline-teaching-command-adapter";
import type { BackendOfflineTeachingPolicySnapshot } from "@/features/lms/offline-teaching/offline-teaching-policy";
import type { OfflineOutboxStore } from "@/platform/offline";

export const lmsAssignmentCommandMutationKeys = {
  createAssignment: ["lms", "mutation", "assignment-create"] as const,
  updateAssignment: ["lms", "mutation", "assignment-update"] as const,
  updateRecipients: ["lms", "mutation", "assignment-recipients"] as const,
  deleteAssignment: ["lms", "mutation", "assignment-delete"] as const,
  createGroup: ["lms", "mutation", "student-group-create"] as const,
  updateGroup: ["lms", "mutation", "student-group-update"] as const,
  deleteGroup: ["lms", "mutation", "student-group-delete"] as const,
};

export const lmsAssignmentReadQueryKeys = {
  root: ["lms-teacher-shell"] as const,
  homeworkRoot: ["lms-teacher-shell", "teacher-homework-workspace"] as const,
  homeworkTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.homeworkRoot, tenantId] as const,
  homeworkAccountRoot: (tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId()) =>
    [...lmsAssignmentReadQueryKeys.homeworkTenantRoot(tenantId), normalizeLmsAssignmentReadAccountId(accountId)] as const,
  homeworkWorkspace: (tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId()) =>
    lmsAssignmentReadQueryKeys.homeworkAccountRoot(tenantId, accountId),
  classWorkspaceRoot: ["lms", "class-workspace"] as const,
  classWorkspaceTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.classWorkspaceRoot, tenantId] as const,
  classWorkspaceAccountRoot: (tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId()) =>
    [...lmsAssignmentReadQueryKeys.classWorkspaceTenantRoot(tenantId), normalizeLmsAssignmentReadAccountId(accountId)] as const,
  classWorkspace: ({
    accountId = resolveLmsAssignmentReadAccountId(),
    classId,
    schoolId,
    tenantId = getDefaultTenantId(),
    usage,
  }: {
    accountId?: string | null;
    classId?: string | null;
    schoolId?: string | null;
    tenantId?: string;
    usage: string;
  }) => [...lmsAssignmentReadQueryKeys.classWorkspaceAccountRoot(tenantId, accountId ?? "anonymous"), usage, schoolId ?? "", classId ?? ""] as const,
  studentGroupsRoot: ["lms", "student-groups"] as const,
  studentGroupsTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.studentGroupsRoot, tenantId] as const,
  studentGroupsAccountRoot: (tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId()) =>
    [...lmsAssignmentReadQueryKeys.studentGroupsTenantRoot(tenantId), normalizeLmsAssignmentReadAccountId(accountId)] as const,
  studentGroups: (tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId(), classId?: string | null) =>
    [...lmsAssignmentReadQueryKeys.studentGroupsAccountRoot(tenantId, accountId), classId ?? "all"] as const,
  assignmentProgressRoot: ["lms", "assignment-progress-workspace"] as const,
  assignmentProgressTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.assignmentProgressRoot, tenantId] as const,
  assignmentProgressAccountRoot: (tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId()) =>
    [...lmsAssignmentReadQueryKeys.assignmentProgressTenantRoot(tenantId), normalizeLmsAssignmentReadAccountId(accountId)] as const,
  assignmentProgress: (assignmentId: string, tenantId: string = getDefaultTenantId(), accountId: string = resolveLmsAssignmentReadAccountId()) =>
    [...lmsAssignmentReadQueryKeys.assignmentProgressAccountRoot(tenantId, accountId), assignmentId] as const,
};


function resolveLmsAssignmentReadAccountId() {
  const session = readStoredAuthSession("lms") as { accountId?: string | null } | null;
  return session?.accountId?.trim() || "anonymous";
}

export const LMS_STUDENT_GROUPS_STALE_TIME_MS = QUERY_POLICIES.transactional.staleTime;
export const LMS_STUDENT_GROUPS_GC_TIME_MS = QUERY_POLICIES.transactional.gcTime;

export type LmsAssignmentOfflineOptions = {
  capability?: BackendOfflineTeachingPolicySnapshot | null;
  isOnline?: () => boolean;
  store?: OfflineOutboxStore;
};

export function lmsStudentGroupsQueryOptions(
  tenantId: string = getDefaultTenantId(),
  classId?: string | null,
  options: { accountId?: string | null; enabled?: boolean } = {},
) {
  const accountId = options.accountId?.trim() || resolveLmsAssignmentReadAccountId();
  return {
    enabled: options.enabled ?? true,
    gcTime: LMS_STUDENT_GROUPS_GC_TIME_MS,
    queryFn: ({ signal }: { signal: AbortSignal }) => loadLmsStudentGroups({ classId, tenantId }, signal),
    queryKey: lmsAssignmentReadQueryKeys.studentGroups(tenantId, accountId, classId),
    staleTime: LMS_STUDENT_GROUPS_STALE_TIME_MS,
  };
}

function normalizeLmsAssignmentReadAccountId(accountId?: string | null) {
  return accountId?.trim() || "anonymous";
}

export function useLmsStudentGroupsQuery(
  tenantId: string = getDefaultTenantId(),
  classId?: string | null,
  options: { accountId?: string | null; enabled?: boolean } = {},
) {
  return useQuery(lmsStudentGroupsQueryOptions(tenantId, classId, options));
}

export function useCreateLmsAssignmentMutation(options: { offline?: LmsAssignmentOfflineOptions } = {}) {
  const queryClient = useQueryClient();
  const hasOfflineOptions = Boolean(options.offline);
  const capability = options.offline?.capability;
  const isOnline = options.offline?.isOnline;
  const store = options.offline?.store;
  const offlineAdapter = useMemo(() => hasOfflineOptions ? createOfflineTeachingCommandAdapter({
    capability,
    isOnline,
    scope: {
      accountId: resolveLmsAssignmentReadAccountId(),
      tenantId: getDefaultTenantId(),
      workspace: "TEACHER",
    },
    store,
  }) : null, [capability, hasOfflineOptions, isOnline, store]);

  return useMutation({
    meta: {
      feature: "lms-assignment",
      persistence: "assignment-create",
    },
    mutationFn: async (input: CreateLmsAssignmentInput) => {
      if (!offlineAdapter) return createLmsAssignment(input);
      return offlineAdapter.execute<ReturnType<typeof toOfflineJsonInput>, CreateLmsAssignmentResult>({
        entityId: input.idempotencyKey,
        entityType: "assignment",
        expectedVersion: 0,
        idempotencyKey: input.idempotencyKey,
        operation: "assignment.create",
        payload: toOfflineJsonInput(input),
        send: ({ idempotencyKey, payload }) => createLmsAssignment({
          ...(payload as CreateLmsAssignmentInput),
          idempotencyKey,
        }),
      });
    },
    mutationKey: lmsAssignmentCommandMutationKeys.createAssignment,
    onSuccess: (result) => {
      const confirmed = unwrapConfirmedResult(result);
      if (confirmed) invalidateAssignmentReads(queryClient, confirmed.assignmentId);
    },
    onSettled: (result) => {
      if (!isPendingResult(result)) invalidateAssignmentReads(queryClient);
    },
  });
}

export function useUpdateLmsAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLmsAssignmentInput) => updateLmsAssignment(input),
    mutationKey: lmsAssignmentCommandMutationKeys.updateAssignment,
    onSuccess: (_result, input) => {
      invalidateAssignmentReads(queryClient, input.assignmentId);
    },
  });
}

export function useUpdateLmsAssignmentRecipientsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLmsAssignmentRecipientsInput) => updateLmsAssignmentRecipients(input),
    mutationKey: lmsAssignmentCommandMutationKeys.updateRecipients,
    onSuccess: (result, input) => {
      invalidateAssignmentReads(queryClient, result.assignmentId || input.assignmentId);
    },
  });
}

export function useDeleteLmsAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => deleteLmsAssignment(assignmentId),
    mutationKey: lmsAssignmentCommandMutationKeys.deleteAssignment,
    onSuccess: (_result, assignmentId) => {
      invalidateAssignmentReads(queryClient, assignmentId);
    },
  });
}

export function useCreateLmsStudentGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feature: "lms-student-group",
      persistence: "student-group-create",
    },
    mutationFn: (input: LmsStudentGroupInput) => createLmsStudentGroup(input),
    mutationKey: lmsAssignmentCommandMutationKeys.createGroup,
    onSuccess: () => {
      invalidateStudentGroupReads(queryClient);
    },
  });
}

export function useUpdateLmsStudentGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feature: "lms-student-group",
      persistence: "student-group-update",
    },
    mutationFn: (input: { groupId: string; payload: LmsStudentGroupInput }) =>
      updateLmsStudentGroup(input.groupId, input.payload),
    mutationKey: lmsAssignmentCommandMutationKeys.updateGroup,
    onSuccess: () => {
      invalidateStudentGroupReads(queryClient);
    },
  });
}

export function useDeleteLmsStudentGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feature: "lms-student-group",
      persistence: "student-group-delete",
    },
    mutationFn: (groupId: string) => deleteLmsStudentGroup(groupId),
    mutationKey: lmsAssignmentCommandMutationKeys.deleteGroup,
    onSuccess: () => {
      invalidateStudentGroupReads(queryClient);
    },
  });
}

function invalidateAssignmentReads(
  queryClient: QueryClient,
  assignmentId?: string,
) {
  const tenantId = getDefaultTenantId();
  const accountId = resolveLmsAssignmentReadAccountId();
  const keys = assignmentId
    ? assignmentMutationInvalidationKeys(tenantId, assignmentId, accountId)
    : [
        lmsAssignmentReadQueryKeys.homeworkAccountRoot(tenantId, accountId),
        lmsAssignmentReadQueryKeys.classWorkspaceAccountRoot(tenantId, accountId),
      ];
  keys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));
}

function invalidateStudentGroupReads(queryClient: QueryClient) {
  const tenantId = getDefaultTenantId();
  studentGroupMutationInvalidationKeys(tenantId, resolveLmsAssignmentReadAccountId())
    .forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));
}

export function assignmentMutationInvalidationKeys(
  tenantId: string,
  assignmentId: string,
  accountId: string = resolveLmsAssignmentReadAccountId(),
) {
  return [
    lmsAssignmentReadQueryKeys.homeworkAccountRoot(tenantId, accountId),
    lmsAssignmentReadQueryKeys.classWorkspaceAccountRoot(tenantId, accountId),
    lmsAssignmentReadQueryKeys.assignmentProgress(assignmentId, tenantId, accountId),
    quizReportQueryKeys.assignmentReport(assignmentId, tenantId),
  ] as const;
}

export function studentGroupMutationInvalidationKeys(
  tenantId: string,
  accountId: string = resolveLmsAssignmentReadAccountId(),
) {
  return [
    lmsAssignmentReadQueryKeys.studentGroupsAccountRoot(tenantId, accountId),
    lmsAssignmentReadQueryKeys.homeworkAccountRoot(tenantId, accountId),
    lmsAssignmentReadQueryKeys.classWorkspaceAccountRoot(tenantId, accountId),
  ] as const;
}

function unwrapConfirmedResult<T>(value: T | OfflineTeachingCommandResult<T>) {
  if (value && typeof value === "object" && "status" in value) {
    return value.status === "confirmed" ? value.value : undefined;
  }
  return value;
}

function isPendingResult(value: unknown) {
  return Boolean(value && typeof value === "object" && (value as { status?: unknown }).status === "pending");
}

function toOfflineJsonInput(input: object) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
