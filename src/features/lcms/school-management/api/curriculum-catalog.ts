import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { QUERY_POLICIES } from "@/lib/query-policy";

export type CurriculumLevelCatalogItem = {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
};

export type CurriculumSubjectCatalogItem = {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  levels: CurriculumLevelCatalogItem[];
};

type ApiCurriculumTree = {
  subjects?: Array<{
    subject?: { id?: string; code?: string; name?: string; description?: string };
    levels?: Array<{
      level?: { id?: string; code?: string; name?: string; description?: string; sortOrder?: number };
    }>;
  }>;
};

/** Throws when the tree cannot be read: allocating an id the server does not know would 404, so there is no local fallback. */
export async function fetchCurriculumCatalog(signal?: AbortSignal): Promise<CurriculumSubjectCatalogItem[]> {
  const res = await apiRequest<ApiCurriculumTree>(API_ENDPOINTS.curriculum.activeTree, { signal });
  if (!res || !Array.isArray(res.subjects)) throw new Error("Danh mục chương trình không hợp lệ.");
  const results: CurriculumSubjectCatalogItem[] = [];
  for (const item of res.subjects) {
    const s = item.subject;
    if (!s?.id || !s.name) continue;
    const levels: CurriculumLevelCatalogItem[] = [];
    for (const lvl of item.levels || []) {
      const l = lvl.level;
      if (!l?.id || !l.name) continue;
      levels.push({ id: l.id, code: l.code || l.id, name: l.name, description: l.description, sortOrder: l.sortOrder ?? 0 });
    }
    results.push({ id: s.id, code: s.code || s.id, name: s.name, description: s.description, levels });
  }
  return results;
}

export const curriculumCatalogQueryKey = ["lcms", "curriculum-catalog"] as const;

export function useCurriculumCatalogQuery() {
  return useQuery({
    queryKey: curriculumCatalogQueryKey,
    queryFn: ({ signal }) => fetchCurriculumCatalog(signal),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
  });
}
