import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { TimeUpOverlay } from "@/components/quiz/time-up-overlay";

it("shows the submitting and offline copy, nothing when idle", () => {
  const { rerender } = render(<TimeUpOverlay phase="submitting" onRetry={() => {}} />);
  expect(screen.getByRole("alertdialog", { name: "Hết giờ" })).toBeTruthy();
  expect(screen.getByText("Hết giờ, đang nộp bài…")).toBeTruthy();
  rerender(<TimeUpOverlay phase="waiting-network" onRetry={() => {}} />);
  expect(screen.getByText("Đã hết giờ — bài sẽ được nộp khi có mạng")).toBeTruthy();
  rerender(<TimeUpOverlay phase="idle" onRetry={() => {}} />);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
