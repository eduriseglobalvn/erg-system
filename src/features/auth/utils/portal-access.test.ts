import { expect, test } from "vitest";

import type { TeacherAccount } from "@/features/auth/types/auth-types";
import { canAccessPortal } from "@/features/auth/utils/portal-access";
import type { StudentSession } from "@/features/auth/api/student-auth-storage";
import type { StoredAuthSession } from "@/features/auth/api/auth-token-storage";

const teacherAccount: TeacherAccount = {
  id: "teacher-1",
  fullName: "Teacher One",
  email: "teacher@erg.edu.vn",
  password: "",
  role: "teacher",
  provider: "password",
  department: "ERG",
  title: "Giáo viên",
  features: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-01-01T00:00:00.000Z",
};

test("allows teacher sessions to enter elearning", () => {
  const teacherSession: StoredAuthSession = {
    accessToken: "teacher-token",
    portal: "lms",
    portals: ["lms"],
  };

  expect(
    canAccessPortal({
      portal: "elearning",
      teacherAccount,
      teacherSession,
    }),
  ).toBe(true);
});

test("allows admin accounts to enter elearning with teacher session", () => {
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
    portals: ["lms", "hoclieu"],
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

test("allows LCMS with an LMS teacher session", () => {
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
  ).toBe(true);
});
