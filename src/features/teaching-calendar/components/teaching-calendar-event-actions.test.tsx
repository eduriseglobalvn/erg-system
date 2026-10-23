import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ErgCalendarEvent } from "@/components/shared/erg-calendar-workspace";
import { TeachingCalendarEventActions } from "./teaching-calendar-event-actions";

const event: ErgCalendarEvent = {
  attendees: "Lớp 3A",
  className: "Lớp 3A",
  date: "2026-07-13",
  duration: "08:00 - 08:45",
  endTime: "08:45",
  id: "event-1",
  lane: "Lịch theo trường",
  location: "P.101",
  note: "Ghi chú cũ",
  roomId: "room-1",
  school: "ERG School",
  startTime: "08:00",
  teacher: "Nguyễn Văn A",
  time: "08:00",
  title: "Toán - Lớp 3A",
  tone: "blue",
};

describe("TeachingCalendarEventActions", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("only exposes commands allowed by calendar permissions", () => {
    render(
      <TeachingCalendarEventActions
        event={event}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        permissions={{ canDelete: false, canUpdate: true }}
      />,
    );

    expect(screen.getByRole("button", { name: "Chỉnh lịch" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xóa lịch" })).not.toBeInTheDocument();
  });

  it("submits editable room and note fields", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <TeachingCalendarEventActions
        event={event}
        onDelete={vi.fn()}
        onUpdate={onUpdate}
        permissions={{ canDelete: true, canUpdate: true }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh lịch" }));
    fireEvent.change(screen.getByLabelText("Tên phòng"), { target: { value: "P.202" } });
    fireEvent.change(screen.getByLabelText("Ghi chú"), { target: { value: "Đổi phòng học" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(event, {
      note: "Đổi phòng học",
      roomId: "room-1",
      roomName: "P.202",
    }));
  });

  it("confirms before deleting an event", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(
      <TeachingCalendarEventActions
        event={event}
        onDelete={onDelete}
        onUpdate={vi.fn()}
        permissions={{ canDelete: true, canUpdate: false }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Xóa lịch" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(event));
  });
});
