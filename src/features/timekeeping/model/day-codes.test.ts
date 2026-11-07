import { expect, test } from "vitest";

import { newIdempotencyKey } from "../api/timekeeping-api";
import { DAY_CODE, dayCodeFor } from "./day-codes";

test("timesheet symbols follow the plan", () => {
  expect(DAY_CODE.HALF.code).toBe("½");
  expect(Object.fromEntries(Object.entries(DAY_CODE).map(([status, { code }]) => [status, code]))).toEqual({
    FULL: "X", LATE_EARLY: "M", HALF: "½", LEAVE: "P", SICK: "Ô", BUSINESS: "CT",
    MISSING_PUNCH: "KC", ABSENT_UNPAID: "KC", HOLIDAY: "L", OFF: "",
  });
});

test("unpaid leave shows KP", () => {
  expect(dayCodeFor("LEAVE", "UNPAID").code).toBe("KP");
  expect(dayCodeFor("LEAVE", "ANNUAL").code).toBe("P");
  expect(dayCodeFor("FULL", "UNPAID").code).toBe("X");
});

test("newIdempotencyKey is 36 chars even without crypto.randomUUID", () => {
  expect(newIdempotencyKey()).toHaveLength(36);
  const original = crypto.randomUUID;
  Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined });
  try {
    const key = newIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newIdempotencyKey()).not.toBe(key);
  } finally {
    Object.defineProperty(crypto, "randomUUID", { configurable: true, value: original });
  }
});
