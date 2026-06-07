import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Progress } from "@/components/ui/progress";

test("Progress exposes an indicator class hook for dashboard compatibility", () => {
  render(<Progress value={45} indicatorClassName="bg-emerald-500" />);

  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
  expect(document.querySelector("[data-slot='progress-indicator']")).toHaveClass("bg-emerald-500");
});
