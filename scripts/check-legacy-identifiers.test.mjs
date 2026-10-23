import test from "node:test";
import assert from "node:assert/strict";
import { classifyLegacyHit, scanText } from "./check-legacy-identifiers.mjs";

test("classifies public semantic hits separately from internal contract hits", () => {
  assert.equal(classifyLegacyHit("src/routes/legacy-route.ts", "lms"), "public-semantic");
  assert.equal(classifyLegacyHit("contracts/backend/schema.graphqls", "lms"), "allowlisted");
});

test("scans identifiers without treating unrelated words as hits", () => {
  assert.deepEqual(scanText("src/routes/legacy-route.ts", 'const label = "LCMS";'), [
    { filePath: "src/routes/legacy-route.ts", identifier: "lcms", class: "public-semantic" },
  ]);
});
