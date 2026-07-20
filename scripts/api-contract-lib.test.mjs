import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createContractLock, verifyContractLock } from "./api-contract-lib.mjs";

describe("frontend API contract lock", () => {
  test("pins source repository and sha256", () => {
    const lock = createContractLock("{\"openapi\":\"3.1.0\"}\n", "erg-spring");
    assert.equal(lock.source, "erg-spring");
    assert.match(lock.sha256, /^[a-f0-9]{64}$/);
    assert.doesNotThrow(() => verifyContractLock("{\"openapi\":\"3.1.0\"}\n", lock));
  });

  test("rejects stale contract content", () => {
    const lock = createContractLock("old", "erg-spring");
    assert.throws(() => verifyContractLock("new", lock), /checksum mismatch/);
  });
});
