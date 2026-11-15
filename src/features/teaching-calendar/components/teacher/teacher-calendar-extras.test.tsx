import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { ScheduleNoticeBanner, TeacherRoleToggle } from "./teacher-calendar-extras";
import { TeacherSidePanel } from "./teacher-side-panel";
import type { ScheduleNotice } from "../../domain/schedule-notice";
import type { TeachingCalendarEvent } from "../../api/teaching-calendar-workspace-types";

const notice: ScheduleNotice = { batchId: "b", classes: ["9A2"], fromDate: "2026-11-09", id: "n", newPeriods: 4, periodRange: "6-9", role: "MAIN", schoolName: "THCS Trương Công Định", weekdays: [3] };
const event = (patch: Partial<TeachingCalendarEvent>) => ({
  classId: "c", className: "9A4", date: "2026-11-16", endTime: "15:00", id: "e", myRole: "MAIN", periodStart: 7, roomName: "PM 03", schoolId: "s1", schoolName: "THCS Trương Công Định",
  startAt: "2026-11-16T14:15:00+07:00", startTime: "14:15", ...patch,
}) as TeachingCalendarEvent;

it("hides the role control when the week has no assistant period", () => {
  const { container } = render(<TeacherRoleToggle counts={{ all: 5, assistant: 0, main: 5 }} onChange={vi.fn()} value="all" />);
  expect(container).toBeEmptyDOMElement();
});

it("shows counts and reports the chosen role", () => {
  const onChange = vi.fn();
  render(<TeacherRoleToggle counts={{ all: 7, assistant: 2, main: 5 }} onChange={onChange} value="all" />);
  expect(screen.getByRole("tab", { name: "Tất cả · 7" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Trợ giảng · 2" }));
  expect(onChange).toHaveBeenCalledWith("assistant");
});

it("marks the banner as seen", () => {
  const onSeen = vi.fn();
  render(<ScheduleNoticeBanner notice={notice} onSeen={onSeen} others={2} />);
  expect(screen.getByText("4 tiết mới")).toBeInTheDocument();
  expect(screen.getByText(/ở THCS Trương Công Định từ 09\/11/)).toBeInTheDocument();
  expect(screen.getByText("và 2 thay đổi khác")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Đã xem" }));
  expect(onSeen).toHaveBeenCalled();
});

const panel = (events: TeachingCalendarEvent[], leave = new Map<string, "FULL" | "AM" | "PM">()) =>
  render(<TeacherSidePanel events={events} leave={leave} now={new Date("2026-11-15T00:00:00+07:00")} today="2026-11-15" weekTitle="Tuần này" />);

it("lists the next period, the total and one row per school with the role", () => {
  panel([event({}), event({ id: "f", myRole: "ASSISTANT", schoolId: "s2", schoolName: "THCS Kết Đoàn" })]);
  expect(screen.getByText("9A4 · Tiết 7")).toBeInTheDocument();
  expect(screen.getByText("Tổng")).toBeInTheDocument();
  expect(screen.getByText("Trương Công Định · dạy chính")).toBeInTheDocument();
  expect(screen.getByText("Kết Đoàn · trợ giảng")).toBeInTheDocument();
  expect(screen.getByText("Tiết trợ giảng tính vào tải tuần.")).toBeInTheDocument();
});

it("shows approved leave days from real requests and always offers the leave link", () => {
  panel([event({})], new Map([["2026-11-10", "FULL" as const]]));
  expect(screen.getByText("Thứ 3, 10/11 · Nghỉ phép")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Xin nghỉ phép →" })).toBeInTheDocument();
});

it("hides the leave heading when there is no leave", () => {
  panel([event({})]);
  expect(screen.queryByText("Ngày nghỉ")).not.toBeInTheDocument();
});
