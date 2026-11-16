import { describe, expect, it } from "vitest";

import type { HolidayConfig } from "../../api/timekeeping-types";
import {
  addCommand, affectedNotice, datesBetween, holidayCardSubtitle, holidayCardTitle, holidayCellSub, isPayLocked, monthGrid,
  pastPeriodsPayload, pastWarningIntro, rangeSummary, saturdaysOf, shiftMonth, sumLoads, weekdayDayMonth,
} from "./days-off-model";

const NHA_GIAO: HolidayConfig = { id: "h1", date: "2026-11-20", name: "Ngày Nhà giáo Việt Nam", kind: "COMPANY", payMode: "UNPAID", teachingAction: "CANCEL", createdByName: "HR", affectedPeriods: 18, affectedSchools: 6 };

describe("days-off calendar math", () => {
  it("builds a Monday-first 6x7 grid", () => {
    const grid = monthGrid("2026-11");
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-10-26");
    expect(grid[6]).toBe("2026-11-01");
    expect(grid[41]).toBe("2026-12-06");
  });

  it("lists the Saturdays of the month", () => {
    expect(saturdaysOf("2026-11")).toEqual(["2026-11-07", "2026-11-14", "2026-11-21", "2026-11-28"]);
    expect(saturdaysOf("2026-12")).toEqual(["2026-12-05", "2026-12-12", "2026-12-19", "2026-12-26"]);
  });

  it("names weekdays the Vietnamese way", () => {
    expect(weekdayDayMonth("2026-11-20")).toBe("Thứ 6, 20/11");
    expect(weekdayDayMonth("2026-11-22")).toBe("CN, 22/11");
  });

  it("moves between months across the year end", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
  });

  it("summarises a range as in the board", () => {
    expect(rangeSummary("2026-12-30", "2026-12-31")).toBe("2 ngày · Thứ 4, 30/12 – Thứ 5, 31/12");
    expect(rangeSummary("2026-12-31", "2026-12-30")).toBe("");
    expect(datesBetween("2026-12-30", "2027-01-01")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01"]);
  });
});

describe("days-off texts", () => {
  it("writes the cell sub-line and the card heading", () => {
    expect(holidayCellSub(NHA_GIAO)).toBe("Ngày Nhà giáo Việt Nam · không lương · 18 tiết huỷ");
    expect(holidayCellSub({ ...NHA_GIAO, name: "Du lịch", payMode: "PAID", teachingAction: "KEEP", affectedPeriods: 15 })).toBe("Du lịch · có lương · 15 tiết");
    expect(holidayCellSub({ ...NHA_GIAO, payMode: "ANNUAL_LEAVE", affectedPeriods: 0 })).toBe("Ngày Nhà giáo Việt Nam · trừ phép");
    expect(holidayCardTitle(NHA_GIAO)).toBe("Thứ 6, 20/11 · Ngày Nhà giáo Việt Nam");
    expect(holidayCardSubtitle(NHA_GIAO)).toBe("Toàn hệ thống · tạo bởi HR");
    expect(holidayCardSubtitle({ ...NHA_GIAO, createdByName: undefined })).toBe("Toàn hệ thống");
  });

  it("writes the orange notice for one day and for several", () => {
    expect(affectedNotice(18, 6, false)).toBe("18 tiết ở 6 trường rơi vào ngày này. Chọn «Huỷ tiết» thì các tiết chuyển sang «Nghỉ lễ»: giáo viên được báo, không cần báo giảng, không tính vào công tiết dạy.");
    expect(affectedNotice(31, 7, true)).toMatch(/^31 tiết ở 7 trường rơi vào các ngày này\./);
  });

  it("sums periods over a range and takes the largest school count of a day", () => {
    const loads = [{ date: "2026-12-30", periods: 20, schools: 7 }, { date: "2026-12-31", periods: 11, schools: 5 }, { date: "2027-01-04", periods: 9, schools: 9 }];
    expect(sumLoads(loads, "2026-12-30", "2026-12-31")).toEqual({ periods: 31, schools: 7 });
  });
});

describe("pay mode and the add command", () => {
  const base = { mode: "ONE" as const, from: "2026-11-27", to: "", name: " Du lịch công ty ", kind: "COMPANY" as const, payMode: null, teachingAction: "CANCEL" as const };

  it("locks state holidays and compensatory days to paid", () => {
    expect(isPayLocked("STATE")).toBe(true);
    expect(isPayLocked("COMPENSATORY")).toBe(true);
    expect(isPayLocked("COMPANY")).toBe(false);
  });

  it("has no command until the pay mode is chosen", () => {
    expect(addCommand(base)).toBeNull();
    expect(addCommand({ ...base, payMode: "ANNUAL_LEAVE" })).toEqual({ from: "2026-11-27", to: "2026-11-27", name: "Du lịch công ty", kind: "COMPANY", payMode: "ANNUAL_LEAVE", teachingAction: "CANCEL" });
  });

  it("sends PAID for a state holiday without a choice, and refuses a missing name or a reversed range", () => {
    expect(addCommand({ ...base, kind: "STATE" })?.payMode).toBe("PAID");
    expect(addCommand({ ...base, kind: "STATE", name: " " })).toBeNull();
    expect(addCommand({ ...base, mode: "RANGE", to: "2026-11-26", payMode: "PAID" })).toBeNull();
    expect(addCommand({ ...base, mode: "RANGE", to: "2026-11-29", payMode: "PAID" })?.to).toBe("2026-11-29");
  });
});

describe("HOLIDAY_AFFECTS_PAST_PERIODS payload", () => {
  const payload = { dates: ["2026-11-12"], taughtPeriods: 14, reportedPeriods: 9, schools: [{ schoolId: "a", schoolName: "THCS Kết Đoàn", taughtPeriods: 5, reportedPeriods: 3 }, { schoolId: "b", schoolName: "THCS Nguyễn Du", taughtPeriods: 9, reportedPeriods: 6 }] };

  it("reads details.data of the matching error only", () => {
    expect(pastPeriodsPayload({ code: "HOLIDAY_AFFECTS_PAST_PERIODS", details: { code: "HOLIDAY_AFFECTS_PAST_PERIODS", data: payload } })?.taughtPeriods).toBe(14);
    expect(pastPeriodsPayload({ code: "HOLIDAY_EXISTS", details: { data: payload } })).toBeNull();
    expect(pastPeriodsPayload(new Error("x"))).toBeNull();
  });

  it("opens the warning sentence for a day and for a range", () => {
    const one = pastPeriodsPayload({ code: "HOLIDAY_AFFECTS_PAST_PERIODS", details: { data: payload } });
    expect(pastWarningIntro(one!)).toBe("Thứ 5, 12/11 đã qua. Hôm đó có 14 tiết đã dạy ở 2 trường, 9 tiết đã có báo giảng. Thêm ngày nghỉ với «Huỷ tiết» sẽ huỷ cả các tiết này.");
    const range = pastPeriodsPayload({ code: "HOLIDAY_AFFECTS_PAST_PERIODS", details: { data: { ...payload, dates: ["2026-11-13", "2026-11-12"] } } });
    expect(pastWarningIntro(range!)).toMatch(/^Thứ 5, 12\/11 – Thứ 6, 13\/11 đã qua\. Các ngày đó có 14 tiết/);
  });
});
