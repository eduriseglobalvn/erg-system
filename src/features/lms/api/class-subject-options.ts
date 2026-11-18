import { useQuery } from "@tanstack/react-query";

import { useCurriculumTreeQuery } from "@/features/lms/api/curriculum-tree-api";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

type ClassSubjectAllocations = { allocations: { classId: string; subjectIds: string[] }[] };

export type ClassSubjectOption = { id: string; name: string };

/** Subjects the school assigned to this class (KCT ids and names). No year sent: the server returns the class's rows whatever the year. */
export function useClassSubjectOptions(schoolId?: string | null, classId?: string | null) {
  const tree = useCurriculumTreeQuery();
  const allocations = useQuery({
    enabled: Boolean(schoolId && classId),
    queryKey: ["lms", "class-subjects", schoolId ?? ""] as const,
    queryFn: ({ signal }) => apiRequest<ClassSubjectAllocations>(
      `${API_ENDPOINTS.curriculum.classSubjects}?${new URLSearchParams({ schoolId: schoolId! })}`, { signal }),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
  });
  const ids = new Set(allocations.data?.allocations.filter((item) => item.classId === classId).flatMap((item) => item.subjectIds));
  const options: ClassSubjectOption[] = [...ids].map((id) => ({
    id,
    name: tree.data?.subjects.find((item) => item.subject.id === id)?.subject.name ?? id,
  }));
  return { isLoading: allocations.isLoading || tree.isLoading, options };
}
