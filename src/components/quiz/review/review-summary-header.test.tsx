import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewSummaryHeader } from "@/components/quiz/review/review-summary-header";

describe("ReviewSummaryHeader", () => {
  it("sits on a white paper surface so it stays readable on the dark contrast-tone page", () => {
    render(<ReviewSummaryHeader scoreOutOf10="8" correct={8} total={10} elapsedSeconds={null} onBack={vi.fn()} />);
    const style = getComputedStyle(screen.getByRole("banner"));
    expect(style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(style.borderStyle).toBe("solid");
  });
});
