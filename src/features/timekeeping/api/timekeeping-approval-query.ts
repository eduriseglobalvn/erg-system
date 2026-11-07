import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_POLICIES } from "@/lib/query-policy";
import { timekeepingApi } from "./timekeeping-api";
import type { ApprovalBox } from "./timekeeping-types";

export type ApprovalFilters = { box: ApprovalBox; type?: string; siteId?: string; due?: string };

const APPROVALS = ["timekeeping", "approvals"] as const;
const REQUESTS = ["timekeeping", "requests"] as const;
/** First page only: the backend cap for bulk approve is 50, so one page of 50 is also the selectable set. */
export const APPROVALS_PAGE_SIZE = 50;

export function useApprovals(filters: ApprovalFilters, enabled = true) {
  return useQuery({
    queryKey: [...APPROVALS, "list", filters] as const,
    queryFn: ({ signal }) => timekeepingApi.approvals({ ...filters, page: 0, size: APPROVALS_PAGE_SIZE }, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

/** Overdue requests waiting for the viewer ("n quá hạn" in the header). */
export function useOverdueApprovalCount() {
  return useQuery({
    queryKey: [...APPROVALS, "overdue-count"] as const,
    queryFn: ({ signal }) => timekeepingApi.approvals({ box: "MINE", due: "OVERDUE", size: 1 }, signal),
    select: (page) => page.total ?? 0,
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
}

export function useApprovalDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...APPROVALS, "detail", id ?? ""] as const,
    queryFn: ({ signal }) => timekeepingApi.approval(id as string, signal),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

/** Lists, the menu badge count (approvalsCount sits under the same prefix) and the teachers' own requests all change. */
function useInvalidateApprovals() {
  const queryClient = useQueryClient();
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: APPROVALS }), queryClient.invalidateQueries({ queryKey: REQUESTS })]);
}

/** Errors show inline next to the buttons, so the global toast is silenced. */
export function useApprovalDecision() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    meta: { silent: true },
    mutationFn: ({ id, decision, comment }: { id: string; decision: "approve" | "reject"; comment: string }) =>
      decision === "approve" ? timekeepingApi.approve(id, { comment }) : timekeepingApi.reject(id, { comment }),
    onSuccess: invalidate,
  });
}

export function useBulkApprove() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    meta: { silent: true },
    mutationFn: (requestIds: string[]) => timekeepingApi.bulkApprove({ requestIds }),
    onSettled: invalidate,
  });
}

/** The API has no bulk reject: one reject per request, all attempted, failures counted. */
export function useBulkReject() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    meta: { silent: true },
    mutationFn: async ({ ids, comment }: { ids: string[]; comment: string }) => {
      const results = await Promise.allSettled(ids.map((id) => timekeepingApi.reject(id, { comment })));
      return { rejected: ids.filter((_, i) => results[i].status === "fulfilled"), failed: results.filter((r) => r.status === "rejected").length };
    },
    onSettled: invalidate,
  });
}
