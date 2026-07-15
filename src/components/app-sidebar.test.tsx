import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./app-sidebar";
import type { DashboardGroup } from "@/layouts/dashboard/types/dashboard-types";

vi.mock("@/platform/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => ({
      "sidebar.collapseMenu": "Thu gọn menu",
      "sidebar.expandMenu": "Mở rộng menu",
    })[key] ?? key,
  }),
}));

const sections: DashboardGroup[] = [
  {
    iconKey: "classroom",
    title: "Lớp học",
    items: [
      {
        breadcrumb: ["ERG", "Lớp học", "Tổng quan"],
        description: "Tổng quan",
        id: "overview",
        title: "Tổng quan",
        variant: "overview",
      },
      {
        breadcrumb: ["ERG", "Lớp học", "Báo cáo"],
        description: "Báo cáo",
        id: "class-reports",
        title: "Báo cáo",
        variant: "class-reports",
      },
    ],
  },
];

describe("AppSidebar", () => {
  it("collapses smoothly and preserves leaf selection", () => {
    const onSelectLeaf = vi.fn();
    render(
      <AppSidebar
        activeLeafId="overview"
        dashboardSections={sections}
        onSelectLeaf={onSelectLeaf}
      />,
    );

    const navigation = screen.getByRole("navigation", { name: "Điều hướng LMS" });
    expect(navigation).toHaveAttribute("data-sidebar-width", "280");
    expect(screen.getByRole("button", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(screen.getByRole("button", { name: "Báo cáo" }));
    expect(onSelectLeaf).toHaveBeenCalledWith("class-reports");

    fireEvent.click(screen.getByRole("button", { name: "Thu gọn menu" }));
    expect(navigation).toHaveAttribute("data-sidebar-width", "76");
    expect(screen.getByRole("button", { name: "Mở rộng menu" })).toBeVisible();
  });
});
