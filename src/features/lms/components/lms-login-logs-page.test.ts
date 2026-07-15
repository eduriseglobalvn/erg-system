import { expect, test } from "vitest";

import { resolveLoginSessionRows } from "@/features/lms/components/lms-login-logs-page";

test("keeps API-enabled login session empty state instead of using mock logs", () => {
  expect(resolveLoginSessionRows([], true)).toEqual([]);
  expect(resolveLoginSessionRows(undefined, true)).toEqual([]);
});

test("uses mock login sessions only for no-API-base dev/offline mode", () => {
  const rows = resolveLoginSessionRows(undefined, false);

  expect(rows.length).toBeGreaterThan(0);
  expect(rows[0]?.sessionId).toMatch(/^mock-/);
});
