import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { classLogQueryKeys } from "../api/class-log-query-keys";
import { confirmLessonLogWeek, loadChanges, loadClassWeek, loadCurriculum, loadTeacherWeek } from "../api/class-log-api";
import { lessonLogErrorText } from "../domain/class-log-copy";

export const useTeacherWeek = (weekStart: string, session: string, status: string) =>
  useQuery({
    queryKey: classLogQueryKeys.teacherWeek(weekStart, session, status),
    queryFn: ({ signal }) => loadTeacherWeek({ weekStart, session, status }, signal),
    staleTime: 15_000,
  });

export const useClassWeek = (classId: string, weekStart: string) =>
  useQuery({
    queryKey: classLogQueryKeys.classWeek(classId, weekStart),
    queryFn: ({ signal }) => loadClassWeek({ classId, weekStart }, signal),
    enabled: Boolean(classId),
    staleTime: 15_000,
  });

export const useChanges = (weekStart: string, classId: string) =>
  useQuery({
    queryKey: classLogQueryKeys.changes(weekStart, classId),
    queryFn: ({ signal }) => loadChanges({ weekStart, classId }, signal),
    staleTime: 15_000,
  });

/** The popup is read only; without a subject id there is nothing to look up, so it shows the "no framework" text. */
export const useCurriculum = (classId: string, subjectId: string, enabled: boolean) =>
  useQuery({
    queryKey: classLogQueryKeys.curriculum(classId, subjectId),
    queryFn: ({ signal }) => loadCurriculum({ classId, subjectId }, signal),
    enabled: enabled && Boolean(classId && subjectId),
    staleTime: 5 * 60_000,
  });

export function useConfirmWeek(weekStart: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => confirmLessonLogWeek(weekStart),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all }),
    onError: (error) => {
      toast.error(lessonLogErrorText(error));
      void queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all });
    },
  });
}
