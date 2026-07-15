import { expect, test } from "vitest";

import { queryKeys } from "@/lib/query-keys";

test("scopes account login-session cache by tenant and account", () => {
  expect(queryKeys.account.loginSessions("tenant-a", "account-a")).toEqual([
    "account",
    "login-sessions",
    "tenant-a",
    "account-a",
  ]);
  expect(queryKeys.account.loginSessions("tenant-a", undefined)).toEqual([
    "account",
    "login-sessions",
    "tenant-a",
    "anonymous",
  ]);
});

test("scopes dashboard bootstrap cache by portal tenant and account", () => {
  expect(queryKeys.dashboard.bootstrap("lms", "tenant-a", "account-a")).toEqual([
    "dashboard",
    "bootstrap",
    "lms",
    "tenant-a",
    "account-a",
  ]);
  expect(queryKeys.dashboard.bootstrap("lcms", "tenant-a", undefined)).toEqual([
    "dashboard",
    "bootstrap",
    "lcms",
    "tenant-a",
    "anonymous",
  ]);
  expect(queryKeys.lmsTeacherShell.bootstrap("tenant-a", "teacher-a")).toEqual([
    "dashboard",
    "bootstrap",
    "lms",
    "tenant-a",
    "teacher-a",
  ]);
});

test("scopes admin operation read caches by tenant", () => {
  expect(queryKeys.adminOperations.educationUnits(undefined, undefined, "tenant-a")).toEqual([
    "admin-operations",
    "education-units",
    "tenant-a",
  ]);
  expect(queryKeys.adminOperations.educationUnits("school", "center", "tenant-a")).toEqual([
    "admin-operations",
    "education-units",
    "tenant-a",
    "school",
    "center",
  ]);
  expect(queryKeys.adminOperations.learningResourcesV2("tenant-a")).toEqual([
    "admin-operations",
    "learning-resources-v2",
    "tenant-a",
  ]);
  expect(queryKeys.adminOperations.learningResourcesWorkspace(120, "tenant-a")).toEqual([
    "admin-operations",
    "learning-resources-v2",
    "tenant-a",
    "workspace",
    120,
  ]);
  expect(queryKeys.adminOperations.userAccess.options("tenant-a")).toEqual([
    "admin-operations",
    "user-access",
    "tenant-a",
    "options",
  ]);
  expect(queryKeys.adminOperations.userAccess.provision("tenant-a")).toEqual([
    "admin-operations",
    "user-access",
    "tenant-a",
    "provision",
  ]);
});

test("scopes question-bank shared workspace key by tenant", () => {
  expect(queryKeys.questionBank.workspace("tenant-a")).toEqual([
    "question-bank",
    "workspace",
    "tenant-a",
  ]);
});
