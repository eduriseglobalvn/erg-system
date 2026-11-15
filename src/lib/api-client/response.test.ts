import { describe, expect, it } from "vitest";

import { getErrorBody } from "./response";

describe("getErrorBody", () => {
  it("keeps a bare error code as a string", () => {
    expect(getErrorBody({ statusCode: 409, message: "x", errors: "HOLIDAY_EXISTS", data: null })?.details).toBe("HOLIDAY_EXISTS");
  });

  it("exposes the payload an error carries in data as details.data", () => {
    const body = getErrorBody({ statusCode: 409, message: "x", errors: "HOLIDAY_AFFECTS_PAST_PERIODS", data: { taughtPeriods: 14 } });
    expect(body?.code).toBe("HOLIDAY_AFFECTS_PAST_PERIODS");
    expect(body?.details).toEqual({ code: "HOLIDAY_AFFECTS_PAST_PERIODS", data: { taughtPeriods: 14 } });
  });
});
