import type { SchoolPeriodAssignment } from "@/features/teaching-calendar/api/teaching-calendar-period-times-api";
import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { formatDateVi } from "@/domain/formatters/format-date";

export type PeriodSession = TeachingPeriodTemplate["slots"][number]["session"];
type Slot = TeachingPeriodTemplate["slots"][number];

export const SESSION_ORDER: readonly PeriodSession[] = ["MORNING", "AFTERNOON", "EVENING"];
export const SESSION_TITLES: Record<PeriodSession, string> = { AFTERNOON: "BUỔI CHIỀU", EVENING: "BUỔI TỐI", MORNING: "BUỔI SÁNG" };
export const MAX_ROWS = 12;
export const MAX_TIMED = 10;
const NAME_MAX = 80;
const SESSION_START: Record<PeriodSession, string> = { AFTERNOON: "13:30", EVENING: "18:00", MORNING: "07:00" };
const DEFAULT_LENGTH = 45;

/** Mot dong tiet dang sua. `key` on dinh qua cac lan sap xep; so tiet danh lai theo thu tu dong. */
export type PeriodRow = { enabled: boolean; end: string; key: number; session: PeriodSession; start: string };

export const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
export const toTime = (total: number) => `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
const valid = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export const rowsFromSlots = (slots: readonly Slot[]): PeriodRow[] => [...slots]
  .sort((a, b) => a.periodNo - b.periodNo)
  .map((slot, key) => ({ enabled: Boolean(slot.startTime && slot.endTime), end: slot.endTime ?? "", key, session: slot.session, start: slot.startTime ?? "" }));

/** Tiet tat -> gio null (BE dung null = tiet khong dung). */
export const slotsFromRows = (rows: readonly PeriodRow[]) => rows.map((row, index) => ({
  endTime: row.enabled ? row.end : null, periodNo: index + 1, session: row.session, startTime: row.enabled ? row.start : null,
}));

/** Phut moi tiet neu moi tiet co gio deu dai bang nhau; khong thi undefined. */
export function periodLength(slots: ReadonlyArray<{ endTime?: string | null; startTime?: string | null }>): number | undefined {
  const lengths = new Set(slots.filter((slot) => slot.startTime && slot.endTime).map((slot) => toMinutes(slot.endTime as string) - toMinutes(slot.startTime as string)));
  return lengths.size === 1 ? [...lengths][0] : undefined;
}

/** Ra choi giua hai tiet co gio lien nhau: phut, hoac 0 neu khong co. */
export function breakBefore(previous: { endTime?: string | null } | undefined, slot: { startTime?: string | null }): number {
  if (!previous?.endTime || !slot.startTime) return 0;
  return Math.max(0, toMinutes(slot.startTime) - toMinutes(previous.endTime));
}

const sessionRank = (session: PeriodSession) => SESSION_ORDER.indexOf(session);
const stable = (rows: PeriodRow[]) => [...rows].sort((a, b) => sessionRank(a.session) - sessionRank(b.session));
const nextKey = (rows: readonly PeriodRow[]) => rows.reduce((max, row) => Math.max(max, row.key), -1) + 1;

/** Gio goi y cho dong moi/bat lai: noi tiep tiet co gio truoc do (cung buoi truoc, khong thi gio mac dinh cua buoi). */
function suggestTimes(rows: readonly PeriodRow[], session: PeriodSession, length: number) {
  const before = [...rows].reverse().find((row) => row.enabled && row.end && sessionRank(row.session) <= sessionRank(session));
  const start = before && before.session === session ? before.end : SESSION_START[session];
  return { end: toTime(toMinutes(start) + length), start };
}

export function addRow(rows: readonly PeriodRow[], session: PeriodSession): PeriodRow[] {
  if (rows.length >= MAX_ROWS) return [...rows];
  const length = periodLength(rows.filter((row) => row.enabled).map((row) => ({ endTime: row.end, startTime: row.start }))) ?? DEFAULT_LENGTH;
  return stable([...rows, { ...suggestTimes(rows, session, length), enabled: true, key: nextKey(rows), session }]);
}

export function removeRow(rows: readonly PeriodRow[], key: number): PeriodRow[] {
  return rows.filter((row) => row.key !== key);
}

export function toggleRow(rows: readonly PeriodRow[], key: number): PeriodRow[] {
  return rows.map((row) => {
    if (row.key !== key) return row;
    if (row.enabled) return { ...row, enabled: false };
    return row.start && row.end ? { ...row, enabled: true } : { ...row, ...suggestTimes(rows.filter((other) => other.key !== key), row.session, DEFAULT_LENGTH), enabled: true };
  });
}

/** Go so 0715 hoac 7:15 thanh 07:15: o gio la o text 24 gio, khong dung type=time (hien AM/PM theo may). */
export function formatTimeInput(raw: string): string {
  if (raw.includes(":")) return raw.replace(/[^0-9:]/g, "").slice(0, 5);
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export const setRowTime = (rows: readonly PeriodRow[], key: number, field: "end" | "start", value: string): PeriodRow[] => rows.map((row) => (row.key === key ? { ...row, [field]: formatTimeInput(value) } : row));

export type PeriodIssue = { code: string; key?: number };

/** Kiem tra phia client giong BE (PeriodTemplateAdminService.validSlots) de bao loi truoc khi gui. */
export function validateRows(rows: readonly PeriodRow[]): PeriodIssue | null {
  if (!rows.length || rows.length > MAX_ROWS) return { code: "PERIODS_COUNT_INVALID" };
  const timed = timedCount(rows);
  if (timed === 0) return { code: "NO_TIMED_PERIOD" };
  if (timed > MAX_TIMED) return { code: "TOO_MANY_TIMED_PERIODS" };
  let lastEnd = -1;
  for (const row of rows) {
    if (!row.enabled) continue;
    if (!valid(row.start) || !valid(row.end)) return { code: "PERIOD_TIME_INVALID", key: row.key };
    if (toMinutes(row.start) >= toMinutes(row.end)) return { code: "PERIOD_TIME_ORDER", key: row.key };
    if (toMinutes(row.start) < lastEnd) return { code: "PERIOD_TIME_OVERLAP", key: row.key };
    lastEnd = toMinutes(row.end);
  }
  return null;
}

const ISSUE_COPY: Record<string, string> = {
  INVALID_DATE: "Chọn ngày áp dụng hợp lệ.",
  NO_TIMED_PERIOD: "Cần ít nhất một tiết có giờ.",
  PERIODS_COUNT_INVALID: `Một bảng giờ có từ 1 đến ${MAX_ROWS} tiết.`,
  PERIOD_NUMBERS_INVALID: "Số tiết phải liên tục từ 1.",
  PERIOD_TIME_INCOMPLETE: "Mỗi tiết cần cả giờ bắt đầu và kết thúc.",
  PERIOD_TIME_INVALID: "Giờ không hợp lệ (HH:mm).",
  PERIOD_TIME_ORDER: "Giờ kết thúc phải sau giờ bắt đầu.",
  PERIOD_TIME_OVERLAP: "Tiết bắt đầu trước khi tiết trước kết thúc.",
  SESSION_ORDER_INVALID: "Tiết buổi sáng phải đứng trước buổi chiều và buổi tối.",
  TEMPLATE_IN_USE: "Bảng giờ này đang được lịch sử dụng nên không sửa được. Lưu thành bảng mới với ngày áp dụng khác.",
  TEMPLATE_NAME_EMPTY: "Tên bảng giờ không được để trống.",
  TEMPLATE_NAME_TOO_LONG: `Tên bảng giờ tối đa ${NAME_MAX} ký tự.`,
  TOO_MANY_TIMED_PERIODS: `Tối đa ${MAX_TIMED} tiết có giờ mỗi ngày. Tắt bớt một tiết.`,
};

/** Ma loi (client hoac BE `extensions.code`) -> cau tieng Viet. */
export const periodIssueMessage = (code: string | undefined) => (code && ISSUE_COPY[code]) || "Chưa lưu được giờ tiết. Thử lại sau.";

export const timedCount = (rows: readonly PeriodRow[]) => rows.filter((row) => row.enabled).length;

/** Bang giờ hiệu lực ở `date`: bảng dated mới nhất có `effectiveFrom <= date` (null = bảng có từ đầu); không có thì bảng mới nhất. */
export function assignmentForDate(assignments: readonly SchoolPeriodAssignment[], date: string): SchoolPeriodAssignment | undefined {
  const dated = [...assignments].sort((a, b) => (b.effectiveFrom ?? "").localeCompare(a.effectiveFrom ?? ""));
  return dated.find((assignment) => (assignment.effectiveFrom ?? "") <= date) ?? dated[dated.length - 1];
}

export const currentAssignment = (assignments: readonly SchoolPeriodAssignment[]) => assignments.find((assignment) => assignment.current);

/** Khoa on dinh cua mot bang gio cua truong (moi ngay ap dung la mot bang). */
export const assignmentKey = (assignment: Pick<SchoolPeriodAssignment, "effectiveFrom">) => assignment.effectiveFrom ?? "base";

export const assignmentLabel = (assignment: Pick<SchoolPeriodAssignment, "effectiveFrom">) => (assignment.effectiveFrom ? `Áp dụng từ ${formatDateVi(assignment.effectiveFrom)}` : "Bảng ban đầu");

/** Ten bang gio moi: «THCS Trương Công Định · từ 01/11/2026» (cat de khong qua 80 ky tu). */
export const templateName = (schoolName: string, effectiveFrom: string) => `${schoolName.trim()} · từ ${formatDateVi(effectiveFrom)}`.slice(0, NAME_MAX);
