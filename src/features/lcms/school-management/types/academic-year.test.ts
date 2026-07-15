import { describe, expect, it } from "vitest";
import { formatAcademicYear, getAcademicYearOptions, getAcademicYearStart } from "@/features/lcms/school-management/types/academic-year";

describe("academic year", () => {
  it("automatically derives the ending year", () => {
    expect(formatAcademicYear(2025)).toBe("2025–2026");
    expect(formatAcademicYear(2026)).toBe("2026–2027");
  });

  it("reads existing academic year formats and keeps the selected year available", () => {
    expect(getAcademicYearStart("2025-2026")).toBe(2025);
    expect(getAcademicYearStart("2026–2027")).toBe(2026);
    expect(getAcademicYearOptions(2025, 2026)).toContain(2025);
  });
});
