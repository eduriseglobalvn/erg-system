import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  loadAttendanceWorkspace,
  loadGradebookWorkspace,
  upsertAttendance,
  upsertGradebookScore,
  type AttendanceRecord,
  type AttendanceWorkspace,
  type GradebookScore,
  type GradebookWorkspace,
} from "@/features/lms/api/lms-academic-record-api";
import type { UpsertAttendanceInput, UpsertGradebookScoreInput } from "@/lib/api/generated/graphql";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import {
  createOfflineTeachingCommandAdapter,
  type OfflineTeachingCommandResult,
} from "@/features/lms/offline-teaching/offline-teaching-command-adapter";
import type { BackendOfflineTeachingPolicySnapshot } from "@/features/lms/offline-teaching/offline-teaching-policy";
import type { OfflineOutboxStore } from "@/platform/offline";

export type AcademicRecordScope = {
  accountId?: string | null;
  classId?: string | null;
  schoolId?: string | null;
  subjectId?: string | null;
  tenantId?: string | null;
};

export type AttendanceQueryScope = AcademicRecordScope & { from: string; to: string };

export type AcademicRecordOfflineOptions = {
  capability?: BackendOfflineTeachingPolicySnapshot | null;
  isOnline?: () => boolean;
  store?: OfflineOutboxStore;
};

export const lmsAcademicRecordQueryKeys = {
  attendanceRoot: ["lms", "attendance"] as const,
  attendance: (scope: AttendanceQueryScope) => [
    ...lmsAcademicRecordQueryKeys.attendanceRoot,
    normalizeTenant(scope.tenantId),
    normalizeAccount(scope.accountId),
    scope.classId ?? "",
    scope.subjectId ?? "",
    scope.from,
    scope.to,
  ] as const,
  scoresRoot: ["lms", "scores"] as const,
  gradebook: (scope: AcademicRecordScope) => [
    ...lmsAcademicRecordQueryKeys.scoresRoot,
    normalizeTenant(scope.tenantId),
    normalizeAccount(scope.accountId),
    scope.classId ?? "",
    scope.subjectId ?? "",
  ] as const,
};

export function resolveAcademicRecordIdentity() {
  const session = readStoredAuthSession("lms") as { accountId?: string | null; tenantId?: string | null } | null;
  return {
    accountId: normalizeAccount(session?.accountId),
    tenantId: normalizeTenant(session?.tenantId),
  };
}

export function attendanceQueryOptions(scope: AttendanceQueryScope) {
  const normalized = normalizeScope(scope);
  return {
    enabled: hasConcreteScope(normalized) && Boolean(normalized.from && normalized.to),
    gcTime: QUERY_POLICIES.transactional.gcTime,
    queryFn: ({ signal }: { signal: AbortSignal }) => loadAttendanceWorkspace({
      classId: normalized.classId!,
      from: normalized.from,
      schoolId: normalized.schoolId || undefined,
      subjectId: normalized.subjectId!,
      tenantId: normalized.tenantId,
      to: normalized.to,
    }, signal),
    queryKey: lmsAcademicRecordQueryKeys.attendance(normalized),
    staleTime: QUERY_POLICIES.transactional.staleTime,
  };
}

export function gradebookQueryOptions(scope: AcademicRecordScope) {
  const normalized = normalizeScope(scope);
  return {
    enabled: hasConcreteScope(normalized),
    gcTime: QUERY_POLICIES.transactional.gcTime,
    queryFn: ({ signal }: { signal: AbortSignal }) => loadGradebookWorkspace({
      classId: normalized.classId!,
      schoolId: normalized.schoolId || undefined,
      subjectId: normalized.subjectId!,
      tenantId: normalized.tenantId,
    }, signal),
    queryKey: lmsAcademicRecordQueryKeys.gradebook(normalized),
    staleTime: QUERY_POLICIES.transactional.staleTime,
  };
}

export function useAttendanceWorkspaceQuery(scope: AttendanceQueryScope) {
  return useQuery(attendanceQueryOptions(scope));
}

export function useGradebookWorkspaceQuery(scope: AcademicRecordScope) {
  return useQuery(gradebookQueryOptions(scope));
}

export function useUpsertAttendanceMutation(scope: AttendanceQueryScope, options: { offline?: AcademicRecordOfflineOptions } = {}) {
  const queryClient = useQueryClient();
  const normalized = normalizeScope(scope);
  const queryKey = lmsAcademicRecordQueryKeys.attendance(normalized);
  const offlineAdapter = useAcademicRecordOfflineAdapter(normalized, options.offline);
  return useMutation({
    mutationFn: async (input: UpsertAttendanceInput) => {
      if (!offlineAdapter) return upsertAttendance(input);
      return offlineAdapter.execute<ReturnType<typeof toOfflineJsonInput>, AttendanceRecord>({
        entityId: attendanceNaturalKey(input),
        entityType: "attendance",
        expectedVersion: input.expectedVersion ?? undefined,
        idempotencyKey: input.idempotencyKey ?? undefined,
        operation: "attendance.upsert",
        operationId: input.operationId ?? undefined,
        payload: toOfflineJsonInput(input),
        send: ({ expectedVersion, idempotencyKey, operationId, payload }) => upsertAttendance({
          ...(payload as UpsertAttendanceInput),
          expectedVersion,
          idempotencyKey,
          operationId,
        }),
      });
    },
    mutationKey: ["lms", "mutation", "attendance-upsert"] as const,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ exact: true, queryKey });
      const previous = queryClient.getQueryData<AttendanceWorkspace>(queryKey);
      queryClient.setQueryData<AttendanceWorkspace>(queryKey, (current) => current ? optimisticAttendance(current, input) : current);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (result) => {
      const record = unwrapConfirmedResult(result);
      if (record) {
        queryClient.setQueryData<AttendanceWorkspace>(queryKey, (current) => current ? mergeAttendance(current, record) : current);
      }
    },
    onSettled: (result) => {
      if (!isPendingResult(result)) void queryClient.invalidateQueries({ exact: true, queryKey });
    },
  });
}

export function useUpsertGradebookScoreMutation(scope: AcademicRecordScope, options: { offline?: AcademicRecordOfflineOptions } = {}) {
  const queryClient = useQueryClient();
  const normalized = normalizeScope(scope);
  const queryKey = lmsAcademicRecordQueryKeys.gradebook(normalized);
  const offlineAdapter = useAcademicRecordOfflineAdapter(normalized, options.offline);
  return useMutation({
    mutationFn: async (input: UpsertGradebookScoreInput) => {
      if (!offlineAdapter) return upsertGradebookScore(input);
      return offlineAdapter.execute<ReturnType<typeof toOfflineJsonInput>, GradebookScore>({
        entityId: `${input.studentId}:${input.columnId}`,
        entityType: "gradebook-score",
        expectedVersion: input.expectedVersion ?? undefined,
        idempotencyKey: input.idempotencyKey ?? undefined,
        operation: "gradebook.score.upsert",
        operationId: input.operationId ?? undefined,
        payload: toOfflineJsonInput(input),
        send: ({ expectedVersion, idempotencyKey, operationId, payload }) => upsertGradebookScore({
          ...(payload as UpsertGradebookScoreInput),
          expectedVersion,
          idempotencyKey,
          operationId,
        }),
      });
    },
    mutationKey: ["lms", "mutation", "gradebook-score-upsert"] as const,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ exact: true, queryKey });
      const previous = queryClient.getQueryData<GradebookWorkspace>(queryKey);
      queryClient.setQueryData<GradebookWorkspace>(queryKey, (current) => current ? optimisticGradebook(current, input) : current);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (result) => {
      const score = unwrapConfirmedResult(result);
      if (score) {
        queryClient.setQueryData<GradebookWorkspace>(queryKey, (current) => current ? mergeGradebookScore(current, score) : current);
      }
    },
    onSettled: (result) => {
      if (!isPendingResult(result)) void queryClient.invalidateQueries({ exact: true, queryKey });
    },
  });
}

export function isPendingAcademicRecordMutation(value: unknown): value is { status: "pending" } {
  return Boolean(value && typeof value === "object" && (value as { status?: unknown }).status === "pending");
}

function useAcademicRecordOfflineAdapter(
  scope: ReturnType<typeof normalizeScope>,
  options?: AcademicRecordOfflineOptions,
) {
  const hasOfflineOptions = Boolean(options);
  const capability = options?.capability;
  const isOnline = options?.isOnline;
  const store = options?.store;
  return useMemo(() => {
    if (!hasOfflineOptions) return null;
    if (!scope.classId || !scope.subjectId || scope.accountId === "anonymous") return null;
    return createOfflineTeachingCommandAdapter({
      capability,
      isOnline,
      scope: {
        accountId: scope.accountId,
        tenantId: scope.tenantId,
        workspace: "TEACHER",
      },
      store,
    });
  }, [capability, hasOfflineOptions, isOnline, scope.accountId, scope.classId, scope.subjectId, scope.tenantId, store]);
}

function unwrapConfirmedResult<T>(value: T | OfflineTeachingCommandResult<T>) {
  if (value && typeof value === "object" && "status" in value) {
    return value.status === "confirmed" ? value.value : undefined;
  }
  return value;
}

function isPendingResult(value: unknown) {
  return isPendingAcademicRecordMutation(value);
}

function toOfflineJsonInput(input: object) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

export function invalidateAcademicRecordScope(queryClient: QueryClient, scope: AcademicRecordScope) {
  const normalized = normalizeScope(scope);
  return Promise.all([
    queryClient.invalidateQueries({ exact: true, queryKey: lmsAcademicRecordQueryKeys.gradebook(normalized) }),
    queryClient.invalidateQueries({ queryKey: ["lms", "attendance", normalized.tenantId, normalized.accountId, normalized.classId, normalized.subjectId] }),
  ]);
}

function optimisticAttendance(workspace: AttendanceWorkspace, input: UpsertAttendanceInput): AttendanceWorkspace {
  return mergeAttendance(workspace, {
    attendanceDate: input.attendanceDate,
    id: attendanceNaturalKey(input),
    lessonIndex: input.lessonIndex,
    status: input.status,
    studentId: input.studentId,
    subjectId: input.subjectId,
    updatedAt: new Date().toISOString(),
    version: (input.expectedVersion ?? 0) + 1,
  });
}

function mergeAttendance(workspace: AttendanceWorkspace, record: AttendanceRecord): AttendanceWorkspace {
  const records = workspace.records.filter((item) => !sameAttendanceCell(item, record));
  return { ...workspace, records: [...records, record] };
}

function optimisticGradebook(workspace: GradebookWorkspace, input: UpsertGradebookScoreInput): GradebookWorkspace {
  const column = {
    id: input.columnId,
    kind: input.kind,
    label: input.label,
    maxScore: input.maxScore,
    position: input.position ?? 0,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  const columns = workspace.columns.some((item) => item.id === column.id)
    ? workspace.columns.map((item) => item.id === column.id ? { ...item, ...column } : item)
    : [...workspace.columns, column];
  return mergeGradebookScore({ ...workspace, columns }, {
    columnId: input.columnId,
    maxScore: input.maxScore,
    score: input.score,
    studentId: input.studentId,
    updatedAt: new Date().toISOString(),
    version: (input.expectedVersion ?? 0) + 1,
  });
}

function mergeGradebookScore(workspace: GradebookWorkspace, score: GradebookScore): GradebookWorkspace {
  const scores = workspace.scores.filter((item) => item.studentId !== score.studentId || item.columnId !== score.columnId);
  return { ...workspace, scores: [...scores, score] };
}

function sameAttendanceCell(left: AttendanceRecord, right: AttendanceRecord) {
  return left.studentId === right.studentId && left.attendanceDate === right.attendanceDate && left.lessonIndex === right.lessonIndex;
}

function attendanceNaturalKey(input: UpsertAttendanceInput) {
  return [input.classId, input.studentId, input.subjectId, input.attendanceDate, input.lessonIndex].join(":");
}

function normalizeScope<T extends AcademicRecordScope>(scope: T) {
  return {
    ...scope,
    accountId: normalizeAccount(scope.accountId),
    classId: scope.classId?.trim() || "",
    schoolId: scope.schoolId?.trim() || "",
    subjectId: scope.subjectId?.trim() || "",
    tenantId: normalizeTenant(scope.tenantId),
  };
}

function hasConcreteScope(scope: ReturnType<typeof normalizeScope>) {
  return scope.accountId !== "anonymous" && Boolean(scope.tenantId && scope.classId && scope.subjectId);
}

function normalizeAccount(accountId?: string | null) {
  return accountId?.trim() || "anonymous";
}

function normalizeTenant(tenantId?: string | null) {
  return tenantId?.trim() || getDefaultTenantId();
}
