import { describe, expect, it } from "vitest";

import { toErgTone } from "./seo-crm-workspace-shared";

describe("toErgTone", () => {
  it("maps legacy badge tones to ErgStatusChip tones", () => {
    expect(["primary", "secondary", "success", "warning", "danger", "outline"].map((t) => toErgTone(t as never))).toEqual([
      "info", "neutral", "success", "warning", "error", "neutral",
    ]);
  });
});
