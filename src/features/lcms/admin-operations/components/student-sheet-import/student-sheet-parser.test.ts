import { describe, expect, it } from "vitest";

import {
  getInitials,
  parseBirthdayForApi,
  parseCellRange,
  parseStudentSheet,
} from "@/features/lcms/admin-operations/components/student-sheet-import/student-sheet-parser";

const range = { columnStart: "A", columnEnd: "Z", rowStart: 1, rowEnd: Number.POSITIVE_INFINITY };

function payload(rows: string[][]) {
  const [header, ...body] = rows;
  return {
    table: {
      cols: header.map((label) => ({ label })),
      rows: body.map((row) => ({ c: row.map((v) => ({ v })) })),
    },
  } as unknown as Parameters<typeof parseStudentSheet>[0];
}

describe("parseCellRange", () => {
  it("parses cells and falls back for empty input", () => {
    expect(parseCellRange("b2", "z46")).toEqual({ columnStart: "B", columnEnd: "Z", rowStart: 2, rowEnd: 46 });
    expect(parseCellRange("", "")).toEqual({ columnStart: "A", columnEnd: "Z", rowStart: 1, rowEnd: Number.POSITIVE_INFINITY });
  });
});

describe("parseBirthdayForApi", () => {
  it("converts dd/mm/yyyy and two-digit years to ISO", () => {
    expect(parseBirthdayForApi("05/03/2012")).toBe("2012-03-05T00:00:00.000Z");
    expect(parseBirthdayForApi("5-3-12")).toBe("2012-03-05T00:00:00.000Z");
  });
  it("returns undefined for blank or malformed values", () => {
    expect(parseBirthdayForApi("  ")).toBeUndefined();
    expect(parseBirthdayForApi("2012")).toBeUndefined();
  });
});

describe("getInitials", () => {
  it("uses first and last word", () => {
    expect(getInitials("Nguyễn Văn An")).toBe("NA");
    expect(getInitials("An")).toBe("A");
    expect(getInitials("")).toBe("H");
  });
});

describe("parseStudentSheet", () => {
  const sheet = payload([
    ["Trường THCS Demo", "", "", ""],
    ["STT", "HỌ", "TÊN", "LỚP"],
    ["1", "Nguyễn Văn", "An", "6A1"],
    ["2", "Trần", "", ""],
  ]);

  it("detects header, classes and flags incomplete rows", () => {
    const result = parseStudentSheet(sheet, range);
    expect(result.headerIndex).toBe(1);
    expect(result.detectedClasses).toEqual(["6A1"]);
    expect(result.students).toHaveLength(2);
    expect(result.students[0]).toMatchObject({ fullName: "Nguyễn Văn An", className: "6A1", status: "valid", note: "Hợp lệ" });
    expect(result.students[0].generatedUsername).toMatch(/^an\.nguyen\.6a1\.[a-z0-9]+$/);
    expect(result.students[1]).toMatchObject({ status: "warning", generatedUsername: "" });
  });

  it("throws when the header row is missing", () => {
    expect(() => parseStudentSheet(payload([["a", "b"], ["1", "2"]]), range)).toThrow(/tiêu đề/);
  });
});
