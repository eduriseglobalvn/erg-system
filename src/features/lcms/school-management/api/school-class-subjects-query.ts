import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  loadSchoolClassSubjects,
  saveSchoolClassSubjects,
  type SchoolClassSubjectAllocation,
  type SchoolClassSubjects,
} from "@/features/lcms/school-management/api/school-class-subjects-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

export type SchoolClassSubjectsQueryScope = { schoolId?: string | null; academicYear: string };

export const schoolClassSubjectsQueryKey = (scope: SchoolClassSubjectsQueryScope) =>
  ["lcms", "school-class-subjects", scope.schoolId ?? "", scope.academicYear] as const;

export function useSchoolClassSubjectsQuery(scope: SchoolClassSubjectsQueryScope) {
  return useQuery<SchoolClassSubjects>({
    enabled: Boolean(scope.schoolId && scope.academicYear),
    queryKey: schoolClassSubjectsQueryKey(scope),
    queryFn: ({ signal }) => loadSchoolClassSubjects({ schoolId: scope.schoolId!, academicYear: scope.academicYear }, signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useSaveSchoolClassSubjectsMutation(scope: SchoolClassSubjectsQueryScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { allocations: SchoolClassSubjectAllocation[]; expectedVersion?: number }) =>
      saveSchoolClassSubjects({ schoolId: scope.schoolId!, academicYear: scope.academicYear }, input),
    onSuccess: (saved) => queryClient.setQueryData(schoolClassSubjectsQueryKey(scope), saved),
    // A 409 means someone else saved first: reload the server set instead of keeping a stale version.
    onError: () => queryClient.invalidateQueries({ queryKey: schoolClassSubjectsQueryKey(scope) }),
  });
}
