import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";

import { attendanceErrorMessage, countLabel, markLabels } from "./attendance-copy";

describe("countLabel", () => {
  it("lowercases only the first letter", () => {
    expect(countLabel(markLabels.present)).toBe("có mặt");
    expect(countLabel(markLabels.absentUnexcused)).toBe("vắng K");
    expect(countLabel(markLabels.absentExcused)).toBe("vắng P");
  });
});

describe("attendanceErrorMessage", () => {
  it("explains a period that has not happened yet", () => {
    const error = new ApiClientError("x", "GRAPHQL_ERROR", 200, [{ extensions: { code: "PERIOD_NOT_HAPPENED" } }]);
    expect(attendanceErrorMessage(error)).toBe("Tiết này chưa diễn ra nên chưa điểm danh được.");
    expect(attendanceErrorMessage(new Error("boom"))).toBe("Chưa lưu được điểm danh. Thử lại sau.");
  });
});
