import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import {
  auditFrontendRepositoryDrift,
  digestPaths,
  listRelativeFiles,
} from "./check-frontend-repository-drift.mjs";

async function writeFixtureFile(root, relativePath) {
  const path = join(root, "src", relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, relativePath, "utf8");
}

async function createFixture() {
  const base = await mkdtemp(join(tmpdir(), "erg-repository-drift-"));
  const roots = Object.fromEntries(
    ["erg-system", "elearning", "erg"].map((repo) => [repo, join(base, repo)]),
  );

  await writeFixtureFile(roots["erg-system"], "features/lms/canonical.ts");
  await writeFixtureFile(roots["erg-system"], "features/lms/shared.ts");
  await writeFixtureFile(roots.elearning, "features/lms/legacy.ts");
  await writeFixtureFile(roots.elearning, "features/lms/shared.ts");
  await writeFixtureFile(roots.erg, "app/page.tsx");

  const systemPaths = await listRelativeFiles(join(roots["erg-system"], "src"));
  const secondaryPaths = await listRelativeFiles(join(roots.elearning, "src"));
  const overlap = systemPaths.filter((path) => secondaryPaths.includes(path));
  const frozenLms = secondaryPaths.filter((path) => path.startsWith("features/lms/"));
  const manifest = {
    version: 1,
    exactPathOverlap: { count: overlap.length, sha256: digestPaths(overlap) },
    frozenSecondaryScopes: [
      { name: "lms", prefix: "features/lms/", count: frozenLms.length, sha256: digestPaths(frozenLms) },
    ],
    forbiddenPublicPrefixes: ["features/lms/", "features/lcms/", "features/crm/", "features/elearning/"],
  };

  return { base, roots, manifest };
}

test("accepts the declared repository ownership snapshot", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.base, { recursive: true, force: true }));

  const result = await auditFrontendRepositoryDrift(fixture);

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.inventory.exactPathOverlap.count, 1);
});

test("rejects path drift in a frozen secondary scope", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.base, { recursive: true, force: true }));
  await writeFixtureFile(fixture.roots.elearning, "features/lms/new-legacy.ts");

  const result = await auditFrontendRepositoryDrift(fixture);

  assert.equal(result.ok, false);
  assert.ok(result.findings.some((finding) => finding.code === "SECONDARY_SCOPE_DRIFT"));
});

test("rejects a new exact relative-path overlap", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.base, { recursive: true, force: true }));
  await writeFixtureFile(fixture.roots["erg-system"], "components/copied.tsx");
  await writeFixtureFile(fixture.roots.elearning, "components/copied.tsx");

  const result = await auditFrontendRepositoryDrift(fixture);

  assert.equal(result.ok, false);
  assert.ok(result.findings.some((finding) => finding.code === "EXACT_OVERLAP_DRIFT"));
});

test("rejects operational feature scopes in the public CMS", async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture.base, { recursive: true, force: true }));
  await writeFixtureFile(fixture.roots.erg, "features/lcms/copied-authoring.tsx");

  const result = await auditFrontendRepositoryDrift(fixture);

  assert.equal(result.ok, false);
  assert.ok(result.findings.some((finding) => finding.code === "PUBLIC_OPERATIONAL_SCOPE"));
});
