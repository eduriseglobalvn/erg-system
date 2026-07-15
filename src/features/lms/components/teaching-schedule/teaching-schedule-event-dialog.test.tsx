import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { TeachingScheduleEventDialog } from "./teaching-schedule-event-dialog";

const draft = {
  className: "Lớp 10A", end: "2026-07-15T09:00", lesson: "Toán", note: "",
  room: "P101", school: "ERG", start: "2026-07-15T08:00", status: "confirmed" as const, title: "Tiết 1",
};

describe("TeachingScheduleEventDialog", () => {
  it("uses MUI without Tailwind or lucide", () => {
    const source = readFileSync(resolve("src/features/lms/components/teaching-schedule/teaching-schedule-event-dialog.tsx"), "utf8");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("className=");
  });

  it("renders an accessible dialog and saves the schedule", () => {
    const onSave = vi.fn();
    render(<TeachingScheduleEventDialog draft={draft} mode="create" onChange={vi.fn()} onClose={vi.fn()} onSave={onSave} />);
    expect(screen.getByRole("dialog", { name: "Tạo lịch dạy" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
