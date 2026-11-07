import { getBackOfficePortal } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { createApiClient } from "@/lib/api/create-api-client";
import { withQuery } from "./timekeeping-api";
import type { PeriodLockView, RemindResult, Timesheet, TodayDashboard } from "./timekeeping-types";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });
const endpoints = API_ENDPOINTS.timekeeping.admin;

export type AdminTimesheetParams = { schoolId: string; period: string; team?: string; q?: string; page?: number; size?: number };

/** Admin side (timekeeping.manage). `siteId` on these endpoints is a school id. */
export const timekeepingAdminApi = {
  today: (params: { schoolId?: string; date?: string }, signal?: AbortSignal) =>
    client().request<TodayDashboard>(withQuery(endpoints.today, params), { signal, cache: "no-store" }),
  timesheet: (params: AdminTimesheetParams, signal?: AbortSignal) =>
    client().request<Timesheet>(withQuery(endpoints.timesheet, params), { signal, cache: "no-store" }),
  remind: (userIds: string[]) =>
    client().request<RemindResult>(endpoints.remind, { method: "POST", body: JSON.stringify({ userIds }) }),
  lockPeriod: (period: string, schoolId: string) =>
    client().request<PeriodLockView>(endpoints.periodLock(period), { method: "POST", body: JSON.stringify({ schoolId }) }),
  reopenPeriod: (period: string, schoolId: string, reason: string) =>
    client().request<PeriodLockView>(endpoints.periodReopen(period), { method: "POST", body: JSON.stringify({ schoolId, reason }) }),
};
