import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurriculumTreeQuery } from "@/features/lms/api/curriculum-tree-api";
import { loadLmsClassWorkspace } from "@/features/lms/api/lms-classroom-api";
import { resolveAcademicRecordIdentity } from "@/features/lms/api/lms-academic-record-query";
import { createOfflineTeachingCommandAdapter, type OfflineTeachingCommandResult } from "@/features/lms/offline-teaching";
import { QUERY_POLICIES } from "@/lib/query-policy";

import { loadLessonCurriculum, loadTeacherDayPeriods, saveAttendanceAndLog } from "./attendance-api";
import { attendanceCommand, attendanceOfflinePolicy, classifyReplayError } from "./attendance-offline";
import type { AttendanceStudent, LessonLogPeriod, SaveAttendanceAndLogInput } from "./attendance-model";

export const attendanceQueryKeys = {
  curriculum: (classId: string, subjectId: string) => ["class-log", "curriculum", classId, subjectId] as const,
  day: (accountId: string, date: string) => ["class-log", "day-periods", accountId, date] as const,
  roster: (classId: string) => ["class-log", "roster", classId] as const,
};

export function useDayPeriodsQuery(date: string) {
  const { accountId } = resolveAcademicRecordIdentity();
  return useQuery({
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    queryFn: ({ signal }) => loadTeacherDayPeriods(date, signal),
    queryKey: attendanceQueryKeys.day(accountId, date),
    staleTime: QUERY_POLICIES.transactional.staleTime,
  });
}

export function useRosterQuery(classId: string | undefined) {
  return useQuery({
    enabled: Boolean(classId),
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    queryFn: async ({ signal }): Promise<AttendanceStudent[]> => {
      const workspace = await loadLmsClassWorkspace({ assignmentSize: 1, classId: classId!, size: 100 }, signal);
      return workspace.students.items
        .map((student) => ({ id: student.id, name: student.fullName || student.username || student.studentCode || student.id }))
        .sort((a, b) => a.name.localeCompare(b.name, "vi"));
    },
    queryKey: attendanceQueryKeys.roster(classId ?? ""),
    staleTime: QUERY_POLICIES.reference.staleTime,
  });
}

/** The popup/dropdown source: KCT rows of the class subject. Uses the period's subject id; falls back to matching by name when it is missing. */
export function useCurriculumRows(classId: string | undefined, subjectName: string | undefined, periodSubjectId?: string | null) {
  const tree = useCurriculumTreeQuery();
  const subjectId = useMemo(
    () => periodSubjectId ?? tree.data?.subjects?.find((item) => item.subject.name === subjectName)?.subject.id,
    [periodSubjectId, subjectName, tree.data],
  );
  return useQuery({
    enabled: Boolean(classId && subjectId),
    queryFn: ({ signal }) => loadLessonCurriculum(classId!, subjectId!, signal),
    queryKey: attendanceQueryKeys.curriculum(classId ?? "", subjectId ?? ""),
    staleTime: QUERY_POLICIES.reference.staleTime,
  });
}

export type SaveResult = OfflineTeachingCommandResult<LessonLogPeriod>;

/** Save mutation through the offline outbox, plus replay of the queue when the device is back online. */
export function useSaveAttendanceAndLog(date: string) {
  const queryClient = useQueryClient();
  const identity = resolveAcademicRecordIdentity();
  const { accountId, tenantId } = identity;
  const [pendingCount, setPendingCount] = useState(0);

  const adapter = useMemo(() => {
    if (accountId === "anonymous") return null;
    return createOfflineTeachingCommandAdapter({
      capability: attendanceOfflinePolicy({ accountId, tenantId }),
      scope: { accountId, tenantId, workspace: "TEACHER" },
    });
  }, [accountId, tenantId]);

  const refreshPending = useCallback(async () => {
    if (!adapter) return;
    const entries = await adapter.list();
    setPendingCount(entries.filter((entry) => entry.status === "pending" || entry.status === "retrying" || entry.status === "sending").length);
  }, [adapter]);

  const replay = useCallback(async () => {
    if (!adapter) return;
    const summary = await adapter.replay(async (mutation) => {
      try {
        await saveAttendanceAndLog({ ...(mutation.payload as SaveAttendanceAndLogInput), expectedVersion: mutation.expectedVersion });
        return { kind: "succeeded" as const };
      } catch (error) {
        return classifyReplayError(error, mutation);
      }
    });
    await refreshPending();
    if (summary.succeeded > 0) await queryClient.invalidateQueries({ queryKey: ["class-log", "day-periods"] });
  }, [adapter, queryClient, refreshPending]);

  useEffect(() => {
    void replay();
    window.addEventListener("online", replay);
    return () => window.removeEventListener("online", replay);
  }, [replay]);

  const mutation = useMutation({
    meta: { silent: true },
    mutationFn: async (input: SaveAttendanceAndLogInput): Promise<SaveResult> => {
      if (!adapter) return { idempotencyKey: "", operationId: "", status: "confirmed", value: await saveAttendanceAndLog(input) };
      const command = attendanceCommand(input);
      return adapter.execute<typeof command.payload, LessonLogPeriod>({
        ...command,
        send: ({ expectedVersion }) => saveAttendanceAndLog({ ...input, expectedVersion }),
      });
    },
    mutationKey: ["class-log", "mutation", "attendance-save"] as const,
    onSettled: async (result) => {
      await refreshPending();
      if (result?.status !== "pending") await queryClient.invalidateQueries({ queryKey: ["class-log", "day-periods", accountId, date] });
    },
  });

  return { mutation, pendingCount };
}
