import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErgCalendarWorkspace, type ErgCalendarEvent } from "./erg-calendar-workspace";

const events: ErgCalendarEvent[] = [
  {
    attendees: "10A1",
    className: "10A1",
    date: "2026-08-13",
    duration: "08:00 - 09:00",
    id: "event-a",
    lane: "PUBLISHED",
    location: "P.101",
    school: "Trường Alpha",
    startTime: "08:00",
    subject: "Tin học",
    time: "08:00",
    title: "IC3 GS6",
    tone: "blue",
  },
];

describe("Teacher mobile calendar controls", () => {
  it("đóng mini calendar mặc định và chỉ mount sau khi bấm tiêu đề tháng", () => {
    renderCalendar();

    const monthDisclosure = screen.getByRole("button", { name: "Mở lịch tháng 8, 2026" });
    expect(monthDisclosure).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("erg-mobile-mini-calendar")).not.toBeInTheDocument();

    fireEvent.click(monthDisclosure);
    expect(screen.getByRole("button", { name: "Đóng lịch tháng 8, 2026" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("erg-mobile-mini-calendar")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Đóng lịch tháng 8, 2026" }));
    expect(screen.queryByTestId("erg-mobile-mini-calendar")).not.toBeInTheDocument();
  });

  it("mở picker trường/môn, giữ selected state và chuyển được sang view ba ngày", async () => {
    const onVisibleRangeChange = vi.fn();
    renderCalendar(onVisibleRangeChange);

    fireEvent.click(screen.getByRole("button", { name: "Lịch theo trường" }));
    expect(screen.getByRole("dialog", { name: "Chọn trường" })).toBeVisible();
    fireEvent.click(screen.getByRole("option", { name: /Trường Alpha/ }));

    await waitFor(() => expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      activeLane: "Lịch theo trường",
      selectedScopeId: "school-a",
      selectedScopeLabel: "Trường Alpha",
    })));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Chọn trường" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Lịch theo trường: Trường Alpha" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Lịch theo môn" }));
    expect(screen.getByRole("dialog", { name: "Chọn môn" })).toBeVisible();
    fireEvent.click(screen.getByRole("option", { name: /Tin học/ }));

    await waitFor(() => expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      activeLane: "Lịch theo môn",
      selectedScopeId: "subject-it",
      selectedScopeLabel: "Tin học",
    })));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Chọn môn" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "3 ngày" }));
    await waitFor(() => expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      from: "2026-08-13",
      mode: "three-day",
      to: "2026-08-15",
    })));
  });
});

function renderCalendar(onVisibleRangeChange = vi.fn()) {
  return render(
    <ErgCalendarWorkspace
      events={events}
      filterEventsByLane={false}
      filterEventsByScope={false}
      initialDate="2026-08-13"
      initialMode="schedule"
      lanes={["Lịch theo trường", "Lịch theo môn"]}
      mobileLayout
      onVisibleRangeChange={onVisibleRangeChange}
      resolveLaneScopeOptions={(activeLane) => activeLane === "Lịch theo trường"
        ? [{ color: "#1A73E8", count: 1, id: "school-a", label: "Trường Alpha" }]
        : activeLane === "Lịch theo môn"
          ? [{ color: "#188038", count: 1, id: "subject-it", label: "Tin học" }]
          : []}
      resolveScopeSelectLabel={(activeLane) => activeLane === "Lịch theo trường" ? "Chọn trường" : "Chọn môn"}
      showCreateButton={false}
      todayDate="2026-08-13"
    />,
  );
}
