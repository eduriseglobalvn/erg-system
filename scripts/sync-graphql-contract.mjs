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
  : path.resolve(root, "..", "erg-spring", "src/main/resources/graphql/schema.graphqls");
const contractDir = path.join(root, "contracts/backend");
const contractPath = path.join(contractDir, "schema.graphqls");
const lockPath = path.join(contractDir, "schema.graphqls.lock.json");
const check = args.includes("--check");

if (check) {
  const content = fs.readFileSync(contractPath, "utf8");
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  verifyContractLock(content, lock);
} else {
  if (!fs.existsSync(source)) throw new Error(`GraphQL schema source not found: ${source}`);
  fs.mkdirSync(contractDir, { recursive: true });
  const content = fs.readFileSync(source, "utf8");
  fs.writeFileSync(contractPath, content);
  fs.writeFileSync(lockPath, `${JSON.stringify(createContractLock(content, "erg-spring"), null, 2)}\n`);
}

const cli = path.join(root, "node_modules/@graphql-codegen/cli/cjs/bin.js");
const generator = spawnSync(process.execPath, [cli, "--config", path.join(root, "codegen.ts")], {
  stdio: "inherit",
});
if (generator.error) throw generator.error;
if (generator.status !== 0) process.exit(generator.status ?? 1);
