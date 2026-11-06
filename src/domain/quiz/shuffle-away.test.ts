import { describe, expect, it } from "vitest";

import { shuffleAway } from "@/domain/quiz/shuffle-away";

describe("shuffleAway", () => {
  it.each([2, 3, 4, 5, 6])("n=%i: a fixed permutation per seed that never equals avoid", (n) => {
    const ids = Array.from({ length: n }, (_, index) => `id-${index}`);
    for (let seed = 0; seed < 50; seed += 1) {
      const result = shuffleAway(ids, ids, `q-${seed}`);
      expect([...result].sort()).toEqual([...ids].sort());
      expect(result).not.toEqual(ids);
      expect(shuffleAway(ids, ids, `q-${seed}`)).toEqual(result);
    }
  });

  it("does not mutate its input", () => {
    const ids = ["a", "b", "c"];
    shuffleAway(ids, ids, "seed");
    expect(ids).toEqual(["a", "b", "c"]);
  });
});
