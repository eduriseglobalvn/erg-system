import { describe, expect, it } from "vitest";

import { countLabel, markLabels } from "./attendance-copy";

describe("countLabel", () => {
  it("lowercases only the first letter", () => {
    expect(countLabel(markLabels.present)).toBe("có mặt");
    expect(countLabel(markLabels.absentUnexcused)).toBe("vắng K");
    expect(countLabel(markLabels.absentExcused)).toBe("vắng P");
  });
});
