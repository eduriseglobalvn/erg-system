import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardSidebar } from "./dashboard-sidebar";
import type { DashboardGroup, DashboardLeaf } from "../types/dashboard-types";

vi.mock("./dashboard-account-card", () => ({
  DashboardAccountCard: () => <div>Tài khoản giáo viên</div>,
}));

const activeLeaf: DashboardLeaf = {
  breadcrumb: ["ERG", "Lớp học", "Tổng quan"],
  description: "Tổng quan lớp học",
  id: "overview",
  title: "Tổng quan",
  variant: "overview",
};

const groups: DashboardGroup[] = [
  {
    title: "Lớp học",
    items: [
      activeLeaf,
      { ...activeLeaf, id: "class-reports", title: "Báo cáo", variant: "class-reports" },
    ],
  },
];

describe("DashboardSidebar", () => {
  it("renders a stable accessible MUI navigation and selects leaves", () => {
    const onSelect = vi.fn();
    render(<DashboardSidebar activeLeaf={activeLeaf} groups={groups} onSelect={onSelect} />);

    const navigation = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(navigation).toHaveAttribute("data-sidebar-width", "280");
    expect(screen.getByRole("button", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(screen.getByRole("button", { name: "Báo cáo" }));
    expect(onSelect).toHaveBeenCalledWith("class-reports");
  });
});
