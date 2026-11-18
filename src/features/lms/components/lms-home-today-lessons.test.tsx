import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-api";
vi.mock("@/platform/auth/hooks/use-auth-session", () => ({ useAuthSession: () => ({ session: { tenantId: "" } }) }));
import * as calendarApi from "@/features/teaching-calendar/api/teaching-calendar-api";
import { buildLessonLinks, TodayLessonsList, useTodayLessons } from "./lms-home-today-lessons";

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
    // The card lists every lesson of the teacher, so each row names its class.
    expect(screen.getByText("Lớp 9A1 · 08:00 - 09:00")).toBeInTheDocument();
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

describe("useTodayLessons", () => {
  it("loads today's lessons with the default tenant when the teacher session carries none", async () => {
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
    const loader = vi.spyOn(calendarApi, "loadLmsMyTeachingCalendar").mockResolvedValue({ events: [lesson] } as never);
    const client = new QueryClient();
    const { result } = renderHook(() => useTodayLessons(), {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    await waitFor(() => expect(result.current.events).toHaveLength(1));
    expect(loader.mock.calls[0][0].tenantId).toBeTruthy();
  });
});
