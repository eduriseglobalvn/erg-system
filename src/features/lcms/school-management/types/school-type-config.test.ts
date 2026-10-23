import { describe, expect, it } from "vitest";
import { getDefaultGrades, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";

describe("school type structure", () => {
  it("uses the standard grade ranges for K-12 school types", () => {
    expect(getDefaultGrades("primary")).toEqual(["1", "2", "3", "4", "5"]);
    expect(getDefaultGrades("secondary")).toEqual(["6", "7", "8", "9"]);
    expect(getDefaultGrades("high-school")).toEqual(["10", "11", "12"]);
  });

  it("does not create grades for universities and training centers", () => {
    expect(getDefaultGrades("university")).toEqual([]);
    expect(getDefaultGrades("training-center")).toEqual([]);
    expect(schoolTypeUsesGrades("university")).toBe(false);
    expect(schoolTypeUsesGrades("training-center")).toBe(false);
  });
});
