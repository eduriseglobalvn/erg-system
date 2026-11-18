import { expect, it } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import { buildSchoolDayChips, chipWho, conflictNote, foldPeriod, foldSlots, slotText, type TeacherSlotInput, overviewCellKind, overviewErrorMessage, paginateSchools, rowNote, SCHOOLS_PER_PAGE, selectedSchoolIds, toggleSchool, type OverviewCell, type OverviewConflict } from "./overview-model";

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
  expect(note).toBe("⚠ Q.Vương trùng giờ: 9A4 (TCĐ) và 8A2 (Nguyễn Du) · Nháp · chưa áp dụng (Đợt HK1·3) · Thứ 7 học bù");
});

it("classifies cells for styling", () => {
  expect(overviewCellKind(cell({ conflictKinds: ["TRAVEL_TIME"] }))).toBe("travel");
  expect(overviewCellKind(cell({ conflictKinds: ["ROOM_TIME"] }))).toBe("clash");
  expect(overviewCellKind(cell({ status: "DRAFT" }))).toBe("draft");
  expect(overviewCellKind(cell({}))).toBe("published");
});

it("does not cap the selection; default is the first page only", () => {
  const many = Array.from({ length: 200 }, (_, n) => `s${n}`);
  expect(toggleSchool(many, "extra")).toHaveLength(201);
  expect(selectedSchoolIds(many, [])).toHaveLength(200);
  expect(selectedSchoolIds([], many.map((schoolId) => ({ schoolId })))).toEqual(many.slice(0, SCHOOLS_PER_PAGE));
});

it("pages the selected schools: empty, exact multiple, remainder, last page, clamping", () => {
  const ids = (n: number) => Array.from({ length: n }, (_, k) => k);
  expect(paginateSchools([], 0, 4)).toMatchObject({ from: 0, items: [], page: 0, pageCount: 1, to: 0, total: 0 });
  expect(paginateSchools(ids(8), 1, 4)).toMatchObject({ from: 5, items: [4, 5, 6, 7], pageCount: 2, to: 8 });
  expect(paginateSchools(ids(10), 2, 4)).toMatchObject({ from: 9, items: [8, 9], page: 2, pageCount: 3, to: 10, total: 10 });
  expect(paginateSchools(ids(10), 9, 4).page).toBe(2);
  expect(paginateSchools(ids(10), -1, 4).page).toBe(0);
});

it("shows the server's business message, not the connection hint, for GraphQL errors", () => {
  const business = new ApiClientError("Chỉ xem cạnh nhau tối đa 3 trường.", "GRAPHQL_ERROR", 200, [{ extensions: { code: "TOO_MANY_SCHOOLS" }, message: "Chỉ xem cạnh nhau tối đa 3 trường." }]);
  expect(overviewErrorMessage(business)).toBe("Chỉ xem cạnh nhau tối đa 3 trường.");
  expect(overviewErrorMessage(new ApiClientError("Failed to fetch", "NETWORK_ERROR", 0))).toBeUndefined();
  expect(overviewErrorMessage(new TypeError("Failed to fetch"))).toBeUndefined();
});

it("keeps toggling", () => {
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

const GRID = {
  cells: [1, 2, 3, 6].map((periodNo) => cell({ className: "9A4", eventId: "e" + periodNo, periodNo, schoolId: "s1", teacherName: "T.Tuấn", weekday: 1 } as never)),
  template: { slots: [[1, "MORNING", "07:15", "08:00"], [2, "MORNING", "08:00", "08:45"], [3, "MORNING", "09:15", "10:00"], [6, "AFTERNOON", "13:30", "14:15"]].map(([periodNo, session, startTime, endTime]) => ({ endTime, periodNo, session, startTime })) },
} as never;

it("merges consecutive periods of the same lesson into one time range per day", () => {
  const chips = buildSchoolDayChips(GRID).get("s1:1")!;
  expect(chips.map((chip) => chip.startTime + "–" + chip.endTime)).toEqual(["07:15–10:00", "13:30–14:15"]);
  expect([chips[0].firstPeriod, chips[0].lastPeriod]).toEqual([1, 3]);
});

it("keeps different teachers apart and writes the assistant after a plus", () => {
  const grid = { ...(GRID as object), cells: [cell({ className: "9A4", periodNo: 1, schoolId: "s1", teacherName: "A", weekday: 1 } as never), cell({ className: "9A4", periodNo: 2, schoolId: "s1", teacherName: "B", weekday: 1 } as never)] } as never;
  expect(buildSchoolDayChips(grid).get("s1:1")).toHaveLength(2);
  expect(chipWho({ assistantName: "B.Ngọc, P.Nhi", teacherName: "T.Tuấn" })).toBe("T.Tuấn + B.Ngọc, P.Nhi");
});
