import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PUNCH_RESULT } from "@/test/fixtures/timekeeping-punch-fixtures";
import { PunchSuccessView } from "./punch-success-view";

describe("PunchSuccessView (G03)", () => {
  it("shows the time, the early label, and a single contained Xong button", () => {
    const onDone = vi.fn();
    const { container } = render(<PunchSuccessView onDone={onDone} onNavigate={vi.fn()} reminderAt="11:20" result={PUNCH_RESULT} shiftName="Ca sáng" />);
    expect(screen.getByText("Đã chấm vào lúc 07:24")).toBeInTheDocument();
    expect(screen.getByText("Sớm 6 phút so với ca sáng")).toBeInTheDocument();
    expect(screen.getByText("Khuôn mặt + GPS")).toBeInTheDocument();
    expect(screen.getByText("11:20 · trước giờ ra ca 10 phút")).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(onDone).toHaveBeenCalled();
  });

  it("changes the title and shows the reason when the punch waits for review", () => {
    const result = { ...PUNCH_RESULT, verdict: "PENDING_REVIEW" as const, messageVi: "GPS chưa chính xác" };
    render(<PunchSuccessView onDone={vi.fn()} onNavigate={vi.fn()} result={result} />);
    expect(screen.getByText("Đã ghi nhận, chờ xem xét")).toBeInTheDocument();
    expect(screen.getByText("GPS chưa chính xác")).toBeInTheDocument();
  });
});
