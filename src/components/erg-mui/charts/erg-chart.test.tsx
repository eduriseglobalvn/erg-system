import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErgChartContainer, type ErgChartConfig } from "@/components/erg-mui/charts/erg-chart";

const config = {
  competency: { label: "Năng lực", color: "#2563EB" },
  participation: { label: "Tham gia", color: "#059669" },
} satisfies ErgChartConfig;

describe("ErgChartContainer", () => {
  it("exposes an accessible chart and shadcn color variables", () => {
    render(
      <ErgChartContainer aria-label="Xu hướng đào tạo" config={config}>
        <span>Dữ liệu biểu đồ</span>
      </ErgChartContainer>,
    );

    const chart = screen.getByRole("img", { name: "Xu hướng đào tạo" });
    expect(chart).toHaveStyle({ "--color-competency": "#2563EB" });
    expect(chart).toHaveStyle({ "--color-participation": "#059669" });
    expect(screen.getByText("Dữ liệu biểu đồ")).toBeInTheDocument();
  });
});
