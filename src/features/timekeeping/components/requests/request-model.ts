import { formatDateTimeVi, formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import type { LeaveKind, RequestType, RequestView } from "../../api/timekeeping-types";
import { unitsVi } from "../my-timesheet/timesheet-summary";
import type { DayPart, ExplanationReason } from "./request-form-schema";

export type RequestFormType = "leave" | "explanation" | "wfh" | "business";
export type RequestsView =
  | { view: "list" }
  | { view: "picker" }
  | { view: "form"; type: RequestFormType; date?: string }
  | { view: "edit"; id: string }
  | { view: "detail"; id: string };

const FORM_TYPES: readonly RequestFormType[] = ["leave", "explanation", "wfh", "business"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const API_TYPE: Record<RequestFormType, RequestType> = { leave: "LEAVE", explanation: "EXPLANATION", wfh: "WFH", business: "BUSINESS" };
export const FORM_TYPE: Record<RequestType, RequestFormType> = { LEAVE: "leave", EXPLANATION: "explanation", WFH: "wfh", BUSINESS: "business" };

/** Reads `?id=`, `?edit=`, `?new=` and `?date=`; anything unrecognised falls back to the list. `?new=` with no value is the picker. */
export function parseRequestsSearch(search: Record<string, unknown>): RequestsView {
  const text = (key: string) => (typeof search[key] === "string" ? (search[key] as string).trim() : undefined);
  const id = text("id");
  if (id) return { view: "detail", id };
  const edit = text("edit");
  if (edit) return { view: "edit", id: edit };
  const created = text("new");
  if (created === undefined) return { view: "list" };
  const type = FORM_TYPES.find((known) => known === created);
  if (!type) return { view: "picker" };
  const date = text("date");
  return { view: "form", type, date: date && ISO_DATE.test(date) ? date : undefined };
}

export const LEAVE_KIND_LABEL: Record<LeaveKind, string> = {
  ANNUAL: "Phép năm",
  SICK: "Nghỉ ốm",
  PAID_PERSONAL: "Việc riêng có lương",
  UNPAID: "Không lương",
};
export const PART_LABEL: Record<DayPart, string> = { FULL: "Cả ngày", AM: "Buổi sáng", PM: "Buổi chiều" };
export const REASON_LABEL: Record<ExplanationReason, string> = {
  FORGOT: "Quên chấm",
  DEVICE: "Lỗi thiết bị",
  OUTSIDE: "Ngoài vùng chấm công",
  BUSINESS_TRIP: "Đi công tác",
};
export const TYPE_TITLE: Record<RequestType, string> = {
  LEAVE: "Nghỉ phép",
  EXPLANATION: "Giải trình chấm công",
  WFH: "Làm việc tại nhà",
  BUSINESS: "Công tác",
};

export const STATUS_CHIP: Record<NonNullable<RequestView["status"]>, { label: string; tone: "success" | "warning" | "error" | "neutral" }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  PENDING: { label: "Chờ duyệt", tone: "warning" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "error" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
};

export function requestTitle(r: RequestView): string {
  const base = r.type === "LEAVE" && r.leaveKind ? (r.leaveKind === "ANNUAL" ? "Nghỉ phép năm" : LEAVE_KIND_LABEL[r.leaveKind]) : TYPE_TITLE[r.type ?? "LEAVE"];
  return r.days ? `${base} · ${unitsVi(r.days)} ngày` : base;
}

/** "14/11/2026 – 15/11/2026", or one day with its half ("Buổi sáng"). */
export function requestTimeText(r: RequestView): string {
  if (r.type === "EXPLANATION") return formatDateVi(r.workDate);
  const from = formatDateVi(r.fromDate);
  const to = formatDateVi(r.toDate);
  if (from === to || !to) return r.part && r.part !== "FULL" ? `${from} · ${PART_LABEL[r.part]}` : from;
  return `${from} – ${to}`;
}

const NETWORK_MESSAGE = "Không kết nối được máy chủ. Thông tin bạn nhập vẫn được giữ, hãy thử lại.";

/** The server's Vietnamese message for API errors (422 balance, 409 overlap/locked, 422 no approver, 429 remind); a fixed text when the network failed. */
export function requestErrorText(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status !== "number" || status === 0 || !(error instanceof Error) || !error.message ? NETWORK_MESSAGE : error.message;
}

export type TimelineStep = { state: "done" | "current" | "todo" | "rejected"; title: string; meta: string };
type Step = NonNullable<RequestView["steps"]>[number];

function roleLabel(resolver: string | undefined): string {
  if (!resolver || resolver === "MANAGER") return "Quản lý trực tiếp";
  const role = resolver.replace(/^SCHOOL_ROLE:/, "");
  return role === "VICE_PRINCIPAL" ? "Phó hiệu trưởng" : role;
}

function groupStep(group: Step[], isCurrent: boolean): TimelineStep {
  const role = roleLabel(group[0].resolver);
  const names = [...new Set(group.map((s) => s.approverName).filter(Boolean))].join(", ");
  const acted = group.find((s) => s.status === "APPROVED" || s.status === "REJECTED");
  const parts: string[] = names ? [role] : [];
  let state: TimelineStep["state"] = "todo";
  if (acted) {
    state = acted.status === "APPROVED" ? "done" : "rejected";
    parts.push([acted.status === "APPROVED" ? "đã duyệt" : "từ chối", formatDateTimeVi(acted.actedAt)].filter(Boolean).join(" · "));
    if (acted.onBehalf) parts.push("duyệt thay");
    if (acted.comment) parts.push(`"${acted.comment}"`);
  } else if (isCurrent) {
    state = "current";
    const viewed = group.map((s) => formatTimeVi(s.viewedAt)).filter(Boolean).sort()[0];
    parts.push(viewed ? `đang chờ · đã xem ${viewed}` : "đang chờ · chưa xem");
    const due = group.map((s) => s.dueAt).find(Boolean);
    if (due) parts.push(`Hạn xử lý ${formatDateVi(due).slice(0, 5)}`);
  } else {
    parts.push("chưa tới");
  }
  return { state, title: names || role, meta: parts.join(" · ") };
}

/** "Đã gửi đơn" followed by one entry per approval step (approvers of one step are grouped; skipped steps are left out). */
export function timelineSteps(r: RequestView): TimelineStep[] {
  const byNo = new Map<number, Step[]>();
  for (const step of r.steps ?? []) {
    if (step.status === "SKIPPED" || step.stepNo === undefined) continue;
    byNo.set(step.stepNo, [...(byNo.get(step.stepNo) ?? []), step]);
  }
  const groups = [...byNo.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
  const waiting = r.status === "PENDING" ? groups.find((g) => g.some((s) => s.status === "WAITING")) : undefined;
  return [
    { state: "done", title: "Đã gửi đơn", meta: formatDateTimeVi(r.submittedAt) },
    ...groups.map((group) => groupStep(group, group === waiting)),
  ];
}
