import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

import { auditCrossRepoGovernance } from "./check-cross-repo-governance.mjs";

const AGENT_MARKERS = `
## Mandatory Planning & Task Workbook
D:/ERG/TASK/ERG_Task_Management_.xlsx
## Canonical ownership
## Contract change protocol
`;

async function createFixture() {
  const base = await mkdtemp(join(tmpdir(), "erg-governance-"));
  const roots = Object.fromEntries(
    ["erg-system", "erg-spring", "elearning", "erg"].map((name) => [name, join(base, name)]),
  );

  for (const root of Object.values(roots)) {
    await mkdir(root, { recursive: true });
    await writeFile(join(root, "AGENTS.md"), AGENT_MARKERS, "utf8");
  }

  const files = [
    [roots["erg-system"], "contracts/backend/erg-openapi.json"],
    [roots["erg-system"], "contracts/backend/erg-openapi.lock.json"],
    [roots["erg-system"], "contracts/backend/schema.graphqls"],
    [roots["erg-system"], "contracts/backend/schema.graphqls.lock.json"],
    [roots["erg-system"], "docs/architecture/cross-repo-contract-release-protocol.md"],
    [roots["erg-spring"], "contracts/openapi/erg-openapi.json"],
    [roots["erg-spring"], "contracts/openapi/erg-openapi.sha256"],
    [roots["erg-spring"], "src/main/resources/graphql/schema.graphqls"],
    [roots["erg-spring"], "contracts/graphql/schema.graphqls.sha256"],
  ];

  for (const [root, relativePath] of files) {
    const path = join(root, relativePath);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, "fixture", "utf8");
  }

  await writeFile(
    join(roots["erg-system"], "package.json"),
    JSON.stringify({
      scripts: {
        "governance:check":
          "node scripts/check-plan-status.mjs && node scripts/check-cross-repo-governance.mjs",
      },
    }),
    "utf8",
  );

  return roots;
}

test("accepts a complete four-repository governance contract", async () => {
  const roots = await createFixture();
  const result = await auditCrossRepoGovernance({ roots });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("reports missing repository rules, contract files, and ownership markers", async () => {
  const roots = await createFixture();
  await writeFile(join(roots.elearning, "AGENTS.md"), "no governance markers", "utf8");
  roots.erg = join(roots.erg, "missing-root");
  roots["erg-spring"] = join(roots["erg-spring"], "missing-contract-root");

  const result = await auditCrossRepoGovernance({ roots });

  assert.equal(result.ok, false);
  assert.ok(result.findings.some((finding) => finding.code === "MISSING_AGENTS" && finding.repo === "erg"));
  assert.ok(result.findings.some((finding) => finding.code === "MISSING_MARKER" && finding.repo === "elearning"));
  assert.ok(result.findings.some((finding) => finding.code === "MISSING_CONTRACT" && finding.repo === "erg-spring"));
});
