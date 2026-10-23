import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function listRelativeFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        files.push(relative(root, path).replaceAll("\\", "/"));
      }
    }));
  }

  await visit(root);
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

export function digestPaths(paths) {
  return createHash("sha256").update([...paths].sort().join("\n"), "utf8").digest("hex");
}

function differs(actual, expected) {
  return actual.count !== expected.count || actual.sha256 !== expected.sha256;
}

export async function auditFrontendRepositoryDrift({ roots, manifest }) {
  const [systemPaths, secondaryPaths, publicPaths] = await Promise.all([
    listRelativeFiles(join(roots["erg-system"], "src")),
    listRelativeFiles(join(roots.elearning, "src")),
    listRelativeFiles(join(roots.erg, "src")),
  ]);
  const secondarySet = new Set(secondaryPaths);
  const overlapPaths = systemPaths.filter((path) => secondarySet.has(path));
  const exactPathOverlap = { count: overlapPaths.length, sha256: digestPaths(overlapPaths) };
  const findings = [];

  if (differs(exactPathOverlap, manifest.exactPathOverlap)) {
    findings.push({
      code: "EXACT_OVERLAP_DRIFT",
      expected: manifest.exactPathOverlap,
      actual: exactPathOverlap,
    });
  }

  const frozenSecondaryScopes = [];
  for (const scope of manifest.frozenSecondaryScopes) {
    const paths = secondaryPaths.filter((path) => path.startsWith(scope.prefix));
    const actual = { name: scope.name, prefix: scope.prefix, count: paths.length, sha256: digestPaths(paths) };
    frozenSecondaryScopes.push(actual);
    if (differs(actual, scope)) {
      findings.push({ code: "SECONDARY_SCOPE_DRIFT", scope: scope.name, expected: scope, actual });
    }
  }

  for (const prefix of manifest.forbiddenPublicPrefixes) {
    const paths = publicPaths.filter((path) => path.startsWith(prefix));
    if (paths.length) {
      findings.push({ code: "PUBLIC_OPERATIONAL_SCOPE", prefix, paths });
    }
  }

  return {
    ok: findings.length === 0,
    findings,
    inventory: {
      repositories: {
        "erg-system": systemPaths.length,
        elearning: secondaryPaths.length,
        erg: publicPaths.length,
      },
      exactPathOverlap,
      frozenSecondaryScopes,
    },
  };
}

function defaultRoots() {
  const ergRoot = resolve(process.env.ERG_ROOT ?? resolve(process.cwd(), ".."));
  return Object.fromEntries(["erg-system", "elearning", "erg"].map((repo) => [repo, join(ergRoot, repo)]));
}

async function main() {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(await readFile(join(scriptDirectory, "frontend-repository-ownership.json"), "utf8"));
  const result = await auditFrontendRepositoryDrift({ roots: defaultRoots(), manifest });

  if (!result.ok) {
    for (const finding of result.findings) console.error(JSON.stringify(finding));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(result.inventory, null, 2));
  console.log("Frontend repository ownership and drift check passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
