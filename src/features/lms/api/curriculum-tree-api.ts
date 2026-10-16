import { useQuery } from "@tanstack/react-query";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

export type CurriculumTreeTopic = { id: string; name: string; description?: string; sortOrder?: number; status?: string };
export type CurriculumTreeLevel = { level: { id: string; name: string; sortOrder?: number; status?: string }; topics: CurriculumTreeTopic[] };
export type CurriculumTreeSubject = { subject: { id: string; name: string; code: string; status?: string }; levels: CurriculumTreeLevel[] };
export type CurriculumTree = { subjects: CurriculumTreeSubject[] };

export function loadCurriculumTree(signal?: AbortSignal) {
  return apiRequest<CurriculumTree>(`${API_ENDPOINTS.curriculum.collection("tree")}?status=active`, { signal });
}

export function useCurriculumTreeQuery() {
  return useQuery({
    queryKey: ["lms", "curriculum", "tree", "active"] as const,
    queryFn: ({ signal }) => loadCurriculumTree(signal),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
  });
}
