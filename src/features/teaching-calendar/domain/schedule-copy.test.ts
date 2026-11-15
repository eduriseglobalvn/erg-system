import { describe, expect, it } from "vitest";

import {
  addDaysToDate,
  conflictKindName,
  dayLabel,
  minutes,
  nearestGridDay,
  periodLabel,
  schoolInitials,
  sourceLabel,
  travelLabel,
  weekRangeLabel,
  weekStartOf,
  weeksLabel,
} from "./schedule-copy";

describe("schedule-copy (KE_HOACH_LICH_DAY 4.6)", () => {
  it("formats the week range in the three styles, also across months", () => {
    expect(weekRangeLabel("2026-11-09")).toBe("09 – 14 tháng 11, 2026");
    expect(weekRangeLabel("2026-11-09", "overview")).toBe("Tuần 09 – 14/11/2026");
    expect(weekRangeLabel("2026-11-09", "reuse")).toBe("09 – 14/11");
    expect(weekRangeLabel("2026-11-30", "reuse")).toBe("30/11 – 05/12");
    expect(weekRangeLabel("2026-11-30", "overview")).toBe("Tuần 30/11 – 05/12/2026");
  });

  it("labels days and finds the Monday of a week", () => {
    expect(dayLabel("2026-11-11")).toBe("Thứ 4, 11/11");
    expect(dayLabel("2026-11-15")).toBe("Chủ nhật, 15/11");
    expect(weekStartOf("2026-11-15")).toBe("2026-11-09");
    expect(weekStartOf("2026-11-09")).toBe("2026-11-09");
    expect(addDaysToDate("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("labels periods with and without a dot, and a period without time", () => {
    expect(periodLabel({ endTime: "14:15", periodNo: 6, startTime: "13:30" })).toBe("Tiết 6 · 13:30 – 14:15");
    expect(periodLabel({ endTime: "10:00", periodNo: 3, startTime: "09:15" }, "compact")).toBe("Tiết 3 09:15–10:00");
    expect(periodLabel({ periodNo: 5 })).toBe("Tiết 5");
  });

  it("labels affected weeks", () => {
    expect(weeksLabel(10, 10, "2026-11-27")).toBe("10/10 tuần");
    expect(weeksLabel(3, 10, "2026-11-27")).toBe("3/10 tuần · từ 27/11");
  });

  it("builds the source line", () => {
    expect(sourceLabel({
      batchLabel: "Đợt HK1·2", batchStatus: "PUBLISHED", createdAt: "2026-11-02T03:00:00Z", createdByName: "Hà", createdByRole: "Giáo vụ",
    })).toBe("Đợt HK1·2 · đã xuất bản · xếp bởi Hà (Giáo vụ) 02/11");
  });

  it("formats minutes with the prime sign", () => {
    expect(minutes(30)).toBe("30′");
    expect(minutes(330)).toBe("5h30′");
    expect(minutes(120)).toBe("2h");
  });

  it("shortens school names to initials for travel lines", () => {
    expect(schoolInitials("THCS Trương Công Định")).toBe("TCĐ");
    expect(schoolInitials("THCS Văn Lang")).toBe("VL");
    expect(schoolInitials("TCĐ")).toBe("TCĐ");
    const gap = { fromSchoolName: "THCS Văn Lang", gapMinutes: 30, requiredMinutes: 50, toSchoolName: "THCS Nguyễn Du" };
    expect(travelLabel(gap)).toBe("chỉ 30′ để di chuyển (cần ≥ 50′)");
    expect(travelLabel(gap, "short")).toBe("VL → ND chỉ 30′ · cần 50′");
    expect(travelLabel({ ...gap, gapMinutes: 330, toSchoolName: "THCS Trương Công Định" }, "far")).toBe("VL → TCĐ · cách 5h30′");
  });

  it("names conflict kinds as on the board", () => {
    expect(conflictKindName("TEACHER_TIME")).toBe("Trùng giáo viên");
    expect(conflictKindName("TRAVEL_TIME")).toBe("Không kịp di chuyển");
  });
});

it("nearestGridDay moves Sunday to Monday and keeps Mon-Sat", () => {
  expect(nearestGridDay("2026-11-15")).toBe("2026-11-16");
  expect(nearestGridDay("2026-11-14")).toBe("2026-11-14");
});
