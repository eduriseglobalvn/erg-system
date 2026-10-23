import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORIES = ["erg-system", "erg-spring", "elearning", "erg"];
const REQUIRED_MARKERS = [
  "D:/ERG/TASK/ERG_Task_Management_.xlsx",
  "Canonical ownership",
  "Contract change protocol",
];
const REQUIRED_CONTRACTS = {
  "erg-system": [
    "contracts/backend/erg-openapi.json",
    "contracts/backend/erg-openapi.lock.json",
    "contracts/backend/schema.graphqls",
    "contracts/backend/schema.graphqls.lock.json",
  ],
  "erg-spring": [
    "contracts/openapi/erg-openapi.json",
    "contracts/openapi/erg-openapi.sha256",
    "src/main/resources/graphql/schema.graphqls",
    "contracts/graphql/schema.graphqls.sha256",
  ],
};

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function auditCrossRepoGovernance({ roots }) {
  const findings = [];

  for (const repo of REPOSITORIES) {
    const root = roots[repo];
    const agentsPath = join(root, "AGENTS.md");
    if (!(await exists(agentsPath))) {
      findings.push({ code: "MISSING_AGENTS", repo, path: agentsPath });
      continue;
    }

    const agents = await readFile(agentsPath, "utf8");
    for (const marker of REQUIRED_MARKERS) {
      if (!agents.includes(marker)) {
        findings.push({ code: "MISSING_MARKER", repo, marker, path: agentsPath });
      }
    }
  }

  for (const [repo, paths] of Object.entries(REQUIRED_CONTRACTS)) {
    for (const relativePath of paths) {
      const path = join(roots[repo], relativePath);
      if (!(await exists(path))) {
        findings.push({ code: "MISSING_CONTRACT", repo, path });
      }
    }
  }

  const governanceDocument = join(
    roots["erg-system"],
    "docs/architecture/cross-repo-contract-release-protocol.md",
  );
  if (!(await exists(governanceDocument))) {
    findings.push({ code: "MISSING_GOVERNANCE_DOC", repo: "erg-system", path: governanceDocument });
  }

  const packagePath = join(roots["erg-system"], "package.json");
  if (!(await exists(packagePath))) {
    findings.push({ code: "MISSING_PACKAGE", repo: "erg-system", path: packagePath });
  } else {
    const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
    if (
      packageJson.scripts?.["governance:check"] !==
      "node scripts/check-plan-status.mjs && node scripts/check-cross-repo-governance.mjs"
    ) {
      findings.push({ code: "MISSING_GOVERNANCE_COMMAND", repo: "erg-system", path: packagePath });
    }
  }

  return { ok: findings.length === 0, findings };
}

function defaultRoots() {
  const ergRoot = resolve(process.env.ERG_ROOT ?? resolve(process.cwd(), ".."));
  return Object.fromEntries(REPOSITORIES.map((repo) => [repo, join(ergRoot, repo)]));
}

async function main() {
  const result = await auditCrossRepoGovernance({ roots: defaultRoots() });
  if (!result.ok) {
    for (const finding of result.findings) {
      console.error(`${finding.code} [${finding.repo}] ${finding.marker ?? finding.path}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log("Cross-repository governance check passed for erg-system, erg-spring, elearning, and erg.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
