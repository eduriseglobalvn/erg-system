import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { auditPlanStatuses } from "./check-plan-status.mjs";

async function createDocs(files) {
  const root = await mkdtemp(join(tmpdir(), "erg-plan-status-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(root, relativePath);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  return root;
}

test("accepts governed plans and specs with canonical task evidence", async () => {
  const root = await createDocs({
    "plans/2026-07-30-erg-079-current.md":
      "# Current\n\n> Status: active — canonical task ERG-079 in workbook.\n",
    "plans/2026-07-29-erg-078-old.md":
      "# Old\n\n> Status: completed — canonical task ERG-078 in workbook.\n",
    "specs/product-design.md":
      "# Design\n\n> Status: completed — delivered by the canonical implementation plan.\n",
  });

  assert.deepEqual(await auditPlanStatuses({ root }), { ok: true, findings: [] });
});

test("reports missing, invalid, misplaced, and duplicate status metadata", async () => {
  const root = await createDocs({
    "plans/missing.md": "# Missing\n\nBody\n",
    "plans/invalid.md": "# Invalid\n\n> Status: done — no.\n",
    "plans/misplaced.md": "# Misplaced\n\nBody\n\n> Status: completed — too late.\n",
    "specs/duplicate.md":
      "# Duplicate\n\n> Status: completed — first.\n\n> Status: active — second.\n",
  });

  const result = await auditPlanStatuses({ root });
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.findings.map(({ code, path }) => [code, path]),
    [
      ["INVALID_STATUS", "plans/invalid.md"],
      ["MISPLACED_STATUS", "plans/misplaced.md"],
      ["MISSING_STATUS", "plans/missing.md"],
      ["DUPLICATE_STATUS", "specs/duplicate.md"],
    ],
  );
});

test("requires ERG files to cite their canonical task and superseded files to target an existing document", async () => {
  const root = await createDocs({
    "plans/2026-07-30-erg-079-missing-task.md":
      "# Task\n\n> Status: completed — historical work shipped.\n",
    "plans/old.md":
      "# Old\n\n> Status: superseded — by plans/missing-successor.md.\n",
  });

  const result = await auditPlanStatuses({ root });
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.findings.map(({ code, path }) => [code, path]),
    [
      ["MISSING_TASK_REFERENCE", "plans/2026-07-30-erg-079-missing-task.md"],
      ["MISSING_SUPERSEDED_TARGET", "plans/old.md"],
    ],
  );
});
