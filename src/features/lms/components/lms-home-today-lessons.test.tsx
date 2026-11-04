import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-api";
import { buildLessonLinks, TodayLessonsList } from "./lms-home-today-lessons";

const lesson = {
  className: "9A1",
  classId: "class-9a1",
  date: "2026-11-05",
  endTime: "09:00",
  id: "sch-1",
  roomName: "P.101",
  startTime: "08:00",
  status: "PUBLISHED",
  subjectName: "Tin học",
  title: "IC3",
} as TeachingCalendarEvent;

describe("TodayLessonsList", () => {
  it("deep-links each card to the right class and date", () => {
    const links = buildLessonLinks(lesson);
    expect(links.attendance).toContain("/attendance?classId=class-9a1&date=2026-11-05");
    expect(links.classLog).toContain("/class-log?classId=class-9a1&date=2026-11-05");
    expect(links.assign).toContain("/homework/assign?classId=class-9a1");

    const onNavigate = vi.fn();
    render(<TodayLessonsList events={[lesson]} onNavigate={onNavigate} onOpenSchedule={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Điểm danh" }));
    expect(onNavigate).toHaveBeenCalledWith(links.attendance);
    fireEvent.click(screen.getByRole("button", { name: "Sổ đầu bài" }));
    expect(onNavigate).toHaveBeenLastCalledWith(links.classLog);
    fireEvent.click(screen.getByRole("button", { name: "Giao bài" }));
    expect(onNavigate).toHaveBeenLastCalledWith(links.assign);
  });

  it("shows an honest empty state linking to the calendar", () => {
    const onOpenSchedule = vi.fn();
    render(<TodayLessonsList events={[{ ...lesson, status: "CANCELLED" }]} onNavigate={vi.fn()} onOpenSchedule={onOpenSchedule} />);
    expect(screen.getByText("Hôm nay không có tiết dạy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem lịch" }));
    expect(onOpenSchedule).toHaveBeenCalled();
  });
});
