import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, ProgressBar } from "@/components/ui/dashboard-kit";

test("dashboard Card exports preserve the shadcn card slot contract", () => {
  render(
    <Card data-testid="card">
      <CardHeader data-testid="header">
        <CardTitle>Learning snapshot</CardTitle>
        <CardDescription>Updated today</CardDescription>
      </CardHeader>
      <CardContent data-testid="content">Ready</CardContent>
    </Card>,
  );

  expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
  expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "card-header");
  expect(screen.getByText("Learning snapshot")).toHaveAttribute("data-slot", "card-title");
  expect(screen.getByText("Updated today")).toHaveAttribute("data-slot", "card-description");
  expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "card-content");
});

test("dashboard ProgressBar uses the shadcn progressbar semantics and clamps values", () => {
  render(<ProgressBar value={160} />);

  const progress = screen.getByRole("progressbar");
  expect(progress).toHaveAttribute("data-slot", "progress");
  expect(progress).toHaveAttribute("aria-valuenow", "100");
});
