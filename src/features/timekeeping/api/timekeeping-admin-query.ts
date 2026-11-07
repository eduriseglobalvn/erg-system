import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSchoolDirectory, schoolManagementQueryKeys } from "@/features/lcms/school-management/api/school-management-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccountId } from "@/platform/auth/api/auth-storage";
import { timekeepingAdminApi, type AdminTimesheetParams } from "./timekeeping-admin-api";
import { timekeepingKeys } from "./timekeeping-query";
import type { PunchReviewCommand } from "./timekeeping-types";

const adminKeys = {
  today: (schoolId: string, date: string) => [...timekeepingKeys.root, "admin", "today", schoolId, date] as const,
  timesheet: (params: AdminTimesheetParams) => [...timekeepingKeys.root, "admin", "timesheet", params] as const,
  todayRoot: [...timekeepingKeys.root, "admin", "today"] as const,
  timesheetRoot: [...timekeepingKeys.root, "admin", "timesheet"] as const,
};

export const TODAY_REFRESH_MS = 60_000;

/** Polls only while the tab is visible and online; focus/reconnect refetches restart the interval after a pause. */
export function todayRefetchInterval(): number | false {
  return document.visibilityState === "visible" && navigator.onLine ? TODAY_REFRESH_MS : false;
}

/** Never persisted: a stale "who is in" board is worse than none. */
export function useAdminToday(schoolId: string, date: string) {
  return useQuery({
    queryKey: adminKeys.today(schoolId, date),
    queryFn: ({ signal }) => timekeepingAdminApi.today({ schoolId: schoolId || undefined, date }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: todayRefetchInterval,
    refetchIntervalInBackground: false,
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

export function useAdminTimesheet(params: AdminTimesheetParams, enabled = true) {
  return useQuery({
    queryKey: adminKeys.timesheet(params),
    queryFn: ({ signal }) => timekeepingAdminApi.timesheet(params, signal),
    enabled: enabled && Boolean(params.schoolId),
    placeholderData: keepPreviousData,
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

export function useRemind() {
  return useMutation({ mutationFn: (userIds: string[]) => timekeepingAdminApi.remind(userIds) });
}

/** Reviewing a FLAGGED / PENDING_REVIEW punch; the error shows in the dialog. */
export function usePunchReview() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: ({ id, ...body }: PunchReviewCommand & { id: string }) => timekeepingAdminApi.reviewPunch(id, body),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: adminKeys.todayRoot }), queryClient.invalidateQueries({ queryKey: adminKeys.timesheetRoot })]),
  });
}

/** Lock/reopen errors (409 "Còn n đơn chưa duyệt…") show inside the dialog, so the global toast is silenced. */
export function usePeriodLock(period: string, schoolId: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: adminKeys.timesheetRoot });
  const lock = useMutation({ meta: { silent: true }, mutationFn: () => timekeepingAdminApi.lockPeriod(period, schoolId), onSuccess });
  const reopen = useMutation({
    meta: { silent: true },
    mutationFn: (reason: string) => timekeepingAdminApi.reopenPeriod(period, schoolId, reason),
    onSuccess,
  });
  return { lock, reopen };
}

/** Schools ("cơ sở") of the tenant, from the same directory the school management screens use. */
export function useTimekeepingSchools() {
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccountId("lcms");
  return useQuery({
    queryKey: schoolManagementQueryKeys.directory(tenantId, accountId),
    queryFn: ({ signal }) => getSchoolDirectory("", signal),
    select: (directory) => directory.items.map((school) => ({ id: school.id, name: school.name })),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
  });
}
