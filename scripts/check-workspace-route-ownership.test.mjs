import test from "node:test";
import assert from "node:assert/strict";
import { findLegacyPageImports } from "./check-workspace-route-ownership.mjs";

test("canonical route tree does not import legacy page roots", () => {
  assert.deepEqual(findLegacyPageImports('import("@/app/pages/admin/admin-page")'), []);
  assert.deepEqual(findLegacyPageImports('import("@/app/pages/lcms/lcms-page")'), ["lcms"]);
});
