import { expect, it } from "vitest";

import { addRow, assignmentForDate, breakBefore, periodIssueMessage, periodLength, removeRow, rowsFromSlots, setRowTime, slotsFromRows, templateName, timedCount, toggleRow, validateRows, type PeriodRow } from "./period-times-model";

const slot = (periodNo: number, startTime: string | null, endTime: string | null, session: "MORNING" | "AFTERNOON" | "EVENING" = "MORNING") => ({ endTime, periodNo, session, startTime });
const row = (key: number, start: string, end: string, enabled = true, session: PeriodRow["session"] = "MORNING"): PeriodRow => ({ enabled, end, key, session, start });

it("periodLength returns the common length or undefined when lengths differ", () => {
  expect(periodLength([slot(1, "07:15", "08:00"), slot(2, "08:00", "08:45"), slot(5, null, null)])).toBe(45);
  expect(periodLength([slot(1, "07:15", "08:00"), slot(2, "08:00", "08:50")])).toBeUndefined();
});

it("breakBefore is the gap between consecutive periods, 0 when adjacent or untimed", () => {
  expect(breakBefore(slot(2, "08:00", "08:45"), slot(3, "09:15", "10:00"))).toBe(30);
  expect(breakBefore(slot(1, "07:15", "08:00"), slot(2, "08:00", "08:45"))).toBe(0);
  expect(breakBefore(slot(4, "10:00", "10:45"), slot(5, null, null))).toBe(0);
  expect(breakBefore(undefined, slot(1, "07:15", "08:00"))).toBe(0);
});

it("rows round-trip to slots with null times for disabled periods and renumbered from 1", () => {
  const rows = rowsFromSlots([slot(2, "08:00", "08:45"), slot(1, "07:15", "08:00"), slot(3, null, null, "AFTERNOON")]);
  expect(rows.map((item) => item.enabled)).toEqual([true, true, false]);
  expect(slotsFromRows(rows)).toEqual([slot(1, "07:15", "08:00"), slot(2, "08:00", "08:45"), slot(3, null, null, "AFTERNOON")]);
});

it("addRow appends after the last period of the session using the common length and respects the 12-row cap", () => {
  const rows = [row(0, "07:15", "08:00"), row(1, "08:00", "08:45"), row(2, "13:30", "14:15", true, "AFTERNOON")];
  const next = addRow(rows, "MORNING");
  expect(next.map((item) => item.session)).toEqual(["MORNING", "MORNING", "MORNING", "AFTERNOON"]);
  expect(next[2]).toMatchObject({ end: "09:30", start: "08:45" });
  expect(addRow(rows, "EVENING").at(-1)).toMatchObject({ end: "18:45", start: "18:00", session: "EVENING" });
  const full = Array.from({ length: 12 }, (_, key) => row(key, "07:00", "07:45", false));
  expect(addRow(full, "MORNING")).toHaveLength(12);
});

it("toggleRow re-enables a time-less period with suggested times and removeRow drops it", () => {
  const rows = [row(0, "07:15", "08:00"), row(1, "", "", false)];
  const toggled = toggleRow(rows, 1);
  expect(toggled[1]).toMatchObject({ enabled: true, end: "08:45", start: "08:00" });
  expect(toggleRow(toggled, 0)[0].enabled).toBe(false);
  expect(removeRow(rows, 1)).toHaveLength(1);
  expect(timedCount(toggled)).toBe(2);
});

it("validateRows mirrors the backend rules", () => {
  expect(validateRows([row(0, "07:15", "08:00"), row(1, "08:00", "08:45")])).toBeNull();
  expect(validateRows([row(0, "08:00", "08:00")])).toEqual({ code: "PERIOD_TIME_ORDER", key: 0 });
  expect(validateRows([row(0, "07:15", "08:00"), row(1, "07:50", "08:45")])).toEqual({ code: "PERIOD_TIME_OVERLAP", key: 1 });
  expect(validateRows([row(0, "", "", false)])).toEqual({ code: "NO_TIMED_PERIOD" });
  expect(validateRows([row(0, "7:15", "08:00")])).toEqual({ code: "PERIOD_TIME_INVALID", key: 0 });
  const eleven = Array.from({ length: 11 }, (_, key) => row(key, `${String(key + 6).padStart(2, "0")}:00`, `${String(key + 6).padStart(2, "0")}:45`));
  expect(validateRows(eleven)).toEqual({ code: "TOO_MANY_TIMED_PERIODS" });
  expect(validateRows([])).toEqual({ code: "PERIODS_COUNT_INVALID" });
  expect(setRowTime([row(0, "07:15", "08:00")], 0, "end", "08:10")[0].end).toBe("08:10");
});

it("maps issue codes to Vietnamese", () => {
  expect(periodIssueMessage("TOO_MANY_TIMED_PERIODS")).toContain("10");
  expect(periodIssueMessage("TEMPLATE_IN_USE")).toContain("đang được lịch sử dụng");
  expect(periodIssueMessage("???")).toBe("Chưa lưu được giờ tiết. Thử lại sau.");
});

it("assignmentForDate picks the newest table not after the date", () => {
  const make = (templateId: string, effectiveFrom: string | null) => ({ current: false, effectiveFrom, schoolId: "s1", schoolName: "A", templateId, templateName: templateId });
  const list = [make("winter", "2026-11-01"), make("summer", "2026-09-05"), make("base", null)];
  expect(assignmentForDate(list, "2026-11-11")?.templateId).toBe("winter");
  expect(assignmentForDate(list, "2026-10-01")?.templateId).toBe("summer");
  expect(assignmentForDate(list, "2026-01-01")?.templateId).toBe("base");
  expect(assignmentForDate([], "2026-01-01")).toBeUndefined();
});

it("templateName stays within 80 characters", () => {
  expect(templateName("THCS Trương Công Định", "2026-11-01")).toBe("THCS Trương Công Định · từ 01/11/2026");
  expect(templateName("A".repeat(120), "2026-11-01")).toHaveLength(80);
});
