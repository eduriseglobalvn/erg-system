import { expect, it } from "vitest";

import { studentDisplayStatus } from "./mappers";

it("shows enrolled and active students as studying, whatever the letter case", () => {
  expect(["ACTIVE", "active", "ENROLLED"].map(studentDisplayStatus)).toEqual(["studying", "studying", "studying"]);
  expect(studentDisplayStatus("AT_RISK")).toBe("at-risk");
  expect(studentDisplayStatus("INACTIVE")).toBe("inactive");
});
