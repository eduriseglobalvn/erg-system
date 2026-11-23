import { describe, expect, it } from "vitest";

import { rankChange } from "@/features/games/hack/loot-meta";
import { nextStarReward } from "@/features/games/hack/question-meta";
import { weakSubline } from "@/features/games/hack/screens/result-screen";
import { formatNumber } from "@/features/games/hack/ui/hack-ui";

describe("hack display helpers", () => {
  it("groups thousands with a space, as in the designs", () => {
    expect(formatNumber(1540)).toBe("1 540");
    expect(formatNumber(6240)).toBe("6 240");
    expect(formatNumber(950)).toBe("950");
    expect(formatNumber(1234567)).toBe("1 234 567");
  });

  it("stars of the next right answer: 100 + 10 x min(streak after it, 5)", () => {
    expect(nextStarReward(0)).toBe(110);
    expect(nextStarReward(2)).toBe(130);
    expect(nextStarReward(4)).toBe(150);
    expect(nextStarReward(9)).toBe(150);
  });

  it("says whether the rank went up, down or stayed", () => {
    expect(rankChange(4, 3)).toBe("lên hạng 3");
    expect(rankChange(3, 5)).toBe("xuống hạng 5");
    expect(rankChange(4, 4)).toBe("giữ hạng 4");
    expect(rankChange(null, 4)).toBe("hạng 4");
  });

  it("weak spot sub-line uses index + 1 and the wrong count", () => {
    expect(weakSubline({ index: 6, wrongCount: 2 })).toBe("nhiệm vụ 07 · sai 2 lần");
    expect(weakSubline({ index: 14, wrongCount: 0 })).toBe("nhiệm vụ 15");
  });
});
