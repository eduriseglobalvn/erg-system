import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { loadCurriculumProgram, saveCurriculumProgram, type CurriculumProgram, type CurriculumProgramInput } from "./curriculum-program-api";

export type CurriculumProgramScope = { subjectId?: string; levelId?: string; academicYear: string };

export const curriculumProgramQueryKey = (scope: CurriculumProgramScope) =>
  ["lcms", "curriculum-program", scope.subjectId ?? "", scope.levelId ?? "", scope.academicYear] as const;

export function useCurriculumProgramQuery(scope: CurriculumProgramScope) {
  return useQuery<CurriculumProgram | null>({
    enabled: Boolean(scope.subjectId && scope.levelId && scope.academicYear),
    queryKey: curriculumProgramQueryKey(scope),
    queryFn: ({ signal }) => loadCurriculumProgram({ subjectId: scope.subjectId!, levelId: scope.levelId!, academicYear: scope.academicYear }, signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useSaveCurriculumProgramMutation(scope: CurriculumProgramScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CurriculumProgramInput) => saveCurriculumProgram({ subjectId: scope.subjectId!, levelId: scope.levelId!, academicYear: scope.academicYear }, input),
    onSuccess: (saved) => queryClient.setQueryData(curriculumProgramQueryKey(scope), saved),
  });
}
