import test from "node:test";
import assert from "node:assert/strict";
import { findOwnershipViolations } from "./check-frontend-folder-boundary.mjs";

test("allows new files in page and dashboard roots when owned", () => {
  assert.deepEqual(findOwnershipViolations(["src/pages/new-page.tsx", "src/layouts/dashboard/new-shell.tsx"]), []);
});

test("rejects UI files under generated transport ownership", () => {
  assert.deepEqual(findOwnershipViolations(["src/lib/api/generated/new-page.tsx"]), ["src/lib/api/generated/new-page.tsx"]);
});
