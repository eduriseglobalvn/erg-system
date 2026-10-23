import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { loadCurriculumTeachingPlan, saveCurriculumTeachingPlan, type CurriculumTeachingPlan, type CurriculumTeachingPlanInput } from "./curriculum-teaching-plan-api";

export type CurriculumTeachingPlanScope = { schoolId?: string | null; subjectId?: string | null; academicYear: string };

export const curriculumTeachingPlanQueryKey = (scope: CurriculumTeachingPlanScope) =>
  ["lms", "curriculum-teaching-plan", scope.schoolId ?? "", scope.subjectId ?? "", scope.academicYear] as const;

export function curriculumTeachingPlanQueryOptions(scope: CurriculumTeachingPlanScope) {
  const enabled = Boolean(scope.schoolId && scope.subjectId && scope.academicYear);
  return {
    enabled,
    queryKey: curriculumTeachingPlanQueryKey(scope),
    queryFn: ({ signal }: { signal: AbortSignal }) => loadCurriculumTeachingPlan({ schoolId: scope.schoolId!, subjectId: scope.subjectId!, academicYear: scope.academicYear }, signal),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
  };
}

export function useCurriculumTeachingPlanQuery(scope: CurriculumTeachingPlanScope) {
  return useQuery<CurriculumTeachingPlan | null>(curriculumTeachingPlanQueryOptions(scope));
}

export function useSaveCurriculumTeachingPlanMutation(scope: CurriculumTeachingPlanScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CurriculumTeachingPlanInput) => saveCurriculumTeachingPlan({
      schoolId: scope.schoolId!,
      subjectId: scope.subjectId!,
      academicYear: scope.academicYear,
    }, input),
    onSuccess: (saved) => queryClient.setQueryData(curriculumTeachingPlanQueryKey(scope), saved),
  });
}
