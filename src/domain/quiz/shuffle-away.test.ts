import { describe, expect, it } from "vitest";

import { derangeAway, shuffleAway } from "@/domain/quiz/shuffle-away";

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

describe("derangeAway", () => {
  it("leaves no id at its avoid position, deterministically per seed", () => {
    const ids = ["a", "b", "c", "d"];
    for (let seed = 0; seed < 50; seed += 1) {
      const result = derangeAway(ids, ids, `q-${seed}`);
      expect([...result].sort()).toEqual(ids);
      expect(result.some((id, index) => id === ids[index])).toBe(false);
      expect(derangeAway(ids, ids, `q-${seed}`)).toEqual(result);
    }
  });
});
