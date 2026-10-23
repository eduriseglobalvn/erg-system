import { expect, test } from "vitest";

import type { TeacherAccount } from "@/platform/auth/types/auth-types";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import type { StudentSession } from "@/platform/auth/api/student-auth-storage";
import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

const teacherAccount: TeacherAccount = {
  id: "teacher-1",
  fullName: "Teacher One",
  email: "teacher@erg.edu.vn",
  role: "teacher",
  provider: "password",
  department: "ERG",
  title: "Giáo viên",
  features: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-01-01T00:00:00.000Z",
};

test("allows teacher sessions to enter elearning only with explicit entitlement", () => {
  const teacherSession: StoredAuthSession = {
    accessToken: "teacher-token",
    portal: "lms",
    portals: ["lms", "elearning"],
  };

  expect(
    canAccessPortal({
      portal: "elearning",
      teacherAccount,
      teacherSession,
    }),
  ).toBe(true);
});

test("allows the configured root admin to enter elearning from a shared session", () => {
  const adminAccount: TeacherAccount = {
    ...teacherAccount,
    email: "admin@erg.edu.vn",
    role: "admin",
  };
  const teacherSession: StoredAuthSession = {
    accessToken: "admin-token",
    portal: "lms",
    portals: ["lms"],
  };

  expect(
    canAccessPortal({
      portal: "elearning",
      teacherAccount: adminAccount,
      teacherSession,
    }),
  ).toBe(true);
});

test("allows elearning when a student session exists", () => {
  const studentSession: StudentSession = {
    accessToken: "student-token",
    className: "Lớp 6A",
    email: "student@erg.edu.vn",
    loggedInAt: "2026-01-01T00:00:00.000Z",
    name: "Student One",
    portal: "elearning",
    rememberMe: true,
  };

  expect(
    canAccessPortal({
      portal: "elearning",
      studentSession,
    }),
  ).toBe(true);
});

test("allows teacher portals when a teacher session grants the teacher portal", () => {
  const teacherSession: StoredAuthSession = {
    accessToken: "teacher-token",
    portal: "lms",
    portals: ["lms", "lcms"],
  };

  expect(
    canAccessPortal({
      portal: "lms",
      teacherAccount,
      teacherSession,
    }),
  ).toBe(true);
});

test("allows CRM when the session has admin-style access", () => {
  const teacherSession: StoredAuthSession = {
    accessToken: "crm-token",
    portal: "crm",
    portals: ["crm"],
  };

  expect(
    canAccessPortal({
      portal: "crm",
      teacherAccount: { ...teacherAccount, role: "admin" },
      teacherSession,
    }),
  ).toBe(true);
});

test("does not merge LMS entitlement into LCMS", () => {
  const teacherSession: StoredAuthSession = {
    accessToken: "lms-token",
    portal: "lms",
    portals: ["lms"],
  };

  expect(
    canAccessPortal({
      portal: "lcms",
      teacherAccount,
      teacherSession,
    }),
  ).toBe(false);
});

test("requires the canonical route permission for a student workspace", () => {
  const studentSession: StudentSession = {
    accessToken: "student-token",
    className: "6A",
    email: "student@erg.edu.vn",
    loggedInAt: "2026-01-01T00:00:00.000Z",
    name: "Student One",
    portal: "elearning",
    rememberMe: true,
    permissions: ["elearning.assignment.read_self"],
    deniedPermissions: [],
  };

  expect(canAccessPortal({ portal: "elearning", studentSession, requiredPermission: "elearning.assignment.read_self" })).toBe(true);
  expect(canAccessPortal({ portal: "elearning", studentSession, requiredPermission: "elearning.assignment.submit" })).toBe(false);
});

test("does not treat a client-side wildcard portal list as a grant without a canonical workspace", () => {
  expect(canAccessPortal({
    portal: "crm",
    teacherAccount,
    teacherSession: { accessToken: "token", portals: ["*"] },
  })).toBe(false);
});
