import type { TeachingOverviewGrid } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { ApiClientError } from "@/lib/api-client/errors";
import { weekdayName, travelLabel } from "./schedule-copy";

export type OverviewCell = TeachingOverviewGrid["cells"][number];
export type OverviewConflict = TeachingOverviewGrid["conflicts"][number];
export type OverviewSlot = TeachingOverviewGrid["template"]["slots"][number];

/** So truong ve moi trang cua luoi (so cot hien thi tot tren may tinh). BE nhan toi da 50 truong moi lan goi. */
export const SCHOOLS_PER_PAGE = 4;

/** Truong dang chon: lay tu URL (khong gioi han so luong); khong co thi mac dinh la trang dau cua danh sach. */
export function selectedSchoolIds(urlIds: readonly string[], defaults: readonly { schoolId: string }[]): string[] {
  return urlIds.length ? [...urlIds] : defaults.slice(0, SCHOOLS_PER_PAGE).map((school) => school.schoolId);
}

/** Cat danh sach truong da chon thanh trang: `page` tu 0, tu dong ep vao [0, pageCount-1]; `from`/`to` la so thu tu 1-based de hien «Trường a–b trong N». */
export function paginateSchools<T>(ids: readonly T[], page: number, size = SCHOOLS_PER_PAGE) {
  const pageCount = Math.max(1, Math.ceil(ids.length / size));
  const current = Math.min(Math.max(0, page), pageCount - 1);
  const items = ids.slice(current * size, (current + 1) * size);
  return { from: items.length ? current * size + 1 : 0, items, page: current, pageCount, to: current * size + items.length, total: ids.length };
}

/** Loi nghiep vu cua BE (GraphQL `errors[].extensions.code` + message tieng Viet) -> cau hien thi; loi mang/khac -> undefined. */
export function overviewErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError) || !Array.isArray(error.details)) return undefined;
  const item = (error.details as Array<{ extensions?: { code?: unknown }; message?: unknown }>).find((entry) => typeof entry?.extensions?.code === "string" && typeof entry.message === "string" && entry.message.trim());
  return item ? String(item.message) : undefined;
}
/** Luoi bang tong khong hien tiet 5 / 10 (khong co gio): chi cac tiet co gio. */
export type OverviewRow = {
  cells: ReadonlyMap<string, readonly OverviewCell[]>;
  holiday?: string;
  note: string;
  slot: OverviewSlot;
  weekday: number;
};

const kindLabel = {
  CLASS_TIME: "trùng lớp", ROOM_TIME: "trùng phòng", TEACHER_ON_LEAVE: "nghỉ", TEACHER_TIME: "trùng giờ", TRAVEL_TIME: "không kịp di chuyển",
} as const;

const side = (value: { className?: string | null; schoolShortName?: string | null }) => `${value.className ?? ""}${value.schoolShortName ? ` (${value.schoolShortName})` : ""}`;

/** Cau ghi chu cua mot xung dot (6.6): «⚠ Q.Vương trùng giờ: 9A4 (TCĐ) và 8A2 (Nguyễn Du)». */
export function conflictNote(conflict: OverviewConflict): string {
  const who = conflict.kind === "ROOM_TIME" ? conflict.mine.roomName : conflict.kind === "CLASS_TIME" ? conflict.mine.className : conflict.mine.teacherName;
  if (conflict.kind === "TRAVEL_TIME" && conflict.travel) return `⚠ ${who} ${kindLabel.TRAVEL_TIME}: ${travelLabel(conflict.travel, "short")}`;
  const others = conflict.other ? ` và ${side(conflict.other)}` : "";
  return `⚠ ${who} ${kindLabel[conflict.kind]}: ${side(conflict.mine)}${others}`;
}

/** Ghi chu tu sinh cho mot hang: xung dot, nhap chua xuat ban, roi `note` cua tiet; noi bang « · ». */
export function rowNote(cells: readonly OverviewCell[], conflicts: readonly OverviewConflict[]): string {
  const seen = new Set<string>();
  const conflictParts = conflicts.filter((conflict) => conflict.severity === "ERROR").flatMap((conflict) => {
    const key = [conflict.kind, ...[conflict.mine.eventId, conflict.other?.eventId].filter(Boolean).sort()].join("|");
    if (seen.has(key)) return [];
    seen.add(key);
    return [conflictNote(conflict)];
  });
  const drafts = [...new Set(cells.filter((cell) => cell.status === "DRAFT").map((cell) => cell.batchLabel).filter(Boolean))];
  const draftPart = cells.some((cell) => cell.status === "DRAFT") ? [`Nháp · chưa áp dụng${drafts.length ? ` (${drafts.join(", ")})` : ""}`] : [];
  const notes = [...new Set(cells.map((cell) => cell.note?.trim()).filter((note): note is string => Boolean(note)))];
  return [...conflictParts, ...draftPart, ...notes].join(" · ");
}

const HOLIDAY_KIND_LABEL = { STATE: "lễ nhà nước", COMPANY: "nghỉ công ty", COMPENSATORY: "nghỉ bù" } as const;

/** 6 ngay x cac tiet co gio (48 hang voi mau THCS). Ngay le ca hang la `off`. */
export function buildOverviewRows(grid: TeachingOverviewGrid): OverviewRow[] {
  const slots = [...grid.template.slots].filter((slot) => slot.startTime).sort((a, b) => a.periodNo - b.periodNo);
  const holidayByWeekday = new Map(grid.holidays.map((holiday) => [(new Date(`${holiday.date}T00:00:00Z`).getUTCDay() + 6) % 7 + 1, `${holiday.name} (${HOLIDAY_KIND_LABEL[holiday.kind]})`]));
  return [1, 2, 3, 4, 5, 6].flatMap((weekday) => slots.map((slot) => {
    const here = grid.cells.filter((cell) => cell.weekday === weekday && cell.periodNo === slot.periodNo);
    const bySchool = new Map<string, OverviewCell[]>();
    for (const cell of here) bySchool.set(cell.schoolId, [...(bySchool.get(cell.schoolId) ?? []), cell]);
    const conflicts = grid.conflicts.filter((conflict) => conflict.weekday === weekday && conflict.periodNo === slot.periodNo);
    return { cells: bySchool, holiday: holidayByWeekday.get(weekday), note: rowNote(here, conflicts), slot, weekday };
  }));
}

export type OverviewCellKind = "published" | "draft" | "clash" | "travel";

export function overviewCellKind(cell: OverviewCell): OverviewCellKind {
  if (cell.conflictKinds.includes("TRAVEL_TIME")) return "travel";
  if (cell.conflictKinds.some((kind) => kind === "TEACHER_TIME" || kind === "CLASS_TIME" || kind === "ROOM_TIME")) return "clash";
  return cell.status === "DRAFT" ? "draft" : "published";
}

/** Tick truong: bo tick thi bo, chua tick thi them (khong gioi han). */
export function toggleSchool(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

/** Mot khung gio tren bang tong theo truong (6.6): cac tiet lien nhau cung lop/GV/trang thai gop thanh mot khung. */
export type OverviewChip = {
  cell: OverviewCell;
  endTime: string;
  firstPeriod: number;
  kind: OverviewCellKind;
  lastPeriod: number;
  session: string;
  startTime: string;
  weekday: number;
};

/**
 * Gom cac o cua tung truong theo ngay thanh khung gio: tiet lien nhau (theo thu tu tiet co gio) cung lop, phong, GV, tro giang,
 * trang thai va xung dot thi gop thanh mot khung «07:15–10:45». Khoa map: `schoolId:weekday`, da sap theo gio bat dau.
 */
export function buildSchoolDayChips(grid: TeachingOverviewGrid): Map<string, OverviewChip[]> {
  const timed = [...grid.template.slots].filter((slot) => slot.startTime && slot.endTime).sort((a, b) => a.periodNo - b.periodNo);
  const index = new Map(timed.map((slot, position) => [slot.periodNo, position]));
  const signature = (cell: OverviewCell) => [cell.className, cell.roomName, cell.teacherName, cell.assistantName, cell.status, [...cell.conflictKinds].sort().join("+")].join("|");
  const sorted = grid.cells.filter((cell) => index.has(cell.periodNo)).sort((a, b) => (index.get(a.periodNo) ?? 0) - (index.get(b.periodNo) ?? 0));
  const out = new Map<string, OverviewChip[]>();
  const open = new Map<string, OverviewChip>();
  for (const cell of sorted) {
    const slot = timed[index.get(cell.periodNo) ?? 0];
    const key = `${cell.schoolId}:${cell.weekday}`;
    const runKey = `${key}|${signature(cell)}`;
    const previous = open.get(runKey);
    if (previous && previous.session === slot.session && (index.get(previous.lastPeriod) ?? -9) + 1 === index.get(cell.periodNo)) {
      previous.lastPeriod = cell.periodNo;
      previous.endTime = slot.endTime ?? previous.endTime;
      continue;
    }
    const chip: OverviewChip = { cell, endTime: slot.endTime ?? "", firstPeriod: cell.periodNo, kind: overviewCellKind(cell), lastPeriod: cell.periodNo, session: slot.session, startTime: slot.startTime ?? "", weekday: cell.weekday };
    open.set(runKey, chip);
    out.set(key, [...(out.get(key) ?? []), chip]);
  }
  for (const [key, list] of out) out.set(key, list.sort((a, b) => a.startTime.localeCompare(b.startTime) || (a.cell.teacherName ?? "").localeCompare(b.cell.teacherName ?? "")));
  return out;
}

/** «Q.Vương + B.Ngọc, P.Nhi»: GV chinh cong tro giang (board 6.6). */
export function chipWho(cell: Pick<OverviewCell, "assistantName" | "teacherName">): string {
  return `${cell.teacherName ?? "—"}${cell.assistantName ? ` + ${cell.assistantName}` : ""}`;
}

export function rowLabel(row: OverviewRow): string {
  return `${weekdayName(row.weekday)} · Tiết ${row.slot.periodNo}`;
}

/** Bang tong theo giao vien: tiet 5 gop vao 4, tiet 10 gop vao 9 (cung buoi), o hien «+1». */
export function foldPeriod(periodNo: number): number {
  return periodNo === 5 ? 4 : periodNo === 10 ? 9 : periodNo;
}

export type TeacherSlotInput = {
  classNames: readonly string[]; conflict: boolean; eventIds: readonly string[]; onLeave: boolean; periodNo: number;
  roles: readonly string[]; schoolShortNames: readonly string[]; status?: string | null; travel: boolean; weekday: number;
};

export type FoldedSlot = {
  classNames: string[]; conflict: boolean; eventIds: string[];
  /** So tiet 5 / 10 duoc gop vao o nay (hien «+1»). */
  extra: number;
  onLeave: boolean; roles: string[]; schoolShortNames: string[]; status?: string | null; travel: boolean;
};

/** Gom slot theo `weekday:vi_tri` (vi_tri 1-4, 6-9): tiet 5 va 10 gop vao tiet ke truoc cung buoi. */
export function foldSlots(slots: readonly TeacherSlotInput[]): Map<string, FoldedSlot> {
  const folded = new Map<string, FoldedSlot>();
  for (const slot of slots) {
    const position = foldPeriod(slot.periodNo);
    const key = `${slot.weekday}:${position}`;
    const current = folded.get(key) ?? { classNames: [], conflict: false, eventIds: [], extra: 0, onLeave: false, roles: [], schoolShortNames: [], status: slot.status, travel: false };
    folded.set(key, {
      classNames: [...current.classNames, ...slot.classNames], conflict: current.conflict || slot.conflict,
      eventIds: [...current.eventIds, ...slot.eventIds], extra: current.extra + (position === slot.periodNo ? 0 : Math.max(1, slot.classNames.length)),
      onLeave: current.onLeave || slot.onLeave, roles: [...new Set([...current.roles, ...slot.roles])],
      schoolShortNames: [...new Set([...current.schoolShortNames, ...slot.schoolShortNames])],
      status: current.status === "DRAFT" || slot.status === "DRAFT" ? "DRAFT" : slot.status ?? current.status, travel: current.travel || slot.travel,
    });
  }
  return folded;
}

/** Chu trong o slot: «9A4», «2 lớp» khi trung, «TG 9A3» khi chi la tro giang, hau to « +1» khi co tiet 5/10 gop vao. */
export function slotText(slot: FoldedSlot): string {
  const base = slot.conflict ? `${slot.classNames.length} lớp` : slot.roles.every((role) => role === "ASSISTANT") && slot.roles.length ? `TG ${slot.classNames[0] ?? ""}` : slot.classNames[0] ?? "";
  return slot.extra > 0 && !slot.conflict ? `${base} +${slot.extra}` : base;
}
