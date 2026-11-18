import { describe, expect, it } from "vitest";

import {
  countAssignedStudents,
  filterSchoolStudents,
  getAvatarStyle,
  getInitials,
} from "@/features/lcms/school-management/components/students/school-student-directory/student-directory-utils";
import type { SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";

const student = (o: Partial<SchoolStudent>) =>
  ({ fullName: "Nguyen Van A", code: "HS01", guardianPhone: "0900", grade: "6", className: "6A", status: "studying", ...o }) as SchoolStudent;

describe("getInitials", () => {
  it("falls back to HS", () => {
    expect(getInitials(null)).toBe("HS");
    expect(getInitials(undefined)).toBe("HS");
  });
  it("uses the shared initials of the last two words", () => {
    expect(getInitials("an")).toBe("A");
    expect(getInitials("Nguyen Van An")).toBe("VA");
    expect(getInitials("[TEST] Học sinh 01")).toBe("HS");
  });
});

describe("getAvatarStyle", () => {
  it("is deterministic per name", () => {
    expect(getAvatarStyle("Nguyen Van An")).toBe(getAvatarStyle("Nguyen Van An"));
    expect(getAvatarStyle(null)).toBe(getAvatarStyle("HS"));
  });
});

describe("filterSchoolStudents", () => {
  const list = [
    student({ code: "HS01" }),
    student({ fullName: "Tran B", code: "HS02", grade: "7", className: "7A", status: "at-risk", guardianPhone: "0911" }),
  ];
  const all = { selectedGrade: "all", selectedClass: "all", status: "all", search: "" };

  it("returns everyone for the default filter", () => {
    expect(filterSchoolStudents(list, all)).toHaveLength(2);
  });
  it("filters by grade, class and status", () => {
    expect(filterSchoolStudents(list, { ...all, selectedGrade: "7" }).map((s) => s.code)).toEqual(["HS02"]);
    expect(filterSchoolStudents(list, { ...all, selectedClass: "6A" }).map((s) => s.code)).toEqual(["HS01"]);
    expect(filterSchoolStudents(list, { ...all, status: "at-risk" }).map((s) => s.code)).toEqual(["HS02"]);
  });
  it("searches name, code and guardian phone case-insensitively", () => {
    expect(filterSchoolStudents(list, { ...all, search: " tran " }).map((s) => s.code)).toEqual(["HS02"]);
    expect(filterSchoolStudents(list, { ...all, search: "hs01" }).map((s) => s.code)).toEqual(["HS01"]);
    expect(filterSchoolStudents(list, { ...all, search: "0911" }).map((s) => s.code)).toEqual(["HS02"]);
  });
});

describe("countAssignedStudents", () => {
  it("ignores students without a class even when they carry subject ids", () => {
    const list = [
      student({ subjectIds: ["m1"] }),
      student({ subjectIds: ["m1"], className: "" }),
      student({ subjectIds: [] }),
    ];
    expect(countAssignedStudents(list)).toBe(1);
  });
});
