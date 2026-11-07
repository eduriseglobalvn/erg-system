import type { ExplanationContext, RequestCommand } from "../../api/timekeeping-types";

export type DayPart = NonNullable<RequestCommand["part"]>;
export type ExplanationReason = NonNullable<RequestCommand["explanationReason"]>;
export type LeaveKindValue = NonNullable<RequestCommand["leaveKind"]>;

export type LeaveFormValues = { kind: LeaveKindValue; from: string; to: string; part: DayPart; reason: string };
export type ExplanationFormValues = { date: string; reason: ExplanationReason; proposedOut: string; note: string };

type Errors<T> = Partial<Record<keyof T, string>>;

/** Explanations of these reasons need the OUT time the teacher proposes (the backend requires it too). */
const NEEDS_OUT: readonly ExplanationReason[] = ["FORGOT", "DEVICE"];

/** Checks the date range and reason; also used by the WFH and business-trip forms (only `from`, `to`, `part`, `reason` count). */
export function validateLeave(v: Pick<LeaveFormValues, "from" | "to" | "part" | "reason">): Errors<LeaveFormValues> {
  const errors: Errors<LeaveFormValues> = {};
  if (!v.from) errors.from = "Chọn ngày bắt đầu";
  if (!v.to) errors.to = "Chọn ngày kết thúc";
  else if (v.from && v.to < v.from) errors.to = "Ngày kết thúc phải sau ngày bắt đầu";
  else if (v.part !== "FULL" && v.from !== v.to) errors.part = "Nghỉ buổi sáng hoặc buổi chiều chỉ áp dụng cho một ngày";
  if (!v.reason.trim()) errors.reason = "Nhập lý do";
  return errors;
}

export function validateExplanation(
  v: ExplanationFormValues,
  ctx: Pick<ExplanationContext, "remaining">,
): Errors<ExplanationFormValues> & { form?: string } {
  const errors: Errors<ExplanationFormValues> & { form?: string } = {};
  if (ctx.remaining === 0) errors.form = "Đã dùng hết 3 lượt giải trình tháng này";
  if (!v.date) errors.date = "Chọn ngày giải trình";
  if (NEEDS_OUT.includes(v.reason) && !v.proposedOut) errors.proposedOut = "Chọn giờ ra đề nghị";
  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
