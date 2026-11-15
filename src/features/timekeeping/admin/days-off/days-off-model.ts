import type {
  HolidayCommand,
  HolidayConfig,
  HolidayKind,
  HolidayPayMode,
  HolidayTeachingAction,
  SaturdayMode,
} from "../../api/timekeeping-types";

export const HOLIDAY_KIND_OPTIONS: ReadonlyArray<{ value: HolidayKind; label: string }> = [
  { value: "STATE", label: "Lễ nhà nước" },
  { value: "COMPANY", label: "Nghỉ công ty" },
  { value: "COMPENSATORY", label: "Nghỉ bù" },
];

export const PAY_MODE_OPTIONS: ReadonlyArray<{ value: HolidayPayMode; label: string; short: string }> = [
  { value: "PAID", label: "Có lương (L)", short: "có lương" },
  { value: "ANNUAL_LEAVE", label: "Trừ phép năm (P)", short: "trừ phép" },
  { value: "UNPAID", label: "Không lương (KL)", short: "không lương" },
];

export const TEACHING_ACTION_OPTIONS: ReadonlyArray<{ value: HolidayTeachingAction; label: string }> = [
  { value: "CANCEL", label: "Huỷ tiết" },
  { value: "KEEP", label: "Vẫn dạy" },
];

/** `segment` is the label of the radio in the month card, `tag` the label on the calendar cell. */
export const SATURDAY_MODE_OPTIONS: ReadonlyArray<{ value: SaturdayMode; segment: string; tag: string }> = [
  { value: "OFFICE", segment: "Đi làm", tag: "Lên công ty" },
  { value: "WFH", segment: "WFH", tag: "WFH" },
  { value: "PAID_OFF", segment: "Nghỉ (L)", tag: "Nghỉ có lương" },
  { value: "UNPAID_OFF", segment: "Nghỉ (KL)", tag: "Nghỉ không lương" },
];

export const kindLabel = (kind?: HolidayKind) => HOLIDAY_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? "";
export const payModeShort = (mode?: HolidayPayMode) => PAY_MODE_OPTIONS.find((option) => option.value === mode)?.short ?? "";

/** State holidays and compensatory days are paid by law; only company days pick a pay mode. */
export const isPayLocked = (kind?: HolidayKind) => kind === "STATE" || kind === "COMPENSATORY";

const pad = (value: number) => String(value).padStart(2, "0");
const parts = (iso: string) => iso.split("-").map(Number) as [number, number, number];
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localDate = (iso: string) => {
  const [year, month, day] = parts(iso);
  return new Date(year, month - 1, day);
};

export function addDays(iso: string, count: number): string {
  const date = localDate(iso);
  date.setDate(date.getDate() + count);
  return toIso(date);
}

/** Monday = 0 … Sunday = 6. */
export const weekdayIndex = (iso: string) => (localDate(iso).getDay() + 6) % 7;
export const isSaturday = (iso: string) => weekdayIndex(iso) === 5;

/** "Thứ 6" … "CN". */
export const weekdayLabel = (iso: string) => (weekdayIndex(iso) === 6 ? "CN" : `Thứ ${weekdayIndex(iso) + 2}`);
export const dayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
/** "Thứ 6, 20/11". */
export const weekdayDayMonth = (iso: string) => `${weekdayLabel(iso)}, ${dayMonth(iso)}`;

export const monthOf = (iso: string) => iso.slice(0, 7);
export const shiftMonth = (month: string, delta: number) => {
  const [year, value] = parts(`${month}-01`);
  const date = new Date(year, value - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};
/** "Tháng 11, 2026". */
export const monthTitle = (month: string) => `Tháng ${Number(month.slice(5, 7))}, ${month.slice(0, 4)}`;
export const isMonth = (value: unknown): value is string => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

/** The 6x7 calendar of a month, Monday first: 42 ISO dates. */
export function monthGrid(month: string): string[] {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayIndex(first));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

/** Every Saturday of the month. */
export const saturdaysOf = (month: string) => monthGrid(month).filter((day) => day.startsWith(month) && isSaturday(day));

/** "2 ngày · Thứ 4, 30/12 – Thứ 5, 31/12"; "" for an empty or reversed range. */
export function rangeSummary(from: string, to: string): string {
  if (!from || !to || to < from) return "";
  const count = Math.round((localDate(to).getTime() - localDate(from).getTime()) / 86_400_000) + 1;
  return `${count} ngày · ${weekdayDayMonth(from)} – ${weekdayDayMonth(to)}`;
}

/** Every date from `from` to `to`, both included; at most `limit` of them. */
export function datesBetween(from: string, to: string, limit = 366): string[] {
  const days: string[] = [];
  for (let day = from; day <= to && days.length < limit; day = addDays(day, 1)) days.push(day);
  return days;
}

/** Calendar cell sub-line: "<name> · <có lương|trừ phép|không lương> · <n> tiết huỷ" ("<n> tiết" when the day stays taught). */
export function holidayCellSub(holiday: HolidayConfig): string {
  const periods = holiday.affectedPeriods ?? 0;
  const load = periods > 0 ? `${periods} tiết${holiday.teachingAction === "CANCEL" ? " huỷ" : ""}` : "";
  return [holiday.name, payModeShort(holiday.payMode), load].filter(Boolean).join(" · ");
}

export const holidayCardTitle = (holiday: Pick<HolidayConfig, "date" | "name">) => `${weekdayDayMonth(holiday.date ?? "")} · ${holiday.name ?? ""}`;

/** "Toàn hệ thống · tạo bởi HR"; legacy rows have no creator, and rows that still carry a school are named. */
export function holidayCardSubtitle(holiday: HolidayConfig, schoolName?: string): string {
  const scope = holiday.schoolId ? (schoolName || "Riêng một trường") : "Toàn hệ thống";
  return holiday.createdByName ? `${scope} · tạo bởi ${holiday.createdByName}` : scope;
}

/** Orange notice shared by the card and the add form. */
export function affectedNotice(periods: number, schools: number, plural: boolean): string {
  return `${periods} tiết ở ${schools} trường rơi vào ${plural ? "các ngày" : "ngày"} này. Chọn «Huỷ tiết» thì các tiết chuyển sang «Nghỉ lễ»: giáo viên được báo, không cần báo giảng, không tính vào công tiết dạy.`;
}

export type DayLoad = { date: string; periods: number; schools: number };

/** Periods summed over the days; schools is the largest single day (the API cannot tell how many schools repeat). */
export function sumLoads(loads: readonly DayLoad[], from: string, to: string): { periods: number; schools: number } {
  let periods = 0;
  let schools = 0;
  for (const load of loads) {
    if (load.date < from || load.date > to) continue;
    periods += load.periods;
    schools = Math.max(schools, load.schools);
  }
  return { periods, schools };
}

export type PastPeriodsPayload = {
  dates: string[];
  taughtPeriods: number;
  reportedPeriods: number;
  schools: Array<{ schoolId?: string; schoolName?: string; taughtPeriods: number; reportedPeriods: number }>;
};

/** The impact the server sends with 409 HOLIDAY_AFFECTS_PAST_PERIODS (`details.data`); null for any other error. */
export function pastPeriodsPayload(error: unknown): PastPeriodsPayload | null {
  const err = error as { code?: unknown; details?: { data?: Partial<PastPeriodsPayload> } } | null;
  if (err?.code !== "HOLIDAY_AFFECTS_PAST_PERIODS") return null;
  const data = err.details?.data;
  return {
    dates: [...(data?.dates ?? [])].sort(),
    taughtPeriods: data?.taughtPeriods ?? 0,
    reportedPeriods: data?.reportedPeriods ?? 0,
    schools: data?.schools ?? [],
  };
}

export const errorCodeOf = (error: unknown): string | undefined => (error as { code?: unknown } | null)?.code as string | undefined;

/** Opening sentence of the warning: one day, or a range of days that have passed. */
export function pastWarningIntro(payload: PastPeriodsPayload): string {
  const first = payload.dates[0] ?? "";
  const last = payload.dates[payload.dates.length - 1] ?? first;
  const when = first === last ? `${weekdayDayMonth(first)} đã qua` : `${weekdayDayMonth(first)} – ${weekdayDayMonth(last)} đã qua`;
  const where = first === last ? "Hôm đó" : "Các ngày đó";
  return `${when}. ${where} có ${payload.taughtPeriods} tiết đã dạy ở ${payload.schools.length} trường, ${payload.reportedPeriods} tiết đã có báo giảng. Thêm ngày nghỉ với «Huỷ tiết» sẽ huỷ cả các tiết này.`;
}

export type AddFormState = {
  mode: "ONE" | "RANGE";
  from: string;
  to: string;
  name: string;
  kind: HolidayKind;
  payMode: HolidayPayMode | null;
  teachingAction: HolidayTeachingAction;
};

/** The command of the add form, or null until it has dates, a name and a pay mode. */
export function addCommand(state: AddFormState): HolidayCommand | null {
  const to = state.mode === "ONE" ? state.from : state.to;
  const payMode = isPayLocked(state.kind) ? "PAID" : state.payMode;
  if (!state.from || !to || to < state.from || !state.name.trim() || !payMode) return null;
  return { from: state.from, to, name: state.name.trim(), kind: state.kind, payMode, teachingAction: state.teachingAction };
}
