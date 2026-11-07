import type { ApprovalBox, BulkApproveResult, RequestView } from "../../api/timekeeping-types";
import { TYPE_TITLE } from "../../components/requests/request-model";

export type ApprovalTab = "mine" | "done" | "all";
export const TAB_BOX: Record<ApprovalTab, ApprovalBox> = { mine: "MINE", done: "DONE", all: "ALL" };

export const TYPE_OPTIONS = [{ label: "Mọi loại đơn", value: "" }, ...Object.entries(TYPE_TITLE).map(([value, label]) => ({ label, value }))];
export const DUE_OPTIONS = [
  { label: "Mọi hạn xử lý", value: "" },
  { label: "Quá hạn", value: "OVERDUE" },
  { label: "Đến hạn trong 24 giờ", value: "SOON" },
];

type Step = NonNullable<RequestView["steps"]>[number];

function roleName(resolver: string | undefined): string {
  if (!resolver || resolver === "MANAGER") return "Tổ trưởng";
  const role = resolver.replace(/^SCHOOL_ROLE:/, "");
  return role === "VICE_PRINCIPAL" ? "Phó hiệu trưởng" : role;
}

export type StepPosition = { label: string; role: string; next?: string };

/** The step a pending request waits at: "Bước 1/2 · Tổ trưởng", plus the role of the step after it. Skipped steps are not counted. */
export function stepPosition(request: RequestView | undefined): StepPosition | undefined {
  if (request?.status !== "PENDING") return undefined;
  const steps = (request.steps ?? []).filter((s): s is Step & { stepNo: number } => s.status !== "SKIPPED" && s.stepNo !== undefined);
  const numbers = [...new Set(steps.map((s) => s.stepNo))].sort((a, b) => a - b);
  const current = numbers.find((no) => steps.some((s) => s.stepNo === no && s.status === "WAITING"));
  if (current === undefined) return undefined;
  const roleAt = (no: number) => roleName(steps.find((s) => s.stepNo === no)?.resolver);
  const nextNo = numbers[numbers.indexOf(current) + 1];
  return { label: `Bước ${numbers.indexOf(current) + 1}/${numbers.length} · ${roleAt(current)}`, role: roleAt(current), next: nextNo === undefined ? undefined : roleAt(nextNo) };
}

/** "Duyệt thay Tổ trưởng · đơn chuyển tiếp đến Phó hiệu trưởng" */
export function onBehalfText(position: StepPosition | undefined): string {
  const role = position?.role ?? "người duyệt";
  return `Duyệt thay ${role} · ${position?.next ? `đơn chuyển tiếp đến ${position.next}` : "đơn được duyệt xong"}`;
}

/** "Đã duyệt 2 đơn · 1 đơn bỏ qua: Không đủ phép năm" (first reason; the full list is shown next to the bar). */
export function bulkSummary(result: BulkApproveResult): string {
  const approved = result.approved?.length ?? 0;
  const skipped = result.skipped ?? [];
  return `Đã duyệt ${approved} đơn${skipped.length ? ` · ${skipped.length} đơn bỏ qua: ${skipped[0].reason ?? "không rõ lý do"}` : ""}`;
}
