import { describe, expect, it } from "vitest";

import { pickRandom } from "./random-pick-dialog";

const candidates = [{ key: "a", ready: true }, { key: "b", ready: false }, { key: "c", ready: true }];

describe("pickRandom", () => {
  it("takes count distinct keys, leaving out not-ready ones when asked", () => {
    expect(pickRandom(candidates, 5, true).sort()).toEqual(["a", "c"]);
    expect(pickRandom(candidates, 3, false).sort()).toEqual(["a", "b", "c"]);
    expect(pickRandom(candidates, 1, false, () => 0)).toHaveLength(1);
  });
});
