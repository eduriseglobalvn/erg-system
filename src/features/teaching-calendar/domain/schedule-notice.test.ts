import { expect, it } from "vitest";

import { noticeBannerText, noticeLinkText, parseScheduleNotice } from "./schedule-notice";

const base = {
  batchId: "b1", classes: JSON.stringify([{ id: "1", name: "9A2" }, { id: "2", name: "9A4" }]), fromDate: "2026-11-09", newPeriods: "4",
  periodRange: "6-9", role: "MAIN", schoolName: "THCS Trương Công Định", weekdays: "[3]",
};

it("builds the banner and the mobile link from the notification data", () => {
  const notice = parseScheduleNotice({ data: base, eventType: "SCHEDULE_PUBLISHED", id: "n1" });
  expect(notice && noticeBannerText(notice)).toBe("4 tiết mới ở THCS Trương Công Định từ 09/11 (Thứ 4, tiết 6–9) · bạn đã được cấp quyền lớp 9A2, 9A4");
  expect(notice && noticeLinkText(notice)).toBe("4 tiết mới từ 09/11 · Trương Công Định ›");
});

it("counts only assistant periods for an assistant", () => {
  const notice = parseScheduleNotice({ data: { ...base, assistantPeriods: "2", role: "ASSISTANT", weekdays: "[4]" }, eventType: "SCHEDULE_PUBLISHED", id: "n2" });
  expect(notice && noticeLinkText(notice)).toBe("2 tiết trợ giảng mới từ 09/11 · Trương Công Định ›");
});

it("ignores other events and incomplete data", () => {
  expect(parseScheduleNotice({ data: base, eventType: "POLICY_REMINDER", id: "n3" })).toBeNull();
  expect(parseScheduleNotice({ data: { schoolName: "x" }, eventType: "SCHEDULE_PUBLISHED", id: "n4" })).toBeNull();
});
