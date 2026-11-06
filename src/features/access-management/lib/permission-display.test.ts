import { describe, expect, test } from "vitest";
import {
  permissionDisplayName,
  permissionModuleLabel,
  roleDisplayName,
  scopeTypeLabel,
} from "@/features/access-management/lib/permission-display";

describe("access-management display mapping", () => {
  test("names permissions in Vietnamese from action and resource", () => {
    expect(permissionDisplayName({ group: "rbac", name: "users.manage" })).toBe("Quản lý người dùng");
    expect(permissionDisplayName({ group: "rbac", name: "rbac.role.assign" })).toBe("Gán nhóm quyền");
    expect(permissionDisplayName({ action: "create", group: "lms", name: "lms.assignment.create", resource: "assignment" })).toBe("Tạo bài tập");
  });

  test("falls back to server label then key", () => {
    expect(permissionDisplayName({ group: "x", label: "Nhãn máy chủ", name: "foo.bar" })).toBe("Nhãn máy chủ");
    expect(permissionDisplayName({ group: "x", label: "foo.bar", name: "foo.bar" })).toBe("foo.bar");
  });

  test("maps modules, roles and scope types", () => {
    expect(permissionModuleLabel("lms")).toBe("Học tập (LMS)");
    expect(permissionModuleLabel("unknown-module")).toBe("unknown-module");
    expect(roleDisplayName("lms.learner")).toMatch(/Học/);
    expect(scopeTypeLabel("school")).toBe("Trường học");
  });
});
