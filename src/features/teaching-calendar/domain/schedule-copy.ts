import { formatDateVi } from "@/domain/formatters/format-date";

/** Chuoi hien thi cua man Lich day (KE_HOACH_LICH_DAY.md 4.6). Ngay di vao la `yyyy-MM-dd`. */

const WEEKDAY_NAMES = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const LEVEL_PREFIX = /^(THCS|THPT|TiH|TH|MN)\s+/;

type Ymd = { d: number; m: number; y: number };

function parseYmd(value: string): Ymd {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return { d, m, y };
}

function two(n: number) {
  return String(n).padStart(2, "0");
}

/** Cong ngay theo lich (UTC de khong lech gio mua he). */
export function addDaysToDate(value: string, days: number): string {
  const { d, m, y } = parseYmd(value);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${two(next.getUTCMonth() + 1)}-${two(next.getUTCDate())}`;
}

/** 0 = Chu nhat ... 6 = Thu 7. */
export function weekdayIndex(value: string): number {
  const { d, m, y } = parseYmd(value);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Ngay gan nhat nam trong luoi xep lich (Thu 2 - Thu 7): Chu nhat -> Thu 2 ke tiep. */
export function nearestGridDay(value: string): string {
  return weekdayIndex(value) === 0 ? addDaysToDate(value, 1) : value;
}

/** Thu 2 cua tuan chua ngay `value`. */
export function weekStartOf(value: string): string {
  const index = weekdayIndex(value);
  return addDaysToDate(value, index === 0 ? -6 : 1 - index);
}

export type WeekRangeStyle = "main" | "overview" | "reuse";

/** Tuan Thu 2 - Thu 7. main: `09 – 14 tháng 11, 2026`; overview: `Tuần 09 – 14/11/2026`; reuse: `09 – 14/11`. */
export function weekRangeLabel(start: string, style: WeekRangeStyle = "main"): string {
  const first = parseYmd(start);
  const last = parseYmd(addDaysToDate(start, 5));
  const sameMonth = first.m === last.m;
  if (style === "main") {
    return sameMonth
      ? `${two(first.d)} – ${two(last.d)} tháng ${last.m}, ${last.y}`
      : `${two(first.d)} tháng ${first.m} – ${two(last.d)} tháng ${last.m}, ${last.y}`;
  }
  const range = sameMonth
    ? `${two(first.d)} – ${two(last.d)}/${two(last.m)}`
    : `${two(first.d)}/${two(first.m)} – ${two(last.d)}/${two(last.m)}`;
  return style === "overview" ? `Tuần ${range}/${last.y}` : range;
}

/** `Thứ 4, 11/11`. */
export function dayLabel(date: string): string {
  const { d, m } = parseYmd(date);
  return `${WEEKDAY_NAMES[weekdayIndex(date)]}, ${two(d)}/${two(m)}`;
}

/** `Thứ 4` (weekday 1..7 cua BE: 1 = Thu 2 ... 6 = Thu 7). */
export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday === 7 ? 0 : weekday] ?? "";
}

export type PeriodSlotLike = { endTime?: string | null; periodNo: number; startTime?: string | null };

/** dotted: `Tiết 6 · 13:30 – 14:15` (thanh tieu de); compact: `Tiết 3 09:15–10:00` (header popover). Tiet trong gio chi co so tiet. */
export function periodLabel(slot: PeriodSlotLike, style: "dotted" | "compact" = "dotted"): string {
  if (!slot.startTime || !slot.endTime) return `Tiết ${slot.periodNo}`;
  return style === "dotted"
    ? `Tiết ${slot.periodNo} · ${slot.startTime} – ${slot.endTime}`
    : `Tiết ${slot.periodNo} ${slot.startTime}–${slot.endTime}`;
}

/** `10/10 tuần`; `3/10 tuần · từ 27/11` khi chi mot phan so tuan bi anh huong. */
export function weeksLabel(affected: number, total: number, from?: string | null): string {
  const base = `${affected}/${total} tuần`;
  return from && affected < total ? `${base} · từ ${two(parseYmd(from).d)}/${two(parseYmd(from).m)}` : base;
}

export type SourceSideLike = {
  batchLabel?: string | null;
  batchStatus?: string | null;
  createdAt?: string | null;
  createdByName?: string | null;
  createdByRole?: string | null;
};

/** `Đợt HK1·2 · đã xuất bản · xếp bởi Hà (Giáo vụ) 02/11`. */
export function sourceLabel(side: SourceSideLike): string {
  const parts: string[] = [];
  if (side.batchLabel) parts.push(side.batchLabel);
  if (side.batchStatus) parts.push(side.batchStatus === "PUBLISHED" ? "đã xuất bản" : "nháp");
  if (side.createdByName) {
    const role = side.createdByRole ? ` (${side.createdByRole})` : "";
    const when = side.createdAt ? ` ${formatDateVi(side.createdAt).slice(0, 5)}` : "";
    parts.push(`xếp bởi ${side.createdByName}${role}${when}`);
  }
  return parts.join(" · ");
}

/** `30′`, `1h`, `5h30′`. */
export function minutes(total: number): string {
  if (total < 60) return `${total}′`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours}h${rest}′` : `${hours}h`;
}

/** Chu cai dau moi tu, bo tien to cap hoc: "THCS Trương Công Định" -> "TCĐ"; mot tu in hoa san (TCĐ) giu nguyen. */
export function schoolInitials(name: string): string {
  const words = name.trim().replace(LEVEL_PREFIX, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0] === words[0].toLocaleUpperCase("vi") ? words[0] : words[0].charAt(0).toLocaleUpperCase("vi");
  return words.map((word) => word.charAt(0).toLocaleUpperCase("vi")).join("");
}

export type TravelGapLike = {
  fromSchoolName: string;
  gapMinutes: number;
  requiredMinutes: number;
  toSchoolName: string;
};

/** sentence: `chỉ 30′ để di chuyển (cần ≥ 50′)`; short: `VL → ND chỉ 30′ · cần 50′`; far: `VL → TCĐ · cách 5h30′`. */
export function travelLabel(gap: TravelGapLike, style: "sentence" | "short" | "far" = "sentence"): string {
  const route = `${schoolInitials(gap.fromSchoolName)} → ${schoolInitials(gap.toSchoolName)}`;
  if (style === "short") return `${route} chỉ ${minutes(gap.gapMinutes)} · cần ${minutes(gap.requiredMinutes)}`;
  if (style === "far") return `${route} · cách ${minutes(gap.gapMinutes)}`;
  return `chỉ ${minutes(gap.gapMinutes)} để di chuyển (cần ≥ ${minutes(gap.requiredMinutes)})`;
}

const CONFLICT_NAMES = {
  CLASS_TIME: "Trùng lớp",
  ROOM_TIME: "Trùng phòng",
  TEACHER_ON_LEAVE: "Nghỉ",
  TEACHER_TIME: "Trùng giáo viên",
  TRAVEL_TIME: "Không kịp di chuyển",
} as const;

export function conflictKindName(kind: keyof typeof CONFLICT_NAMES): string {
  return CONFLICT_NAMES[kind];
}

/** `16–21/11`, `30/11–05/12`: chip tuan va cot «Tuần» cua Dung lai (khong co dau cach quanh gach). */
export function compactWeekRange(start: string): string {
  return weekRangeLabel(start, "reuse").replace(" – ", "–");
}

/** «THCS Trương Công Định» -> «Trương Công Định» (chip lich giao vien, dong 2). */
export function schoolPlainName(name: string): string {
  return name.trim().replace(LEVEL_PREFIX, "");
}
