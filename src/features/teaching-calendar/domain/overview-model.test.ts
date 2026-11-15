import { expect, it } from "vitest";

import { conflictNote, foldPeriod, foldSlots, slotText, type TeacherSlotInput, overviewCellKind, rowNote, toggleSchool, type OverviewCell, type OverviewConflict } from "./overview-model";

const side = (className: string, schoolShortName: string, teacherName = "Q.Vương", eventId = className) => ({ className, eventId, roomName: "PM 03", schoolShortName, teacherName });
const clash = { kind: "TEACHER_TIME", mine: side("9A4", "TCĐ"), other: side("8A2", "Nguyễn Du"), severity: "ERROR" } as unknown as OverviewConflict;
const cell = (patch: Partial<OverviewCell>) => ({ conflictKinds: [], status: "PUBLISHED", ...patch }) as OverviewCell;

it("writes the teacher-clash note like the board", () => {
  expect(conflictNote(clash)).toBe("⚠ Q.Vương trùng giờ: 9A4 (TCĐ) và 8A2 (Nguyễn Du)");
});

it("joins conflict, draft and tiet notes with a dot and dedupes mirrored conflicts", () => {
  const mirrored = { ...clash, mine: clash.other, other: clash.mine } as OverviewConflict;
  const note = rowNote(
    [cell({ batchLabel: "Đợt HK1·3", status: "DRAFT" }), cell({ note: "Thứ 7 học bù" })],
    [clash, mirrored],
  );
  expect(note).toBe("⚠ Q.Vương trùng giờ: 9A4 (TCĐ) và 8A2 (Nguyễn Du) · Nháp · chưa xuất bản (Đợt HK1·3) · Thứ 7 học bù");
});

it("classifies cells for styling", () => {
  expect(overviewCellKind(cell({ conflictKinds: ["TRAVEL_TIME"] }))).toBe("travel");
  expect(overviewCellKind(cell({ conflictKinds: ["ROOM_TIME"] }))).toBe("clash");
  expect(overviewCellKind(cell({ status: "DRAFT" }))).toBe("draft");
  expect(overviewCellKind(cell({}))).toBe("published");
});

it("limits side-by-side schools to three", () => {
  expect(toggleSchool(["a", "b", "c"], "d")).toEqual(["a", "b", "c"]);
  expect(toggleSchool(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  expect(toggleSchool(["a"], "b")).toEqual(["a", "b"]);
});

it("folds tiet 5 and 10 into the nearest slot of the same session", () => {
  expect([1, 4, 5, 6, 9, 10].map(foldPeriod)).toEqual([1, 4, 4, 6, 9, 9]);
});

const slot = (patch: Partial<TeacherSlotInput>): TeacherSlotInput => ({
  classNames: ["9A4"], conflict: false, eventIds: ["e1"], onLeave: false, periodNo: 1, roles: ["MAIN"], schoolShortNames: ["TCĐ"], status: "PUBLISHED", travel: false, weekday: 1, ...patch,
});

it("shows «+1» when tiet 5 folds into tiet 4", () => {
  const folded = foldSlots([slot({ periodNo: 4 }), slot({ classNames: ["9A5"], eventIds: ["e2"], periodNo: 5 })]);
  expect([...folded.keys()]).toEqual(["1:4"]);
  expect(slotText(folded.get("1:4")!)).toBe("9A4 +1");
});

it("labels clash and assistant slots", () => {
  expect(slotText(foldSlots([slot({ classNames: ["9A4", "8A2"], conflict: true })]).get("1:1")!)).toBe("2 lớp");
  expect(slotText(foldSlots([slot({ classNames: ["9A3"], roles: ["ASSISTANT"] })]).get("1:1")!)).toBe("TG 9A3");
});
