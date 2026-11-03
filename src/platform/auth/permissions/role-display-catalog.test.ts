import { describe, expect, it } from "vitest";

import {
  getRoleMeta,
  getScopeMeta,
  groupRolesByCategory,
  ROLE_DISPLAY_CATALOG,
  SCOPE_DISPLAY_CATALOG,
} from "@/platform/auth/permissions/role-display-catalog";

describe("role-display-catalog", () => {
  it("translates raw system roles into clear Vietnamese titles and descriptions", () => {
    const rolesToTest = [
      "system.super_admin",
      "system.admin",
      "executive.director",
      "school.manager",
      "center_manager",
      "it_operator",
      "pdt_operator",
      "lms.admin",
      "lms_homeroom_teacher",
      "lms_subject_teacher",
      "lms_teacher_lead",
      "lms_teacher_standard",
      "lms_teacher_assistant",
      "lms_teacher_readonly",
      "lms.learner",
      "seo.manager",
      "seo.lead",
      "seo.staff",
    ];

    for (const role of rolesToTest) {
      const meta = getRoleMeta(role);
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.category).toBeTruthy();
      expect(meta.keyPermissions.length).toBeGreaterThan(0);
      expect(meta.badgeTone).toBeTruthy();
    }

    // Specific title checks
    expect(getRoleMeta("lms_teacher_assistant").label).toBe("Trợ giảng (Teacher Assistant)");
    expect(getRoleMeta("school.manager").label).toBe("Quản lý trường học / Hiệu trưởng");
    expect(getRoleMeta("lms_homeroom_teacher").label).toBe("Giáo viên chủ nhiệm");
    expect(getRoleMeta("pdt_operator").label).toBe("Chuyên viên Phòng Đào tạo (PĐT)");
    expect(getRoleMeta("seo.manager").label).toBe("Trưởng phòng Tuyển sinh & CRM");
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
    expect(getScopeMeta("TENANT").requiresId).toBe(false);

    expect(getScopeMeta("SCHOOL").label).toBe("Trường học liên kết");
    expect(getScopeMeta("SCHOOL").requiresId).toBe(true);

    expect(getScopeMeta("CLASS").label).toBe("Lớp học được phân công");
    expect(getScopeMeta("CLASS").requiresId).toBe(true);
  });

  it("groups roles into intuitive business categories", () => {
    const sampleRoles = [
      { id: "1", name: "system.super_admin" },
      { id: "2", name: "lms_homeroom_teacher" },
      { id: "3", name: "lms_teacher_assistant" },
      { id: "4", name: "seo.staff" },
      { id: "5", name: "school.manager" },
    ];

    const groups = groupRolesByCategory(sampleRoles);
    expect(groups["Ban Quản trị & Điều hành"]).toHaveLength(1);
    expect(groups["Đội ngũ Giảng dạy & Lớp học"]).toHaveLength(2);
    expect(groups["Quản lý Nhà trường & Đào tạo"]).toHaveLength(1);
    expect(groups["Tuyển sinh & Khách hàng (CRM)"]).toHaveLength(1);
  });
});
