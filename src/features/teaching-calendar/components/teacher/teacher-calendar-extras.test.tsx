import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { ScheduleNoticeBanner, TeacherRoleToggle, TeacherSidePanel } from "./teacher-calendar-extras";
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
  expect(screen.getByRole("button", { name: "Tất cả · 7" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Trợ giảng · 2" }));
  expect(onChange).toHaveBeenCalledWith("assistant");
});

it("marks the banner as seen", () => {
  const onSeen = vi.fn();
  render(<ScheduleNoticeBanner notice={notice} onSeen={onSeen} others={2} />);
  expect(screen.getByText(/4 tiết mới ở THCS Trương Công Định từ 09\/11/)).toBeInTheDocument();
  expect(screen.getByText("và 2 thay đổi khác")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Đã xem" }));
  expect(onSeen).toHaveBeenCalled();
});

it("lists the next period and one line per school with the role", () => {
  render(<TeacherSidePanel events={[event({}), event({ id: "f", myRole: "ASSISTANT", schoolId: "s2", schoolName: "THCS Kết Đoàn" })]} now={new Date("2026-11-15T00:00:00+07:00")} />);
  expect(screen.getByText(/9A4 · Tiết 7 14:15 – 15:00 · PM 03/)).toBeInTheDocument();
  expect(screen.getByText("Trương Công Định · dạy chính 1 tiết")).toBeInTheDocument();
  expect(screen.getByText("Kết Đoàn · trợ giảng 1 tiết")).toBeInTheDocument();
  expect(screen.getByText("Tiết trợ giảng tính vào tải tuần.")).toBeInTheDocument();
});
