import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PlayerOfflineBanner,
  PlayerSaveIndicator,
  PlayerTimerText,
  saveIndicatorText,
  timerWarningLevel,
} from "@/components/quiz/player-status";

describe("timer warning", () => {
  it("warns at 5 minutes and 1 minute", () => {
    expect(timerWarningLevel(301)).toBe("none");
    expect(timerWarningLevel(300)).toBe("five-minutes");
    expect(timerWarningLevel(61)).toBe("five-minutes");
    expect(timerWarningLevel(60)).toBe("one-minute");
    expect(timerWarningLevel(0)).toBe("none");
  });

  it("announces only the threshold message through a polite live region", () => {
    const { rerender } = render(<PlayerTimerText seconds={600} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByText("10:00")).not.toHaveAttribute("aria-live");
    rerender(<PlayerTimerText seconds={299} />);
    expect(screen.getByRole("status")).toHaveTextContent("Còn dưới 5 phút");
    rerender(<PlayerTimerText seconds={59} />);
    expect(screen.getByRole("status")).toHaveTextContent("Còn dưới 1 phút");
  });
});

describe("autosave indicator", () => {
  it("maps draft sync state to text", () => {
    expect(saveIndicatorText({ status: "idle" }, true)).toBeNull();
    expect(saveIndicatorText({ status: "saving" }, true)).toBe("Đang lưu…");
    expect(saveIndicatorText({ status: "saved", savedAt: new Date(2026, 10, 4, 10, 42).getTime() }, true)).toBe("Đã lưu 10:42");
    expect(saveIndicatorText({ status: "local", error: "x" }, true)).toBe("Lưu trên máy, chờ mạng");
    expect(saveIndicatorText({ status: "saved", savedAt: 0 }, false)).toBe("Lưu trên máy, chờ mạng");
  });

  it("renders inside a polite status region", () => {
    render(<PlayerSaveIndicator online sync={{ status: "saving" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang lưu…");
  });
});

describe("offline banner", () => {
  it("is a non-blocking polite status", () => {
    render(<PlayerOfflineBanner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent("offline");
  });
});
