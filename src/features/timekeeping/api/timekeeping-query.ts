import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_POLICIES } from "@/lib/query-policy";
import { timekeepingApi } from "./timekeeping-api";
import type { ApprovalBox, PunchInput } from "./timekeeping-types";

// Never opt `clock` or `today` into meta.persist: stale punch state offline is worse than none (see query-persistence.ts).
export const timekeepingKeys = {
  root: ["timekeeping"] as const,
  clock: ["timekeeping", "clock"] as const,
  today: ["timekeeping", "today"] as const,
  month: (period: string) => ["timekeeping", "month", period] as const,
  day: (date: string) => ["timekeeping", "day", date] as const,
  myRequests: (status?: string) => ["timekeeping", "requests", "mine", status ?? "all"] as const,
  request: (id: string) => ["timekeeping", "requests", id] as const,
  approvalsCount: ["timekeeping", "approvals", "count"] as const,
  approvals: (box: ApprovalBox, type?: string) => ["timekeeping", "approvals", box, type ?? "all"] as const,
};

export function useTimekeepingToday(enabled = true) {
  return useQuery({
    queryKey: timekeepingKeys.today,
    queryFn: ({ signal }) => timekeepingApi.today(signal),
    enabled,
    staleTime: 0,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

export function useTimekeepingMonth(period: string) {
  return useQuery({
    queryKey: timekeepingKeys.month(period),
    queryFn: ({ signal }) => timekeepingApi.month(period, signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useTimekeepingDay(date: string | undefined) {
  return useQuery({
    queryKey: timekeepingKeys.day(date ?? ""),
    queryFn: ({ signal }) => timekeepingApi.day(date as string, signal),
    enabled: Boolean(date),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

/** Pending approvals for the admin menu badge; `enabled` should be the caller's `timekeeping.approve` check. */
export function usePendingApprovalCount(enabled: boolean) {
  return useQuery({
    queryKey: timekeepingKeys.approvalsCount,
    queryFn: ({ signal }) => timekeepingApi.approvals({ box: "MINE", size: 1 }, signal),
    select: (page) => page.total ?? 0,
    enabled,
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
}

/**
 * The key is created once per user attempt by the caller and reused on retry.
 * `networkMode: "always"` makes the request fail fast offline instead of pausing; paused mutations
 * would be dehydrated and replayed later, and a punch must never be sent after the fact.
 */
export function usePunchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    retry: false,
    meta: { silent: true }, // the punch screens show the failure inline
    mutationFn: ({ input, idempotencyKey }: { input: PunchInput; idempotencyKey: string }) =>
      timekeepingApi.punch(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timekeepingKeys.root }),
  });
}

export function useFaceConsentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => timekeepingApi.recordFaceConsent(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timekeepingKeys.today }),
  });
}
