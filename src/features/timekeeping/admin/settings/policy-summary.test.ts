import { describe, expect, it } from "vitest";

import { policySummaryLines } from "./policy-summary";

const DEFAULT_POLICY = { lateToleranceMin: 5, lateBlockMin: 15, explanationsPerMonth: 3, explanationWindowDays: 3, annualLeaveDays: 12, seniorityStepYears: 5, lockDayOfMonth: 8 };

describe("policySummaryLines", () => {
  it("describes the default policy", () => {
    expect(policySummaryLines(DEFAULT_POLICY)).toEqual([
      "Dung sai đi muộn 5 phút",
      "Muộn > 5 phút trừ theo block 15 phút",
      "Giải trình tối đa 3 lần/tháng",
      "Gửi trong 3 ngày kể từ ngày thiếu",
      "Phép năm 12 ngày",
      "+1 ngày mỗi 5 năm thâm niên",
      "Chốt công ngày 08 hằng tháng",
    ]);
  });

  it("follows the values and never mentions overtime", () => {
    const lines = policySummaryLines({ ...DEFAULT_POLICY, lateToleranceMin: 10, lockDayOfMonth: 25 });
    expect(lines[0]).toBe("Dung sai đi muộn 10 phút");
    expect(lines[6]).toBe("Chốt công ngày 25 hằng tháng");
    expect(lines.join(" ")).not.toMatch(/làm thêm|OT/i);
  });
});
