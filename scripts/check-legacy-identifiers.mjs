import fs from "node:fs";
import path from "node:path";

export const LEGACY_IDENTIFIERS = ["lcms", "lms", "elearning", "crm"];
export const PUBLIC_SEMANTIC_IDENTIFIERS = ["lcms", "elearning"];
const ALLOWED_SEGMENTS = ["generated", "contracts", "migration", "target", "node_modules", "compat", "legacy"];

export function isAllowlisted(filePath) {
  const normalized = filePath.replaceAll("\\", "/").toLowerCase();
  if (normalized.includes("/features/lcms/") || normalized.includes("/features/elearning/") || normalized.includes("/features/lms/") || normalized.includes("/platform/auth/") || normalized.includes("/platform/workspaces/") || normalized.endsWith("/routes/app-routes.tsx") || normalized.includes("/portal-workspace-switcher.tsx") || normalized.includes("/dashboard-placeholder-workspace.tsx")) return true;
  return ALLOWED_SEGMENTS.some((segment) => normalized.split("/").includes(segment));
}

export function classifyLegacyHit(filePath, identifier) {
  const normalized = filePath.replaceAll("\\", "/").toLowerCase();
  if (isAllowlisted(normalized)) return "allowlisted";
  if (normalized.includes("/routes/") || normalized.includes("/pages/") || normalized.includes("/components/")) return "public-semantic";
  return "internal";
}

export function scanText(filePath, source) {
  const normalizedPath = filePath.replaceAll("\\", "/").toLowerCase();
  if (isAllowlisted(normalizedPath) || normalizedPath.endsWith(".test.ts") || normalizedPath.endsWith(".test.tsx")) return [];
  return source.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("import ") || trimmed.startsWith("export ") || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.includes("@/features/")) return [];
    return PUBLIC_SEMANTIC_IDENTIFIERS.flatMap((identifier) => {
      const humanLabel = new RegExp(`\\b${identifier}\\b`, "i").test(line) && /["'`][^"'`]*[A-ZÀ-Ỹ][^"'`]*["'`]/.test(line);
      return humanLabel ? [{ filePath, identifier, class: classifyLegacyHit(filePath, identifier) }] : [];
    });
  });
}

function walk(root, output = []) {
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (["node_modules", "target", "dist", ".git"].includes(entry.name)) continue;
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) walk(filePath, output);
    else if (/\.(ts|tsx|java|graphqls|json|yml|yaml|sql|md)$/.test(entry.name)) {
      const hits = scanText(filePath, fs.readFileSync(filePath, "utf8"));
      output.push(...hits);
    }
  }
  return output;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/check-legacy-identifiers.mjs")) {
  const roots = [process.cwd(), path.resolve(process.cwd(), "..", "erg-spring")];
  const hits = roots.flatMap((root) => walk(root));
  const publicHits = hits.filter((hit) => hit.class === "public-semantic");
  console.log(JSON.stringify({ roots, totals: hits.length, publicHits: publicHits.length, sample: publicHits.slice(0, 20) }, null, 2));
  if (publicHits.length > 0 && process.argv.includes("--strict")) process.exitCode = 1;
}
