import { formatDateVi } from "@/domain/formatters/format-date";

import { minutes, weekdayName, weeksLabel, sourceLabel } from "./schedule-copy";
import type { ScheduleConflict } from "./schedule-grid-model";

const dd = (value: string) => formatDateVi(value).slice(0, 5);
const join = (parts: Array<string | null | undefined>, separator = " · ") => parts.filter(Boolean).join(separator);

type Side = NonNullable<ScheduleConflict["other"]> | ScheduleConflict["mine"];

const who = (side: Side) => join([side.className, side.roomName, side.schoolShortName]);

/** Cac cau cua `<article>` xung dot (6.2). Du lieu co cau truc tu BE, FE ghep chu. */
export function conflictLines(conflict: ScheduleConflict) {
  const { kind, mine, other, travel } = conflict;
  const time = conflict.startTime && conflict.endTime ? ` · ${conflict.startTime}–${conflict.endTime}` : "";
  const when = `${weekdayName(conflict.weekday)} · Tiết ${conflict.periodNo}${time} (từ ${dd(conflict.firstDate)})`;
  const weeks = weeksLabel(conflict.affectedWeeks, conflict.totalWeeks, conflict.firstDate);
  const mineLine = `${mine.teacherName ? `${mine.teacherName} dạy ` : ""}${who(mine)}`;

  let otherLine = "";
  if (other && (kind === "TEACHER_TIME" || kind === "CLASS_TIME")) {
    otherLine = kind === "TEACHER_TIME"
      ? `${other.teacherName} đang dạy ${who(other)}`
      : `${other.className} đã có ${join([other.subjectName ?? "tiết", other.teacherName, other.roomName], " · ")}`;
  } else if (other && kind === "ROOM_TIME") {
    otherLine = `${other.roomName} đã có ${join([other.className, other.teacherName, other.subjectName])}`;
  } else if (other && kind === "TRAVEL_TIME" && travel) {
    otherLine = `Tiết ${other.periodNo} ${other.teacherName} dạy ${other.className} ở ${other.schoolShortName}, hết ${travel.previousEndTime} → chỉ ${minutes(travel.gapMinutes)} để di chuyển (cần ≥ ${minutes(travel.requiredMinutes)})`;
  } else if (kind === "TEACHER_ON_LEAVE" && conflict.leave) {
    otherLine = `Nghỉ phép ${dd(conflict.leave.fromDate)} – ${dd(conflict.leave.toDate)}`;
  }

  const source = kind === "TRAVEL_TIME" && travel
    ? `Khoảng cách tối thiểu ${travel.fromSchoolShortName} ↔ ${travel.toSchoolShortName}: ${minutes(travel.requiredMinutes)}`
    : other ? sourceLabel(other) : "";

  const fix = conflict.fix;
  let fixLine = "";
  if (fix?.kind === "CHANGE_TEACHER" && fix.teacherName) fixLine = `Đổi GV → ${fix.teacherName} (trống)`;
  else if (fix?.kind === "CHANGE_ROOM" && fix.roomName) fixLine = `Đổi phòng → ${fix.roomName} (trống)`;
  else if (fix?.kind === "CHANGE_PREVIOUS_TEACHER" && fix.teacherName) {
    fixLine = `Đổi GV tiết ${other?.periodNo ?? ""} (${fix.targetClassName ?? other?.className ?? ""}) → ${fix.teacherName} (cùng trường)`.replace("tiết  (", "tiết (");
  }

  return { fixLine, mineLine, otherLine, source, weeks, when };
}

/**
 * Cau trung o popover (6.1): «Q.Vương đang dạy 8A2 · Tiết 6 · 13:00–13:45 · P.Tin 1 · THCS Nguyễn Du».
 * Hop dong khong co so phut chong nhau (hai tiet cung khung gio la trung ca tiet), nen khong ghi «chống N′».
 */
export function popoverConflictLine(conflict: ScheduleConflict): string {
  const { kind, other } = conflict;
  if (other && kind === "TEACHER_TIME") {
    const time = conflict.startTime && conflict.endTime ? `${conflict.startTime}–${conflict.endTime}` : "";
    return `${other.teacherName} đang dạy ${join([other.className, `Tiết ${conflict.periodNo}`, time, other.roomName, other.schoolName])}`;
  }
  return conflictLines(conflict).otherLine;
}
