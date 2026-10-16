import fs from "node:fs";

export function findGeneratedUiFiles(files) {
  return files.filter((file) => file.replaceAll("\\", "/").includes("src/lib/api/generated/") && /\.(tsx|jsx)$/.test(file));
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/check-data-boundary.mjs")) {
  const files = fs.readdirSync("src/data", { withFileTypes: true });
  const generatedUi = findGeneratedUiFiles(files.filter((file) => file.isFile()).map((file) => `src/data/${file.name}`));
  if (generatedUi.length) process.exitCode = 1;
  else console.log("FE data boundary baseline passed.");
}
