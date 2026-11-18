import { describe, expect, it } from "vitest";
import { normalizeStudentMatrix } from "@/features/lcms/school-management/components/student-import-utils";
import { buildClassImportPreview } from "@/features/lcms/school-management/components/class-import-utils";
import { detectStudentColumns, excelSerialToViDate, toViDate } from "./student-import-columns";

describe("student-import-columns", () => {
  it("maps headers by name, ignoring case and accents", () => {
    expect(detectStudentColumns(["MÃ HỌC SINH", "Họ và tên", "Khối", "Lớp"])).toEqual({ code: 0, fullName: 1, grade: 2, className: 3 });
    expect(detectStudentColumns(["Họ đệm", "Tên", "Giới tính"])).toMatchObject({ family: 0, given: 1, gender: 2 });
    expect(detectStudentColumns(["Nguyễn Văn A", "01/01/2019"])).toBeNull();
  });

  it("converts serial and text dates to dd/MM/yyyy", () => {
    expect(excelSerialToViDate(43466)).toBe("01/01/2019");
    expect(toViDate(43498)).toBe("02/02/2019");
    expect(toViDate("1/2/2019")).toBe("01/02/2019");
    expect(toViDate("2019-01-01")).toBe("01/01/2019");
    expect(toViDate("")).toBe("");
  });

  it("4-column file without birth date keeps columns by name", () => {
    const rows = normalizeStudentMatrix([["Mã học sinh", "Họ và tên", "Khối", "Lớp"], ["1A9-1", "Học sinh Thử Một", "1", "1A9"], ["1A9-2", "Học sinh Thử Hai", "1", "1A9"]], true);
    expect(rows[0]).toMatchObject({ code: "1A9-1", fullName: "Học sinh Thử Một", birthDate: "", grade: "1", className: "1A9", valid: true });
  });

  it("xlsx serial birth date is converted; headerless file stays positional", () => {
    const named = normalizeStudentMatrix([["Họ và tên", "Ngày sinh", "Lớp", "Khối"], ["An", 43466, "1A1", 1]], true);
    expect(named[0]).toMatchObject({ fullName: "An", birthDate: "01/01/2019", className: "1A1", grade: "1" });
    const legacy = normalizeStudentMatrix([["x", "y"], ["M1", "Bình", "05/06/2018", "2", "2B", "0900"]], true);
    expect(legacy[0]).toMatchObject({ code: "M1", fullName: "Bình", birthDate: "05/06/2018", grade: "2", className: "2B", guardianPhone: "0900" });
  });

  it("class CSV with Khối column: name not glued to birth date, grade taken from column", () => {
    const csv = [
      ["Tên lớp", "Khối", "Họ và tên", "Ngày sinh", "Giới tính"],
      ["1A9", "1", "Học sinh Thử Một", "01/01/2019", "Nam"],
      ["1A9", "1", "Học sinh Thử Hai", "02/02/2019", "Nữ"],
      ["[TEST] 1Z9", "1", "Học sinh Ba", "03/03/2019", "Nam"],
    ];
    const rows = buildClassImportPreview(csv, { existingClassNames: [], grades: ["1", "2"], usesGrades: true });
    const z = rows.find((r) => r.name === "[TEST] 1Z9");
    expect(z?.grade).toBe("1");
    expect(z?.valid).toBe(true);
    expect(rows.find((r) => r.name === "1A9")?.students?.map((s) => [s.fullName, s.birthDate])).toEqual([
      ["Học sinh Thử Một", "01/01/2019"],
      ["Học sinh Thử Hai", "02/02/2019"],
    ]);
  });
});
