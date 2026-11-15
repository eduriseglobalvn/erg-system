import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_POLICIES } from "@/lib/query-policy";
import { timekeepingTeachingApi, teachingKeys, type ConfirmTeachingCommand, type TeachingPeriodsParams, type TeachingRole } from "../../api/timekeeping-teaching-api";

/** "Công của tôi" of one month. A teacher without teaching gets an empty month; the page hides the tab then. */
export function useMyTeachingMonth(month: string) {
  return useQuery({
    queryKey: teachingKeys.myMonth(month),
    queryFn: ({ signal }) => timekeepingTeachingApi.myMonth(month, signal),
    staleTime: QUERY_POLICIES.sensitive.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
    retry: false,
  });
}

/** Confirm and report-issue: both answer with the new confirmation, so the month is simply refetched. */
export function useMyTeachingActions(month: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: teachingKeys.myMonth(month) });
  const confirm = useMutation({
    mutationFn: (body: ConfirmTeachingCommand) => timekeepingTeachingApi.confirm(month, body),
    onSettled: refresh,
    meta: { silent: true },
  });
  const issue = useMutation({
    mutationFn: (note: string) => timekeepingTeachingApi.reportIssue(month, { note }),
    onSettled: refresh,
    meta: { silent: true },
  });
  return { confirm, issue };
}

export function useMyTeachingPeriods(month: string, role: TeachingRole, page: number, enabled: boolean) {
  return useQuery({
    queryKey: teachingKeys.myPeriods(month, role, page),
    queryFn: ({ signal }) => timekeepingTeachingApi.myPeriods(month, role, page, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: QUERY_POLICIES.sensitive.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

export function useTeachingPeriods(params: TeachingPeriodsParams, enabled = true) {
  return useQuery({
    queryKey: teachingKeys.periods(params),
    queryFn: ({ signal }) => timekeepingTeachingApi.adminPeriods(params, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useTeachingMonthSheet(month: string, role: TeachingRole, enabled = true) {
  return useQuery({
    queryKey: teachingKeys.adminMonth(month, role),
    queryFn: ({ signal }) => timekeepingTeachingApi.adminMonth(month, role, signal),
    enabled,
    staleTime: QUERY_POLICIES.sensitive.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

/** Teachers who have not confirmed the current month yet, for the admin menu badge. Silent on error: the badge just disappears. */
export function useUnconfirmedTeachersCount(month: string, enabled: boolean) {
  return useQuery({
    queryKey: teachingKeys.adminMonth(month, "MAIN"),
    queryFn: ({ signal }) => timekeepingTeachingApi.adminMonth(month, "MAIN", signal),
    select: (sheet) => Math.max(0, (sheet.teacherCount ?? 0) - (sheet.confirmedCount ?? 0)),
    enabled,
    retry: false,
    meta: { silent: true },
    staleTime: QUERY_POLICIES.sensitive.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

export function useCloseTeachingMonth(month: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => timekeepingTeachingApi.closeMonth(month),
    onSettled: () => client.invalidateQueries({ queryKey: teachingKeys.root }),
    meta: { silent: true },
  });
}
