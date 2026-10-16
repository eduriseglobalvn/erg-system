import { expect, test } from "vitest";

import { isPersistableQuery, queryCacheScopeKey, QUERY_CACHE_BUSTER, QUERY_CACHE_STORAGE_KEY } from "@/lib/query-persistence";

test("persists only offline-core query families", () => {
  for (const family of ["attendance", "homework", "scores"] as const) {
    expect(isPersistableQuery({ queryKey: ["lms", family, "tenant-a", "account-a", "class-a"] })).toBe(true);
    expect(isPersistableQuery({ queryKey: ["lms", family, "tenant-a", "anonymous", "class-a"] })).toBe(false);
    expect(isPersistableQuery({ queryKey: ["lms", family, "tenant-a", "", "class-a"] })).toBe(false);
    expect(isPersistableQuery({ queryKey: ["lms", family, "tenant-a"] })).toBe(false);
  }
  expect(isPersistableQuery({ queryKey: ["lms", "class-workspace", "tenant-a", "account-a", "class-management", "school-a", "class-a"] })).toBe(true);
  expect(isPersistableQuery({ queryKey: ["lms", "class-workspace", "tenant-a", "anonymous", "class-management", "school-a", "class-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["lms", "student-groups", "tenant-a", "account-a", "class-a"] })).toBe(true);
  expect(isPersistableQuery({ queryKey: ["lms", "student-groups", "tenant-a", "", "class-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["lms", "assignment-progress-workspace", "tenant-a", "account-a", "assignment-a"] })).toBe(true);
  expect(isPersistableQuery({ queryKey: ["lms", "assignment-progress-workspace", "tenant-a", "assignment-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["student-dashboard", "tenant-a", "account-a"] })).toBe(true);
  expect(isPersistableQuery({ queryKey: ["student-dashboard", "tenant-a", "anonymous"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["student-dashboard", "", "account-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["student-dashboard", "tenant-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["student-engagement", "feed", "tenant-a", "account-a"] })).toBe(true);
  expect(isPersistableQuery({ queryKey: ["student-engagement", "feed", "tenant-a", "anonymous"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["student-engagement", "feed", "", "account-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["lms-teacher-shell", "teacher-homework-workspace", "tenant-a", "account-a"] })).toBe(true);
  expect(isPersistableQuery({ queryKey: ["lms-teacher-shell", "teacher-homework-workspace", "tenant-a", "anonymous"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["lms-teacher-shell", "teacher-homework-workspace", "tenant-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["lms", "notification-center", "tenant-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["lms", "unrelated-report", "tenant-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["security-feed", "tenant-a"] })).toBe(false);
  expect(isPersistableQuery({ queryKey: ["auth", "session", "account-a"] })).toBe(false);
});

test("persists CRM workspace only with a concrete tenant and account scope", () => {
  expect(isPersistableQuery({ queryKey: ["crm", "workspace", "crm", "tenant-a", "seo-a"] } as never)).toBe(true);
  expect(isPersistableQuery({ queryKey: ["crm", "workspace", "crm", "tenant-a", "anonymous"] } as never)).toBe(false);
});

test("does not persist quiz packages through the generic query cache", () => {
  expect(isPersistableQuery({ queryKey: ["quiz-runtime", "package", "tenant-a", "elearning", "quiz-a"] })).toBe(false);
});

test("creates a scope key that isolates portal tenant and account", () => {
  expect(queryCacheScopeKey({ portal: "lms", tenantId: "tenant-a", accountId: "account-a" })).toBe("lms:tenant-a:account-a");
  expect(queryCacheScopeKey({ portal: "lms", workspace: "ADMIN", tenantId: "tenant-a", accountId: "account-a" })).toBe("lms:ADMIN:tenant-a:account-a");
});

test("versions the persisted cache key so schema changes migrate instead of hydrating stale data", () => {
  expect(QUERY_CACHE_STORAGE_KEY).toBe(`ERG_QUERY_CACHE:${QUERY_CACHE_BUSTER}`);
  expect(QUERY_CACHE_BUSTER).toBe("erg-query-cache-v6");
});
