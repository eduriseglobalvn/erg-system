import { describe, expect, it } from "vitest";

import {
  absenteesText, changeText, confirmLabel, dayMeta, groupCurriculum, lagChipText, lagText, lessonLogErrorKind, lessonLogErrorText, periodRangeText,
} from "./class-log-copy";

describe("class log copy", () => {
  it("words the lag from PPCT and actual period", () => {
    expect(lagText(10, 8)).toBe("Chậm 2 tiết so với PPCT");
    expect(lagText(10, 11)).toBe("Nhanh 1 tiết so với PPCT");
    expect(lagText(10, 10)).toBeNull();
    expect(lagChipText({ className: "6A6", lag: 2 })).toBe("6A6 chậm 2 tiết so với PPCT");
  });

  it("prints absentees as «Minh (P)» and a dash when nobody is absent", () => {
    expect(absenteesText([{ shortName: "Minh", excused: true }, { shortName: "Khoa", excused: false }])).toBe("Minh (P), Khoa (K)");
    expect(absenteesText([])).toBe("—");
  });

  it("builds the day heading and confirm label", () => {
    expect(dayMeta("AFTERNOON", 4)).toBe("Chiều · 4 tiết");
    expect(dayMeta(null, 0)).toBe("Không có tiết theo TKB");
    expect(confirmLabel(2)).toBe("Xác nhận 2 tiết");
  });

  it("words a log change", () => {
    expect(changeText({ field: "actualPeriod", oldValue: "10", newValue: "8" })).toBe("Tiết thực tế 10 → 8");
    expect(changeText({ field: "comment", oldValue: null, newValue: "Tốt" })).toBe("Nhận xét — → Tốt");
  });

  it("recognises the backend error codes in the code or the message", () => {
    expect(lessonLogErrorKind({ code: "GRAPHQL_ERROR", message: "STALE_VERSION: stale" })).toBe("STALE_VERSION");
    expect(lessonLogErrorKind({ message: "The entry changed since it was read; reload and retry." })).toBe("STALE_VERSION");
    expect(lessonLogErrorKind({ message: "The month of this period is closed." })).toBe("MONTH_CLOSED");
    expect(lessonLogErrorKind({ message: "ACTUAL_PERIOD_OUT_OF_RANGE" })).toBe("ACTUAL_PERIOD_OUT_OF_RANGE");
    expect(lessonLogErrorKind(new Error("boom"))).toBeNull();
    expect(lessonLogErrorText({ message: "MONTH_CLOSED" })).toBe("Tháng đã chốt, không sửa được.");
    expect(lessonLogErrorText({ message: "PERIOD_NOT_HAPPENED" })).toBe("Tiết này chưa diễn ra nên chưa điểm danh được.");
    expect(lessonLogErrorText({ message: "STALE_VERSION" })).toBe("Dữ liệu vừa được người khác sửa, đã tải lại.");
  });

  it("merges consecutive periods of one lesson and prints each topic once", () => {
    const groups = groupCurriculum([
      { topic: "Công dân số", period: 8, title: "Bài 5" },
      { topic: "Công dân số", period: 10, title: "Bài 7" },
      { topic: "Công dân số", period: 11, title: "Bài 7" },
      { topic: "Quản lý thông tin", period: 12, title: "Bài 8" },
    ]);
    expect(groups.map((g) => [g.topic, periodRangeText(g), g.title])).toEqual([
      ["Công dân số", "8", "Bài 5"], ["", "10–11", "Bài 7"], ["Quản lý thông tin", "12", "Bài 8"],
    ]);
  });
});
