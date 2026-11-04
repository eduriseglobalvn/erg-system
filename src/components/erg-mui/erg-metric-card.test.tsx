import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import { ErgMetricStrip } from "./erg-metric-card";

it("renders values, shows em dash for missing data (not 0) and handles clicks", () => {
  const onClick = vi.fn();
  render(
    <ErgMuiProvider>
      <ErgMetricStrip
        items={[
          { label: "Đang học", value: 0, onClick },
          { label: "Chuyên cần", value: null },
          { label: "Doanh thu", value: undefined, href: "/x" },
        ]}
      />
    </ErgMuiProvider>,
  );
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getAllByText("—")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: /Đang học/ }));
  expect(onClick).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: /Doanh thu/ })).toHaveAttribute("href", "/x");
  expect(screen.queryByRole("button", { name: /Chuyên cần/ })).toBeNull();
});
