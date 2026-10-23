import fs from "node:fs";

export function findLegacyPageImports(source) {
  return [...source.matchAll(/@\/app\/pages\/(lcms|lms|elearning)\//g)].map((match) => match[1]);
}

if (import.meta.url.endsWith("check-workspace-route-ownership.mjs")) {
  const source = fs.readFileSync("src/routes/app-routes.tsx", "utf8");
  const violations = findLegacyPageImports(source);
  if (violations.length) {
    console.error(`Route tree imports legacy page roots: ${violations.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Canonical workspace route ownership passed.");
  }
}
