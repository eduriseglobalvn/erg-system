import { useQuery } from "@tanstack/react-query";
import type { HelpGuide } from "@/features/help/help-types";
import { apiRequest, getBackOfficePortal } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { QUERY_POLICIES } from "@/lib/query-policy";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

export type HelpFaq = { id: string; category: string; question: string; answer: string };

// One chunk per portal: a student never downloads the admin guide.
const GUIDE_LOADERS: Record<Workspace, () => Promise<{ default: HelpGuide }>> = {
  ADMIN: () => import("@/features/help/guides/admin-guide"),
  TEACHER: () => import("@/features/help/guides/teacher-guide"),
  STUDENT: () => import("@/features/help/guides/student-guide"),
  CRM: () => import("@/features/help/guides/crm-guide"),
};

function requestPortal(workspace: Workspace) {
  if (workspace === "TEACHER") return "lms" as const;
  if (workspace === "STUDENT") return "elearning" as const;
  return getBackOfficePortal();
}

export function useHelpGuideQuery(workspace: Workspace) {
  return useQuery({
    gcTime: Infinity,
    // The guide is a bundled chunk, not a server call: load it even when the device reports offline.
    networkMode: "always",
    queryFn: async () => (await GUIDE_LOADERS[workspace]()).default,
    queryKey: ["help", "guide", workspace],
    staleTime: Infinity,
  });
}

export function useHelpFaqsQuery(workspace: Workspace) {
  return useQuery({
    gcTime: QUERY_POLICIES.reference.gcTime,
    queryFn: ({ signal }) =>
      apiRequest<HelpFaq[]>(`${API_ENDPOINTS.help.faqs}?${new URLSearchParams({ portal: workspace })}`, {
        portal: requestPortal(workspace),
        signal,
      }),
    queryKey: ["help", "faqs", workspace],
    retry: 1,
    staleTime: QUERY_POLICIES.reference.staleTime,
  });
}
