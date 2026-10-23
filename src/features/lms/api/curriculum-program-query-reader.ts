import { useQuery } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { loadCurriculumProgram, type CurriculumProgram } from "./curriculum-program-api";

export function useCurriculumProgramReader(scope: { subjectId?: string; levelId?: string; academicYear: string }) {
  return useQuery<CurriculumProgram | null>({
    enabled: Boolean(scope.subjectId && scope.levelId && scope.academicYear),
    queryKey: ["lms", "curriculum-program", scope.subjectId ?? "", scope.levelId ?? "", scope.academicYear] as const,
    queryFn: ({ signal }) => loadCurriculumProgram({ subjectId: scope.subjectId!, levelId: scope.levelId!, academicYear: scope.academicYear }, signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}
