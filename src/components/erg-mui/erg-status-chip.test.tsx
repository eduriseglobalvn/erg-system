import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { DashboardStatusBadge } from "@/components/dashboard/dashboard-page-shell";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";

test("renders every tone with its label", () => {
  render(
    <>
      {(["success", "warning", "error", "info", "neutral"] as const).map((tone) => (
        <ErgStatusChip key={tone} label={`label-${tone}`} tone={tone} />
      ))}
    </>,
  );
  for (const tone of ["success", "warning", "error", "info", "neutral"]) {
    expect(screen.getByText(`label-${tone}`)).toBeInTheDocument();
  }
});

test("dot can be turned off", () => {
  const { container } = render(<ErgStatusChip dot={false} label="x" tone="success" />);
  expect(container.querySelector(".MuiChip-icon")).toBeNull();
});

test("legacy DashboardStatusBadge delegates to the same chip", () => {
  const { container } = render(<DashboardStatusBadge label="Quá hạn" tone="danger" />);
  expect(screen.getByText("Quá hạn")).toBeInTheDocument();
  expect(container.querySelector(".MuiChip-root")).not.toBeNull();
});
