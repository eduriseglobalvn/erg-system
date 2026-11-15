import { getBackOfficePortal } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { createApiClient } from "@/lib/api/create-api-client";
import type { components } from "@/lib/api/generated/erg-openapi";
import { withQuery } from "./timekeeping-api";

type Schemas = components["schemas"];

export type MyTeachingMonth = Schemas["MyTeachingMonth"];
export type TeachingConfirmationView = Schemas["TeachingConfirmationView"];
export type TeachingPeriodPage = Schemas["TeachingPeriodPage"];
export type TeachingMonthSheet = Schemas["TeachingMonthSheet"];
export type TeachingExport = Schemas["TeachingExport"];
export type TeachingPeriodRow = Schemas["TeachingPeriodRow"];
export type TeachingRow = Schemas["TeachingRow"];
export type ConfirmTeachingCommand = Schemas["ConfirmTeachingCommand"];
export type ReportTeachingIssueCommand = Schemas["ReportTeachingIssueCommand"];

export type TeachingRole = "MAIN" | "ASSISTANT";
export type TeachingPeriodsParams = { role?: TeachingRole; from?: string; to?: string; schoolId?: string; teacherId?: string; q?: string; page?: number };

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });
const endpoints = API_ENDPOINTS.timekeeping.teaching;

/** Cong tiet day. `month` is `yyyy-MM`. The backend answers 501 until CBG B3-B8 land. */
export const timekeepingTeachingApi = {
  myMonth: (month: string, signal?: AbortSignal) =>
    client().request<MyTeachingMonth>(endpoints.myMonth(month), { signal, cache: "no-store" }),
  confirm: (month: string, body: ConfirmTeachingCommand) =>
    client().request<TeachingConfirmationView>(endpoints.confirm(month), { method: "POST", body: JSON.stringify(body) }),
  reportIssue: (month: string, body: ReportTeachingIssueCommand) =>
    client().request<TeachingConfirmationView>(endpoints.issue(month), { method: "POST", body: JSON.stringify(body) }),
  myPeriods: (month: string, role: TeachingRole, page: number, signal?: AbortSignal) =>
    client().request<TeachingPeriodPage>(withQuery(endpoints.myPeriods(month), { role, page }), { signal, cache: "no-store" }),
  adminPeriods: (params: TeachingPeriodsParams, signal?: AbortSignal) =>
    client().request<TeachingPeriodPage>(withQuery(endpoints.adminPeriods, params), { signal, cache: "no-store" }),
  adminMonth: (month: string, role: TeachingRole | undefined, signal?: AbortSignal) =>
    client().request<TeachingMonthSheet>(withQuery(endpoints.adminMonth(month), { role }), { signal, cache: "no-store" }),
  closeMonth: (month: string) => client().request<TeachingMonthSheet>(endpoints.adminMonthClose(month), { method: "POST" }),
  adminExport: (year: number, signal?: AbortSignal) =>
    client().request<TeachingExport>(withQuery(endpoints.adminExport, { year }), { signal, cache: "no-store" }),
};

export const teachingKeys = {
  root: ["timekeeping", "teaching"] as const,
  myMonth: (month: string) => ["timekeeping", "teaching", "me", month] as const,
  myPeriods: (month: string, role: TeachingRole, page: number) => ["timekeeping", "teaching", "me", month, "periods", role, page] as const,
  periods: (params: TeachingPeriodsParams) => ["timekeeping", "teaching", "admin", "periods", params] as const,
  adminMonth: (month: string, role: TeachingRole | undefined) => ["timekeeping", "teaching", "admin", "month", month, role ?? "all"] as const,
  adminExport: (year: number) => ["timekeeping", "teaching", "admin", "export", year] as const,
};
