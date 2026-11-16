import { describe, expect, it } from "vitest";

import { getRoleMeta, getScopeMeta, ROLE_DISPLAY_CATALOG } from "@/platform/auth/permissions/role-display-catalog";

describe("role-display-catalog", () => {
  it("keeps only the 7 business role codes", () => {
    expect(Object.keys(ROLE_DISPLAY_CATALOG).sort()).toEqual(
      ["admissions", "director", "lms.instructor", "lms.learner", "operations", "pdt_operator", "system.super_admin"],
    );
    expect(getRoleMeta("system.super_admin").label).toBe("Quản trị");
    expect(getRoleMeta("lms.instructor").label).toBe("Giáo viên");
  });

  it("handles unknown roles gracefully with clean formatting and fallback metadata", () => {
    const customRole = getRoleMeta("custom_finance_auditor");
    expect(customRole.label).toBe("Custom Finance Auditor");
    expect(customRole.category).toBe("Nhóm quyền bổ sung");
    expect(customRole.badgeTone).toBe("neutral");
  });

  it("provides comprehensive scope definitions for educational governance", () => {
    expect(getScopeMeta("SYSTEM").label).toBe("Toàn hệ thống ERG");
    expect(getScopeMeta("SYSTEM").requiresId).toBe(false);
    expect(getScopeMeta("TENANT").label).toBe("Toàn tổ chức (Toàn Tenant)");
    expect(getScopeMeta("SCHOOL").requiresId).toBe(true);
    expect(getScopeMeta("CLASS").label).toBe("Lớp học được phân công");
  });
});
