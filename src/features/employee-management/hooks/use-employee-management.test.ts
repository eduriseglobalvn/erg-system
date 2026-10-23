import { expect, test } from "vitest";

import { employeeMutationInvalidationKeys } from "./use-employee-management";

test("employee mutations invalidate only affected list/detail/session families", () => {
  expect(employeeMutationInvalidationKeys.create("tenant-a")).toEqual([
    ["employee-management", "tenant-a", "list"],
  ]);
  expect(employeeMutationInvalidationKeys.account("tenant-a", "user-1")).toEqual([
    ["employee-management", "tenant-a", "list"],
    ["employee-management", "tenant-a", "detail", "user-1"],
  ]);
  expect(employeeMutationInvalidationKeys.revokeSession("tenant-a", "user-1")).toEqual([
    ["employee-management", "tenant-a", "sessions", "user-1"],
    ["employee-management", "tenant-a", "detail", "user-1"],
  ]);
});
