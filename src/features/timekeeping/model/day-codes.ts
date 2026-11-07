import type { DayStatus, LeaveKind } from "../api/timekeeping-types";

export type DayCodeTone = "success" | "warning" | "info" | "error" | "neutral";
export type DayCodeValue = "X" | "M" | "½" | "P" | "Ô" | "CT" | "KC" | "KP" | "L" | "";

/** Timesheet symbols (plan, "Ký hiệu bảng công"); mirrors the backend's TimesheetService.code so G04/A02 match the exported sheet. */
export const DAY_CODE: Record<DayStatus, { code: DayCodeValue; label: string; tone: DayCodeTone }> = {
  FULL: { code: "X", label: "Đủ công", tone: "success" },
  LATE_EARLY: { code: "M", label: "Muộn / về sớm", tone: "warning" },
  HALF: { code: "½", label: "Nửa công", tone: "warning" },
  LEAVE: { code: "P", label: "Nghỉ phép", tone: "info" },
  SICK: { code: "Ô", label: "Nghỉ ốm", tone: "info" },
  BUSINESS: { code: "CT", label: "Công tác", tone: "info" },
  MISSING_PUNCH: { code: "KC", label: "Thiếu chấm", tone: "error" },
  ABSENT_UNPAID: { code: "KC", label: "Vắng không lương", tone: "error" },
  HOLIDAY: { code: "L", label: "Ngày lễ", tone: "neutral" },
  OFF: { code: "", label: "Ngày nghỉ", tone: "neutral" },
};

/** Unpaid leave is a LEAVE day whose kind is UNPAID: the sheet shows KP instead of P. */
export function dayCodeFor(status: DayStatus, leaveKind?: LeaveKind | null) {
  const base = DAY_CODE[status];
  return status === "LEAVE" && leaveKind === "UNPAID"
    ? { code: "KP" as const, label: "Nghỉ không lương", tone: "error" as const }
    : base;
}

const BY_CODE = new Map<string, { label: string; tone: DayCodeTone }>([
  ...Object.values(DAY_CODE).filter((entry) => entry.code).map((entry) => [entry.code, entry] as const).reverse(),
  ["KP", { label: "Nghỉ không lương", tone: "error" }],
]);

/** Label and tone of a code string from the admin sheet (X, M, ½, P, Ô, CT, KC, KP, L); null for "" (no shift). KC reads "Thiếu chấm". */
export const codeMeta = (code: string | undefined) => (code ? BY_CODE.get(code) ?? null : null);
