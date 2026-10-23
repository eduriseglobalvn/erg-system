import { createHash } from "node:crypto";

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function createContractLock(content, source) {
  return { source, sha256: sha256(content) };
}

export function verifyContractLock(content, lock) {
  if (!lock || typeof lock.sha256 !== "string") {
    throw new Error("contract lock is invalid");
  }
  const actual = sha256(content);
  if (actual !== lock.sha256) {
    throw new Error(`contract checksum mismatch: expected ${lock.sha256}, got ${actual}`);
  }
  return true;
}
