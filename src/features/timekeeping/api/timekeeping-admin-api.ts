import { getBackOfficePortal } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { createApiClient } from "@/lib/api/create-api-client";
import { withQuery } from "./timekeeping-api";
import type {
  HolidayCommand,
  HolidayConfig,
  PeriodLockView,
  PolicyCommand,
  PolicyConfig,
  PolicyVersions,
  PunchReviewCommand,
  RecentPunch,
  RemindResult,
  RemoteRuleCommand,
  RemoteRuleConfig,
  ShiftCommand,
  ShiftConfig,
  SiteCommand,
  SiteConfig,
  Timesheet,
  TodayDashboard,
} from "./timekeeping-types";

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
  reviewPunch: (id: string, body: PunchReviewCommand) =>
    client().request<RecentPunch>(endpoints.punchReview(id), { method: "POST", body: JSON.stringify(body) }),
  // ---- configuration (A04)
  sites: (schoolId: string, signal?: AbortSignal) => client().request<SiteConfig[]>(withQuery(endpoints.sites, { schoolId }), { signal, cache: "no-store" }),
  saveSite: (id: string | undefined, body: SiteCommand) =>
    client().request<SiteConfig>(id ? endpoints.site(id) : endpoints.sites, { method: id ? "PUT" : "POST", body: JSON.stringify(body) }),
  deleteSite: (id: string) => client().request<void>(endpoints.site(id), { method: "DELETE" }),
  shifts: (schoolId: string, signal?: AbortSignal) => client().request<ShiftConfig[]>(withQuery(endpoints.shifts, { schoolId }), { signal, cache: "no-store" }),
  saveShift: (id: string | undefined, body: ShiftCommand) =>
    client().request<ShiftConfig>(id ? endpoints.shift(id) : endpoints.shifts, { method: id ? "PUT" : "POST", body: JSON.stringify(body) }),
  deleteShift: (id: string) => client().request<void>(endpoints.shift(id), { method: "DELETE" }),
  policy: (schoolId: string, signal?: AbortSignal) => client().request<PolicyVersions>(endpoints.policy(schoolId), { signal, cache: "no-store" }),
  savePolicy: (schoolId: string, body: PolicyCommand) =>
    client().request<PolicyConfig>(endpoints.policy(schoolId), { method: "PUT", body: JSON.stringify(body) }),
  holidays: (params: { schoolId: string; year: number }, signal?: AbortSignal) =>
    client().request<HolidayConfig[]>(withQuery(endpoints.holidays, params), { signal, cache: "no-store" }),
  createHoliday: (body: HolidayCommand) => client().request<HolidayConfig>(endpoints.holidays, { method: "POST", body: JSON.stringify(body) }),
  deleteHoliday: (id: string) => client().request<void>(endpoints.holiday(id), { method: "DELETE" }),
  remoteRules: (schoolId: string, signal?: AbortSignal) =>
    client().request<RemoteRuleConfig[]>(withQuery(endpoints.remoteRules, { schoolId }), { signal, cache: "no-store" }),
  saveRemoteRule: (id: string | undefined, body: RemoteRuleCommand) =>
    client().request<RemoteRuleConfig>(id ? endpoints.remoteRule(id) : endpoints.remoteRules, { method: id ? "PUT" : "POST", body: JSON.stringify(body) }),
  deleteRemoteRule: (id: string) => client().request<void>(endpoints.remoteRule(id), { method: "DELETE" }),
};
