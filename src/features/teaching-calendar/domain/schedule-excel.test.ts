import { describe, expect, it } from "vitest";

import type { TeachingOverviewGrid } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { overviewSheets, safeText, scheduleSheet, sheetName } from "./schedule-excel";

const template = { slots: [
  { endTime: "07:45", periodNo: 1, session: "MORNING", startTime: "07:00" },
  { endTime: "08:30", periodNo: 2, session: "MORNING", startTime: "07:45" },
  { endTime: "13:45", periodNo: 6, session: "AFTERNOON", startTime: "13:00" },
  { periodNo: 5, session: "MORNING" },
] } as never;

const grid = {
  cells: [{ assistantName: "Mai", className: "6A1", conflictKinds: [], eventId: "e1", note: "=bad", periodNo: 1, roomName: "P1", schoolId: "s1", status: "PUBLISHED", teacherName: "Tuấn", weekday: 1 }],
  conflicts: [], holidays: [], schools: [{ periodCount: 1, schoolId: "s1", schoolName: "THCS A/B" }, { periodCount: 0, schoolId: "s2", schoolName: "THCS A B" }],
  template, weekStart: "2026-11-09",
} as unknown as TeachingOverviewGrid;

describe("schedule-excel", () => {
  it("guards formula injection", () => {
    expect(safeText("=1+1")).toBe("'=1+1");
    expect(safeText("-x")).toBe("'-x");
    expect(safeText("6A1")).toBe("6A1");
    expect(safeText(undefined)).toBe("");
  });

  it("makes sheet names valid and unique", () => {
    const used = new Set<string>();
    expect(sheetName("a[b]:c*d?e/f\\g", used)).toBe("a b c d e f g");
    expect(sheetName("A B C D E F G", used)).toBe("A B C D E F G (2)");
    expect(sheetName("x".repeat(40), used)).toHaveLength(31);
    expect(sheetName("", used)).toBe("Trường");
  });

  it("builds one sheet per school with merged Thứ and Buổi", () => {
    const sheets = overviewSheets(grid);
    expect(sheets.map((sheet) => sheet.name)).toEqual(["THCS A B", "THCS A B (2)"]);
    const [first] = sheets;
    expect(first.rows[0][0]).toBe("THCS A/B · 1 tiết");
    expect(first.rows[1]).toEqual(["Thứ", "Buổi", "Tiết", "Giờ", "Lớp", "Phòng", "Giáo viên", "Trợ giảng", "Ghi chú"]);
    expect(first.rows[2]).toEqual(["Thứ 2 09/11", "Sáng", 1, "07:00–07:45", "6A1", "P1", "Tuấn", "TG Mai", "'=bad"]);
    expect(first.rows).toHaveLength(2 + 6 * 3);
    expect(first.merges).toContainEqual({ s: { r: 2, c: 0 }, e: { r: 4, c: 0 } });
    expect(first.merges).toContainEqual({ s: { r: 2, c: 1 }, e: { r: 3, c: 1 } });
    expect(first.merges).toContainEqual({ s: { r: 5, c: 0 }, e: { r: 7, c: 0 } });
  });

  it("exports an empty draft as blank rows and no sheets for no schools", () => {
    const sheet = scheduleSheet({ rows: [], schoolName: "THCS", template, weekStart: "2026-11-09" });
    expect(sheet.rows).toHaveLength(2 + 18);
    expect(sheet.rows[2].slice(4)).toEqual(["", "", "", "", ""]);
    expect(overviewSheets({ ...grid, schools: [] })).toEqual([]);
  });

  it("uses draft rows, new room name and the teacher", () => {
    const sheet = scheduleSheet({
      rows: [{ className: "7A", classId: "c", clientRowId: "r", newRoomName: "P9", periodNo: 2, teacherName: "-Lan", weekday: 3 }],
      schoolName: "THCS", template, weekStart: "2026-11-09",
    });
    expect(sheet.rows.find((row) => row[2] === 2 && row[4] === "7A")?.slice(4, 8)).toEqual(["7A", "P9", "'-Lan", ""]);
  });
});
