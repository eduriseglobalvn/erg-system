import { getBackOfficePortal } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { createApiClient } from "@/lib/api/create-api-client";
import type { ContractRequestPath } from "@/lib/api/contract-types";
import type {
  ApprovalBox,
  ApprovalComment,
  ApprovalDetail,
  ApprovalPage,
  BulkApproveCommand,
  BulkApproveResult,
  ClockView,
  DayDetailView,
  ExplanationContext,
  LeavePreview,
  MonthView,
  PunchInput,
  PunchResult,
  RequestCommand,
  RequestPage,
  RequestView,
  TodayView,
} from "./timekeeping-types";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });
const endpoints = API_ENDPOINTS.timekeeping;

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const suffix = search.toString();
  return (suffix ? `${path}?${suffix}` : path) as ContractRequestPath;
}

/** One key per user attempt: the caller creates it and passes the same value on every retry. Safari < 15.4 has no randomUUID. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function buildPunchFormData(input: PunchInput): FormData {
  const form = new FormData();
  form.set("direction", input.direction);
  if (input.lat !== undefined) form.set("lat", String(input.lat));
  if (input.lng !== undefined) form.set("lng", String(input.lng));
  if (input.accuracyM !== undefined) form.set("accuracyM", String(input.accuracyM));
  form.set("mockReported", String(input.mockReported ?? false));
  if (input.reason) form.set("reason", input.reason);
  if (input.photo) form.set("photo", input.photo, "punch.jpg");
  return form;
}

export const timekeepingApi = {
  clock: (signal?: AbortSignal): Promise<ClockView> =>
    client().request<ClockView>(endpoints.me.clock, { signal, cache: "no-store" }),
  today: (signal?: AbortSignal) => client().request<TodayView>(endpoints.me.today, { signal, cache: "no-store" }),
  punch: (input: PunchInput, idempotencyKey: string) =>
    client().request<PunchResult>(endpoints.me.punches, {
      method: "POST",
      body: buildPunchFormData(input),
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  recordFaceConsent: () => client().request<void>(endpoints.me.faceConsent, { method: "POST" }),
  month: (period: string, signal?: AbortSignal) =>
    client().request<MonthView>(withQuery(endpoints.me.month, { period }), { signal }),
  day: (date: string, signal?: AbortSignal) => client().request<DayDetailView>(endpoints.me.day(date) as ContractRequestPath, { signal }),

  createRequest: (body: RequestCommand) =>
    client().request<RequestView>(endpoints.requests.root, { method: "POST", body: JSON.stringify(body) }),
  updateRequest: (id: string, body: RequestCommand) =>
    client().request<RequestView>(endpoints.requests.detail(id), { method: "PUT", body: JSON.stringify(body) }),
  submitRequest: (id: string) => client().request<RequestView>(endpoints.requests.submit(id), { method: "POST" }),
  cancelRequest: (id: string) => client().request<RequestView>(endpoints.requests.cancel(id), { method: "POST" }),
  remindRequest: (id: string) => client().request<RequestView>(endpoints.requests.remind(id), { method: "POST" }),
  myRequests: (params: { status?: string; page?: number; size?: number } = {}, signal?: AbortSignal) =>
    client().request<RequestPage>(withQuery(endpoints.requests.mine, params), { signal }),
  request: (id: string, signal?: AbortSignal) => client().request<RequestView>(endpoints.requests.detail(id), { signal }),
  previewLeave: (params: { from: string; to: string; kind: string; part?: string }, signal?: AbortSignal) =>
    client().request<LeavePreview>(withQuery(endpoints.requests.previewLeave, params), { signal }),
  explanationContext: (date: string, signal?: AbortSignal) =>
    client().request<ExplanationContext>(withQuery(endpoints.requests.explanationContext, { date }), { signal }),

  approvals: (params: { box?: ApprovalBox; type?: string; siteId?: string; due?: string; page?: number; size?: number } = {}, signal?: AbortSignal) =>
    client().request<ApprovalPage>(withQuery(endpoints.approvals.root, params), { signal }),
  approval: (requestId: string, signal?: AbortSignal) =>
    client().request<ApprovalDetail>(endpoints.approvals.detail(requestId), { signal }),
  approve: (requestId: string, body: ApprovalComment = {}) =>
    client().request<RequestView>(endpoints.approvals.approve(requestId), { method: "POST", body: JSON.stringify(body) }),
  reject: (requestId: string, body: ApprovalComment) =>
    client().request<RequestView>(endpoints.approvals.reject(requestId), { method: "POST", body: JSON.stringify(body) }),
  bulkApprove: (body: BulkApproveCommand) =>
    client().request<BulkApproveResult>(endpoints.approvals.bulkApprove, { method: "POST", body: JSON.stringify(body) }),
};
