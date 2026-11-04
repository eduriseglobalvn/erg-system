import { describe, expect, test } from "vitest";
import { employeeStatusView, scopeLabel, summarize } from "@/features/employee-management/lib/employee-display";

describe("employee display mapping", () => {
  test("maps every status to Vietnamese without leaking enum codes", () => {
    for (const status of ["ACTIVE", "PENDING", "INACTIVE", "BLOCKED", "BANNED", "UNKNOWN", "SOMETHING_NEW"]) {
      expect(employeeStatusView(status).label).not.toMatch(/^[A-Z_]+$/);
    }
    expect(employeeStatusView("ACTIVE")).toEqual({ label: "Đang hoạt động", tone: "success" });
  });

  test("resolves school scopes to names and hides raw ids", () => {
    const schools = new Map([["abc", "THPT Lê Quý Đôn"]]);
    expect(scopeLabel("SCHOOL:abc", schools)).toBe("THPT Lê Quý Đôn");
    expect(scopeLabel("SCHOOL:unknown-uuid", schools)).toBe("Trường học");
    expect(scopeLabel("SYSTEM", schools)).toBe("Toàn hệ thống");
    expect(scopeLabel("WEIRD:1", schools)).toBe("Phạm vi khác");
  });

  test("summarize dedupes and counts the rest", () => {
    expect(summarize(["a", "a", "b", "c"])).toEqual({ first: "a", rest: 2, all: ["a", "b", "c"] });
    expect(summarize([]).first).toBeUndefined();
  });
});
