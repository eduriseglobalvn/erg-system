import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { newViolations, violationKey } from "./check-legacy-ui.mjs";

test("violationKey is line-independent so moving legacy code does not churn the baseline", () => {
  const atLine10 = { file: "src/a.tsx", line: 10, rule: "legacy-import" };
  const atLine99 = { file: "src/a.tsx", line: 99, rule: "legacy-import" };
  assert.equal(violationKey(atLine10), violationKey(atLine99));
});

test("violationKey preserves the frozen owner for an extracted legacy UI file", () => {
  const extracted = {
    file: "src/features/lms/components/assign-homework-parts.tsx",
    line: 12,
    rule: "tailwind-utility:flex",
  };
  const original = {
    file: "src/features/lms/components/assign-homework-page.tsx",
    line: 1_600,
    rule: "tailwind-utility:flex",
  };

  assert.equal(violationKey(extracted), violationKey(original));
});

test("learning-resource authoring extracts retain the frozen workspace owner", () => {
  const original = {
    file: "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx",
    line: 448,
    rule: "tailwind-utility:flex",
  };

  for (const file of [
    "src/features/lcms/admin-operations/components/learning-resource-authoring-catalog-screens.tsx",
    "src/features/lcms/admin-operations/components/learning-resource-authoring-upload-screen.tsx",
  ]) {
    assert.equal(violationKey({ ...original, file }), violationKey(original));
  }

  assert.equal(
    violationKey({
      ...original,
      file: "src/features/lcms/admin-operations/components/learning-resource-authoring-fields.tsx",
      rule: "tailwind-utility:gap-1.5",
    }),
    violationKey({ ...original, rule: "tailwind-utility:gap-1.5" }),
  );
});

test("ratchet allows baselined violations and fails only on a new file|rule pair", () => {
  const violations = [
    { file: "src/old.tsx", line: 3, rule: "tailwind-utility:flex" },
    { file: "src/new.tsx", line: 1, rule: "legacy-import" },
  ];
  const frozen = [violationKey(violations[0])];

  const fresh = newViolations(violations, frozen);

  assert.deepEqual(fresh, [violations[1]]);
});

test("package audit command runs the frozen-baseline ratchet", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(manifest.scripts["audit:legacy-ui"], "node scripts/check-legacy-ui.mjs --baseline");
});
