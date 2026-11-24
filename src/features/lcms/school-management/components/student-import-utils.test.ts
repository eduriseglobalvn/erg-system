import { describe, expect, it } from "vitest";
import { createBlankImportRow, gradeFromClassName, rowFromPastedCells, validateImportRow } from "@/features/lcms/school-management/components/student-import-utils";

describe("rowFromPastedCells", () => {
  it("joins a name split over two columns and reads the class (Vân Đồn attendance sheet)", () => {
    expect(rowFromPastedCells(["Nguyễn Bảo", "Anh", "6A5"])).toEqual({ fullName: "Nguyễn Bảo Anh", className: "6A5" });
  });

  it("drops the STT column and ignores attendance/score columns after the class", () => {
    expect(rowFromPastedCells(["12", "Lê Huỳnh Ngọc", "Hân", "6A5", "x", "x", "1.000"])).toEqual({ fullName: "Lê Huỳnh Ngọc Hân", className: "6A5" });
  });

  it("takes a names-only paste as names with no class", () => {
    expect(rowFromPastedCells(["Trương Mỹ Quyên"])).toEqual({ fullName: "Trương Mỹ Quyên", className: "" });
  });
});

describe("gradeFromClassName", () => {
  it.each([["6A5", "6"], ["10B3", "10"], ["6/1", "6"], ["9A", "9"], ["Lớp chọn", ""], ["12", ""]])("%s → %s", (name, grade) => {
    expect(gradeFromClassName(name)).toBe(grade);
  });

  it("fills a missing grade so a row with name and class is valid", () => {
    const row = validateImportRow({ ...createBlankImportRow(0), fullName: "Ngô Gia Linh", className: "6A1" });
    expect(row).toMatchObject({ grade: "6", valid: true });
  });
});
