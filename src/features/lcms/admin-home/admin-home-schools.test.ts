import { expect, it } from "vitest";

import { schoolInitials } from "./admin-home-schools";

it("abbreviates a school by its last two words", () => {
  expect(schoolInitials("THCS Cầu Giấy")).toBe("CG");
  expect(schoolInitials("Online")).toBe("O");
  expect(schoolInitials("  ")).toBe("?");
});
