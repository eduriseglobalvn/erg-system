import { describe, expect, it } from "vitest";

import { resolveStudentGroupsError } from "./student-groups-parts";

describe("resolveStudentGroupsError", () => {
  it("translates the class scope error instead of swallowing it", () => {
    expect(resolveStudentGroupsError(new Error("class scope is not allowed"))).toMatch(/chưa được phân quyền/);
  });
  it("returns null without an error and a generic Vietnamese message otherwise", () => {
    expect(resolveStudentGroupsError(null)).toBeNull();
    expect(resolveStudentGroupsError(new Error("boom"))).toMatch(/Không tải được/);
  });
});
