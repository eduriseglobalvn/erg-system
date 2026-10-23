import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED = new Set([
  "src/lib/api/api-endpoints.ts",
  "src/lib/api/contract-typecheck.ts",
]);

function normalize(file) {
  return file.replaceAll("\\", "/");
}

function ignored(file) {
  const normalized = normalize(file);
  return ALLOWED.has(normalized)
    || normalized.includes("/generated/")
    || /\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized);
}

export function findEndpointLiterals(files) {
  const findings = [];
  for (const [file, source] of Object.entries(files)) {
    if (ignored(file)) continue;
    source.split(/\r?\n/).forEach((line, index) => {
      if (/(?:["'`])\/api\//.test(line)) findings.push({ file: normalize(file), line: index + 1 });
    });
  }
  return findings;
}

function sourceFiles(dir, output = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(absolute, output);
    else if (/\.[jt]sx?$/.test(entry.name)) {
      const relative = normalize(path.relative(ROOT, absolute));
      output[relative] = fs.readFileSync(absolute, "utf8");
    }
  }
  return output;
}

function main() {
  const findings = findEndpointLiterals(sourceFiles(path.join(ROOT, "src")));
  if (!findings.length) return;
  for (const finding of findings) console.error(`${finding.file}:${finding.line}: endpoint literal must use API_ENDPOINTS`);
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
