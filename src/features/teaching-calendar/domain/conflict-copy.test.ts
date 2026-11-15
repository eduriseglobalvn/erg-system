import { expect, it } from "vitest";

import { conflictLines, popoverConflictLine } from "./conflict-copy";
import type { ScheduleConflict } from "./schedule-grid-model";

const side = (extra: object = {}) => ({ className: "9A1", periodNo: 6, roomName: "P.201", schoolShortName: "TCĐ", teacherName: "T.Tuấn", ...extra });
const base = { affectedWeeks: 4, endTime: "12:15", firstDate: "2026-11-11", periodNo: 6, startTime: "11:30", totalWeeks: 4, weekday: 3 };

it("teacher clash: mine, other and a CHANGE_TEACHER fix", () => {
  const lines = conflictLines({
    ...base, fix: { kind: "CHANGE_TEACHER", teacherName: "Q.Vương" }, kind: "TEACHER_TIME", mine: side({ className: "9A2" }),
    other: side({ batchLabel: "Đợt 1", batchStatus: "PUBLISHED" }), severity: "ERROR",
  } as unknown as ScheduleConflict);
  expect(lines.when).toBe("Thứ 4 · Tiết 6 · 11:30–12:15 (từ 11/11)");
  expect(lines.mineLine).toBe("T.Tuấn dạy 9A2 · P.201 · TCĐ");
  expect(lines.otherLine).toBe("T.Tuấn đang dạy 9A1 · P.201 · TCĐ");
  expect(lines.source).toBe("Đợt 1 · đã áp dụng");
  expect(lines.fixLine).toBe("Đổi GV → Q.Vương (trống)");
});

it("room clash: names the room and offers CHANGE_ROOM", () => {
  const lines = conflictLines({
    ...base, fix: { kind: "CHANGE_ROOM", roomName: "P.305" }, kind: "ROOM_TIME", mine: side(),
    other: side({ className: "8A3", subjectName: "Toán", teacherName: "Q.Vương" }), severity: "ERROR",
  } as unknown as ScheduleConflict);
  expect(lines.otherLine).toBe("P.201 đã có 8A3 · Q.Vương · Toán");
  expect(lines.fixLine).toBe("Đổi phòng → P.305 (trống)");
});

it("travel clash: gap vs required minutes and the school pair", () => {
  const lines = conflictLines({
    ...base, kind: "TRAVEL_TIME", mine: side({ schoolShortName: "LQĐ" }),
    other: side({ periodNo: 5, schoolShortName: "TCĐ" }),
    travel: { fromSchoolShortName: "TCĐ", gapMinutes: 10, previousEndTime: "11:30", requiredMinutes: 50, toSchoolShortName: "LQĐ" }, severity: "ERROR",
  } as unknown as ScheduleConflict);
  expect(lines.otherLine).toBe("Tiết 5 T.Tuấn dạy 9A1 ở TCĐ, hết 11:30 → chỉ 10′ để di chuyển (cần ≥ 50′)");
  expect(lines.source).toBe("Khoảng cách tối thiểu TCĐ ↔ LQĐ: 50′");
});

it("popover line carries period, time, room and full school name", () => {
  const conflict = { ...base, kind: "TEACHER_TIME", mine: side(), other: side({ className: "8A2", roomName: "P.Tin 1", schoolName: "THCS Nguyễn Du", teacherName: "Q.Vương" }), severity: "ERROR" } as unknown as ScheduleConflict;
  expect(popoverConflictLine(conflict)).toBe("Q.Vương đang dạy 8A2 · Tiết 6 · 11:30–12:15 · P.Tin 1 · THCS Nguyễn Du");
});
