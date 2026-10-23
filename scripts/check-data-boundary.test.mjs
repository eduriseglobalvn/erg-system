import test from "node:test";
import assert from "node:assert/strict";
import { findGeneratedUiFiles } from "./check-data-boundary.mjs";

test("generated transport cannot own UI files", () => {
  assert.deepEqual(findGeneratedUiFiles(["src/lib/api/generated/types.ts"]), []);
  assert.deepEqual(findGeneratedUiFiles(["src/lib/api/generated/debug.tsx"]), ["src/lib/api/generated/debug.tsx"]);
});
