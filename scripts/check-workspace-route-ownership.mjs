import fs from "node:fs";

export function findLegacyPageImports(source) {
  return [...source.matchAll(/@\/app\/pages\/(lcms|lms|elearning)\//g)].map((match) => match[1]);
}

if (import.meta.url.endsWith("check-workspace-route-ownership.mjs")) {
  const source = ["src/routes/app-routes.tsx", ...fs.readdirSync("src/routes/portals").map((name) => `src/routes/portals/${name}`)]
    .map((file) => fs.readFileSync(file, "utf8"))
    .join(";");
  const violations = findLegacyPageImports(source);
  if (violations.length) {
    console.error(`Route tree imports legacy page roots: ${violations.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Canonical workspace route ownership passed.");
  }
}
