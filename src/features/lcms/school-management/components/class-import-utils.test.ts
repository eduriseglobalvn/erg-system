import { describe, expect, it } from "vitest";
import { buildClassImportPreview, parseClassImportCsv } from "@/features/lcms/school-management/components/class-import-utils";

describe("class import preview", () => {
  it("maps a complete spreadsheet and validates grades against the school", () => {
    const rows = buildClassImportPreview([
      ["Tên lớp", "Khối", "Giáo viên phụ trách", "Sĩ số"],
      ["10A1", "10", "Nguyễn Văn A", 42],
      ["11A2", "11", "Trần Thị B", 40],
    ], { existingClassNames: [], grades: ["10", "11", "12"], usesGrades: true });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.valid)).toBe(true);
    expect(rows[0]).toMatchObject({ grade: "10", name: "10A1", studentCount: 42 });
  });

  it("blocks wrong grades and duplicate classes before confirmation", () => {
    const rows = buildClassImportPreview([
      ["Tên lớp", "Khối", "Giáo viên", "Sĩ số"],
      ["10A1", "9", "Nguyễn Văn A", 42],
      ["12A1", "12", "Trần Thị B", 40],
      ["12A1", "12", "Lê Văn C", 38],
    ], { existingClassNames: ["10A1"], grades: ["10", "11", "12"], usesGrades: true });

    expect(rows[0].issues).toContain("Lớp đã tồn tại trong trường");
    expect(rows[0].issues).toContain("Khối 9 không thuộc loại trường này");
    expect(rows[2].issues).toContain("Trùng tên lớp trong file");
  });

  it("parses quoted Google Sheets CSV values", () => {
    expect(parseClassImportCsv('"Tên lớp","Giáo viên"\n"A, nâng cao","Nguyễn Văn A"')).toEqual([
      ["Tên lớp", "Giáo viên"],
      ["A, nâng cao", "Nguyễn Văn A"],
    ]);
  });
});
