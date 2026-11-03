import { describe, expect, it } from "vitest";
import {
  detectVietnameseSchoolSheet,
  extractClassesFromSchoolSheets,
  extractStudentsFromRosterMatrix,
  extractTeacherFromHeader,
  findRosterHeaderMapping,
  isSchoolRosterMatrix,
  parseClassNameAndGrade,
} from "./vietnamese-school-sheet-parser";

const mock9A1SheetMatrix: Array<Array<string | number>> = [
  ["", "CÔNG TY TNHH EDURISE GLOBAL", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Trường THCS TRƯƠNG CÔNG ĐỊNH"],
  ["", "Trung tâm tin học ERG", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "131 Đ. Lê Văn Duyệt, Phường Gia Định, Hồ Chí Minh"],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "ĐIỂM DANH TIN HỌC QUỐC TẾ - LỚP 9"],
  ["", "Gv phụ trách:", "Trần Tường Tuấn"],
  ["", "Số tiết đã dạy:", "14"],
  ["", "", "", "", "", "Tuần: 5", "6", "7", "8"],
  ["STT", "HỌ VÀ TÊN", "", "LỚP", "06/10", "09/10", "13/10", "16/10", "20/10", "23/10", "Cao nhất", "Gần nhất"],
  ["1", "Lê Hoàng Ngọc", "Anh", "9A1", "X", "X", "X", "X", "X", "X", 60, 68],
  ["2", "Nguyễn Minh Trầm", "Anh", "9A1", "X", "X", "X", "X", "X", "X", 60, 68],
  ["3", "Lê Hà Hồng", "Ánh", "9A1", "X", "X", "X", "X", "X", "X", 68, 68],
  ["4", "Nông Đức", "Bảo", "9A1", "X", "X", "X", "X", "X", "X", 68, 66],
  ["5", "Nguyễn Thanh", "Bình", "9A1", "X", "X", "X", "X", "X", "X", 60, 66],
];

const mock9A2SheetMatrix: Array<Array<string | number>> = [
  ["", "CÔNG TY TNHH EDURISE GLOBAL", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Trường THCS TRƯƠNG CÔNG ĐỊNH"],
  ["", "Gv phụ trách: Trần Tường Tuấn"],
  ["", "ĐIỂM DANH TIN HỌC QUỐC TẾ - LỚP 9"],
  ["STT", "HỌ VÀ TÊN", "", "LỚP"],
  ["1", "Trần Đình", "Huy", "9A2"],
  ["2", "Phạm Quỳnh", "Nga", "9A2"],
  ["3", "Võ Minh", "Trí", "9A2"],
];

describe("vietnamese-school-sheet-parser", () => {
  it("detects school attendance sheet correctly", () => {
    expect(isSchoolRosterMatrix(mock9A1SheetMatrix)).toBe(true);
    expect(isSchoolRosterMatrix([["A", "B"], ["1", "2"]])).toBe(false);
  });

  it("extracts teacher name from header", () => {
    expect(extractTeacherFromHeader(mock9A1SheetMatrix)).toBe("Trần Tường Tuấn");
    expect(extractTeacherFromHeader(mock9A2SheetMatrix)).toBe("Trần Tường Tuấn");
  });

  it("finds header mapping and splits Họ đệm + Tên", () => {
    const mapping = findRosterHeaderMapping(mock9A1SheetMatrix);
    expect(mapping).not.toBeNull();
    expect(mapping?.headerRowIndex).toBe(6);
    expect(mapping?.sttIndex).toBe(0);
    expect(mapping?.isSplitNameColumns).toBe(true);
    expect(mapping?.familyNameIndex).toBe(1);
    expect(mapping?.givenNameIndex).toBe(2);
    expect(mapping?.classIndex).toBe(3);
  });

  it("extracts all student rows and concatenates full name", () => {
    const students = extractStudentsFromRosterMatrix(mock9A1SheetMatrix, { defaultClassName: "9A1" });
    expect(students).toHaveLength(5);
    expect(students[0].fullName).toBe("Lê Hoàng Ngọc Anh");
    expect(students[0].className).toBe("9A1");
    expect(students[0].grade).toBe("9");
    expect(students[0].valid).toBe(true);

    expect(students[1].fullName).toBe("Nguyễn Minh Trầm Anh");
    expect(students[2].fullName).toBe("Lê Hà Hồng Ánh");
    expect(students[3].fullName).toBe("Nông Đức Bảo");
    expect(students[4].fullName).toBe("Nguyễn Thanh Bình");
  });

  it("parses class name and grade correctly", () => {
    expect(parseClassNameAndGrade("9A1")).toEqual({ name: "9A1", grade: "9" });
    expect(parseClassNameAndGrade("10B2")).toEqual({ name: "10B2", grade: "10" });
    expect(parseClassNameAndGrade("6/1")).toEqual({ name: "6/1", grade: "6" });
  });

  it("extracts class list from multi-sheet school rosters", () => {
    const sheets = [
      { name: "9A1", matrix: mock9A1SheetMatrix },
      { name: "9A2", matrix: mock9A2SheetMatrix },
    ];
    const classes = extractClassesFromSchoolSheets(sheets, { grades: ["6", "7", "8", "9"] });
    expect(classes).toHaveLength(2);
    expect(classes[0]).toEqual(expect.objectContaining({
      name: "9A1",
      grade: "9",
      homeroomTeacher: "Trần Tường Tuấn",
      studentCount: 5,
      valid: true,
    }));
    expect(classes[1]).toEqual(expect.objectContaining({
      name: "9A2",
      grade: "9",
      homeroomTeacher: "Trần Tường Tuấn",
      studentCount: 3,
      valid: true,
    }));
  });

  it("handles real Vietnamese attendance sheet with accented title, split teacher cell and empty STT header", () => {
    const realSheetMatrix: Array<Array<string | number>> = [
      ["ĐIỂM DANH TIN HỌC QUỐC TẾ - LỚP 9 ", "CÔNG TY TNHH EDURISE GLOBAL Trung tâm tin học ERG Gv phụ trách: ", "Trần Tướng Tuấn", "", "", "", "Trường THCS TRƯƠNG CÔNG ĐỊNH"],
      ["", "Số tiết đã dạy:", "14", "Tuần:", "1"],
      ["", "HỌ VÀ TÊN", "", "LỚP", "", "29/09", "06/10"],
      ["", "", "", "", "1", "1"],
      ["", "Lê Hoàng Ngọc", "Anh", "9A1", "x", "x"],
      ["2", "Nguyễn Minh Trâm", "Anh", "9A1", "x", "x"],
      ["3", "Lê Hà Hồng", "Ánh", "9A1", "x", "x"],
      ["", "", "", "", ""],
      ["Tổng số", "", "", "", "3"],
    ];

    expect(isSchoolRosterMatrix(realSheetMatrix)).toBe(true);
    expect(extractTeacherFromHeader(realSheetMatrix)).toBe("Trần Tướng Tuấn");

    const students = extractStudentsFromRosterMatrix(realSheetMatrix);
    expect(students).toHaveLength(3);
    expect(students[0].fullName).toBe("Lê Hoàng Ngọc Anh");
    expect(students[0].className).toBe("9A1");
    expect(students[0].grade).toBe("9");
    expect(students[0].code).toBe("9A1-1");

    expect(students[1].fullName).toBe("Nguyễn Minh Trâm Anh");
    expect(students[1].code).toBe("9A1-2");

    expect(students[2].fullName).toBe("Lê Hà Hồng Ánh");
    expect(students[2].code).toBe("9A1-3");
  });
});
