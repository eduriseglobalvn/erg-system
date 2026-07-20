import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createContractLock, verifyContractLock } from "./api-contract-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sourceArgIndex = args.indexOf("--source");
const source = sourceArgIndex >= 0
  ? path.resolve(args[sourceArgIndex + 1])
  : path.resolve(root, "..", "erg-spring", "contracts/openapi/erg-openapi.json");
const contractDir = path.join(root, "contracts/backend");
const contractPath = path.join(contractDir, "erg-openapi.json");
const lockPath = path.join(contractDir, "erg-openapi.lock.json");
const generatedPath = path.join(root, "src/lib/api/generated/erg-openapi.ts");
const check = args.includes("--check");

if (!fs.existsSync(source)) throw new Error(`OpenAPI source not found: ${source}`);
fs.mkdirSync(contractDir, { recursive: true });
fs.mkdirSync(path.dirname(generatedPath), { recursive: true });

if (check) {
  const content = fs.readFileSync(contractPath, "utf8");
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  verifyContractLock(content, lock);
} else {
  const content = fs.readFileSync(source, "utf8");
  fs.writeFileSync(contractPath, content);
  fs.writeFileSync(lockPath, `${JSON.stringify(createContractLock(content, "erg-spring"), null, 2)}\n`);
}

const cli = path.join(root, "node_modules/openapi-typescript/bin/cli.js");
const generator = spawnSync(process.execPath, [
  cli,
  contractPath,
  "-o", generatedPath,
  "--alphabetize",
  "--immutable",
  ...(check ? ["--check"] : []),
], { stdio: "inherit" });
if (generator.error) throw generator.error;
if (generator.status !== 0) process.exit(generator.status ?? 1);
