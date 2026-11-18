import { describe, expect, it } from "vitest";

import { pathMatches } from "./portal-sidebar-utils";

describe("pathMatches", () => {
  it("matches home path only when on home path", () => {
    expect(pathMatches("/admin", "/admin", true)).toBe(true);
    expect(pathMatches("/admin", "/admin/", true)).toBe(true);
  });

  it("does not match root workspace path when visiting sub-routes", () => {
    // When visiting school management, "Trang chủ" (/admin) must NOT be active!
    expect(pathMatches("/admin", "/admin/school", true)).toBe(false);
    expect(pathMatches("/admin", "/admin/school-management", true)).toBe(false);
    expect(pathMatches("/admin", "/admin/reports", true)).toBe(false);
    expect(pathMatches("/admin", "/admin/users", true)).toBe(false);

    // Same for teacher home
    expect(pathMatches("/teacher/home", "/teacher/classes", true)).toBe(false);
    expect(pathMatches("/", "/report", true)).toBe(false);
  });

  it("lights teacher «Trang chủ» on the teacher landing page", () => {
    expect(pathMatches("/teacher/home", "/teacher", true)).toBe(true);
    expect(pathMatches("/teacher/home", "/teacher/", true)).toBe(true);
    expect(pathMatches("/teacher/home", "/teacher/dashboard", true)).toBe(true);
    expect(pathMatches("/teacher/homework", "/teacher", true)).toBe(false);
    // Admin «Trang chủ» keeps its own rule.
    expect(pathMatches("/admin", "/teacher", true)).toBe(false);
  });

  it("allows prefix matching for nested non-root branches", () => {
    expect(pathMatches("/admin/content", "/admin/content/resources", true)).toBe(true);
    expect(pathMatches("/admin/content", "/admin/content/quiz-bank", true)).toBe(true);
    expect(pathMatches("/admin/content", "/admin/other", true)).toBe(false);
  });
});
