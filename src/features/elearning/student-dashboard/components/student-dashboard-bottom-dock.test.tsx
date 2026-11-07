import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { StudentDashboardBottomDock } from "@/features/elearning/student-dashboard/components/student-dashboard-bottom-dock";
import { viCopy } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace.copy";

const items = [...viCopy.navItems, { key: "account" as const, label: "Hồ sơ", icon: null }];

it("renders the shared dock: Hộp thư replaces Thông báo, unread badge, tabs switch by page key", () => {
  const onPageChange = vi.fn();
  render(<StudentDashboardBottomDock activePage="overview" announcementUnreadCount={3} items={items} onPageChange={onPageChange} />);

  expect(screen.queryByRole("button", { name: /^Thông báo/ })).toBeNull();
  expect(screen.getByRole("button", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
  fireEvent.click(screen.getByRole("button", { name: "Hộp thư, 3 chưa đọc" }));
  expect(onPageChange).toHaveBeenCalledWith("announcements");
  fireEvent.click(screen.getByRole("button", { name: "Hồ sơ" }));
  expect(onPageChange).toHaveBeenLastCalledWith("account");
});
