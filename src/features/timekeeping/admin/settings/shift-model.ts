import type { ShiftCommand, ShiftConfig } from "../../api/timekeeping-types";
import { hhmm } from "../../components/punch/punch-format";

export type ShiftForm = { name: string; start: string; end: string; workUnits: "0.5" | "1"; weekdays: number[]; active: boolean };
export type ShiftErrors = Partial<Record<"name" | "start" | "end" | "weekdays", string>>;

/** ISO weekdays 1..7. */
export const WEEKDAYS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 7, label: "CN" },
];

export const shiftToForm = (s?: ShiftConfig): ShiftForm => ({
  name: s?.name ?? "",
  start: hhmm(s?.startTime) || "07:30",
  end: hhmm(s?.endTime) || "16:30",
  workUnits: s?.workUnits === 0.5 ? "0.5" : "1",
  weekdays: s?.weekdays ? [...s.weekdays].sort((a, b) => a - b) : [1, 2, 3, 4, 5],
  active: s?.active ?? true,
});

/** Same limits as the backend: start from 02:00, end by 23:00, end after start (HH:mm compares as text). */
export function validateShift(f: ShiftForm): ShiftErrors {
  const errors: ShiftErrors = {};
  if (!f.name.trim()) errors.name = "Nhập tên ca";
  if (!f.start || f.start < "02:00") errors.start = "Giờ vào ca không sớm hơn 02:00";
  if (!f.end || f.end > "23:00") errors.end = "Giờ tan ca không muộn hơn 23:00";
  else if (f.start && f.end <= f.start) errors.end = "Giờ tan ca phải sau giờ vào ca";
  if (f.weekdays.length === 0) errors.weekdays = "Chọn ít nhất một ngày trong tuần";
  return errors;
}

export const formToShiftCommand = (f: ShiftForm, schoolId: string): ShiftCommand => ({
  schoolId,
  name: f.name.trim(),
  startTime: f.start,
  endTime: f.end,
  workUnits: Number(f.workUnits),
  weekdays: f.weekdays,
  active: f.active,
});
