import { expect, test } from "vitest";

import { roleMutationInvalidationKeys } from "./use-access-management";

test("role mutations refresh roles and permission counts without invalidating the access root", () => {
  expect(roleMutationInvalidationKeys.create("tenant-a")).toEqual([
    ["access-management", "tenant-a", "roles"],
    ["access-management", "tenant-a", "permissions"],
  ]);
  expect(roleMutationInvalidationKeys.update("tenant-a", "role-1")).toEqual([
    ["access-management", "tenant-a", "roles"],
    ["access-management", "tenant-a", "role", "role-1"],
    ["access-management", "tenant-a", "permissions"],
  ]);
});
