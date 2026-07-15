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
  type LmsStudentGroupInput,
  type UpdateLmsAssignmentInput,
  type UpdateLmsAssignmentRecipientsInput,
} from "@/features/lms/api/lms-assignment-command-api";
import { quizReportQueryKeys } from "@/features/lcms/quiz/quiz-reports";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";

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
  homeworkWorkspace: (tenantId: string = getDefaultTenantId()) => lmsAssignmentReadQueryKeys.homeworkTenantRoot(tenantId),
  classWorkspaceRoot: ["lms", "class-workspace"] as const,
  classWorkspaceTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.classWorkspaceRoot, tenantId] as const,
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
  }) => [...lmsAssignmentReadQueryKeys.classWorkspaceTenantRoot(tenantId), accountId ?? "anonymous", usage, schoolId ?? "", classId ?? ""] as const,
  studentGroupsRoot: ["lms", "student-groups"] as const,
  studentGroupsTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.studentGroupsRoot, tenantId] as const,
  studentGroups: (tenantId: string = getDefaultTenantId(), classId?: string | null) =>
    [...lmsAssignmentReadQueryKeys.studentGroupsTenantRoot(tenantId), classId ?? "all"] as const,
  assignmentProgressRoot: ["lms", "assignment-progress-workspace"] as const,
  assignmentProgressTenantRoot: (tenantId: string = getDefaultTenantId()) => [...lmsAssignmentReadQueryKeys.assignmentProgressRoot, tenantId] as const,
  assignmentProgress: (assignmentId: string, tenantId: string = getDefaultTenantId()) =>
    [...lmsAssignmentReadQueryKeys.assignmentProgressTenantRoot(tenantId), assignmentId] as const,
};


function resolveLmsAssignmentReadAccountId() {
  const session = readStoredAuthSession("lms") as { accountId?: string | null } | null;
  return session?.accountId?.trim() || "anonymous";
}

export const LMS_STUDENT_GROUPS_STALE_TIME_MS = 30_000;
export const LMS_STUDENT_GROUPS_GC_TIME_MS = 30 * 60_000;

export function lmsStudentGroupsQueryOptions(
  tenantId: string = getDefaultTenantId(),
  classId?: string | null,
  options: { enabled?: boolean } = {},
) {
  return {
    enabled: options.enabled ?? true,
    gcTime: LMS_STUDENT_GROUPS_GC_TIME_MS,
    queryFn: () => loadLmsStudentGroups({ classId, tenantId }),
    queryKey: lmsAssignmentReadQueryKeys.studentGroups(tenantId, classId),
    staleTime: LMS_STUDENT_GROUPS_STALE_TIME_MS,
  };
}

export function useLmsStudentGroupsQuery(
  tenantId: string = getDefaultTenantId(),
  classId?: string | null,
  options: { enabled?: boolean } = {},
) {
  return useQuery(lmsStudentGroupsQueryOptions(tenantId, classId, options));
}

export function useCreateLmsAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feature: "lms-assignment",
      persistence: "assignment-create",
    },
    mutationFn: (input: CreateLmsAssignmentInput) => createLmsAssignment(input),
    mutationKey: lmsAssignmentCommandMutationKeys.createAssignment,
    onSuccess: (result) => {
      invalidateAssignmentReads(queryClient, result.assignmentId);
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
  void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.homeworkTenantRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.classWorkspaceTenantRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.assignmentProgressTenantRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: quizReportQueryKeys.reportTenantRoot(tenantId) });
  if (assignmentId) {
    void queryClient.invalidateQueries({ queryKey: quizReportQueryKeys.assignmentReport(assignmentId, tenantId) });
  }
}

function invalidateStudentGroupReads(queryClient: QueryClient) {
  const tenantId = getDefaultTenantId();
  void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.studentGroupsTenantRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.homeworkTenantRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.classWorkspaceTenantRoot(tenantId) });
  void queryClient.invalidateQueries({ queryKey: quizReportQueryKeys.reportTenantRoot(tenantId) });
}
