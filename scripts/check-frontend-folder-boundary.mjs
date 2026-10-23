import fs from "node:fs";
import { execFileSync } from "node:child_process";

export function findOwnershipViolations(files) {
  return files.filter((file) => {
    const normalized = file.replaceAll("\\", "/");
    return normalized.includes("/generated/") && normalized.endsWith(".tsx");
  });
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}`) {
  const names = execFileSync("git", ["diff", "--name-only", "--diff-filter=A", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const violations = findOwnershipViolations(names);
  if (violations.length) {
    console.error("Generated transport directories cannot own UI files:\n" + violations.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Frontend folder boundary check passed.");
  }
}
