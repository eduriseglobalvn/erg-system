import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarBottom } from "@/components/portal/portal-sidebar-bottom";
import { PortalNotificationsSourceContext, type PortalNotificationsState } from "@/components/portal/use-portal-notifications";

vi.mock("@tanstack/react-router", () => ({ useLocation: () => ({ pathname: "/teacher/home" }) }));

const source: PortalNotificationsState = {
  unreadCount: 2,
  notifications: [{ id: "n1", title: "Họp phụ huynh", preview: "", createdAt: "2026-11-05T08:30:00Z", unread: true, priority: null, needsAck: false }],
  isPending: false,
  isError: false,
  refetch: vi.fn(),
  markRead: vi.fn().mockResolvedValue(undefined),
};

describe("sidebar 'Thông báo' item", () => {
  it.each([[false, "Tùy chọn tài khoản"], [true, "Tài khoản: Cô Lan"]])("opens the popover and gives focus back to the account control after Esc (collapsed=%s)", async (collapsed, controlName) => {
    render(
      <PortalNotificationsSourceContext.Provider value={() => source}>
        <SidebarBottom collapsed={collapsed} portalInfo={{ name: "Giáo viên", userName: "Cô Lan" }} />
      </PortalNotificationsSourceContext.Provider>,
    );
    const control = screen.getByRole("button", { name: controlName });
    fireEvent.click(control);
    const item = await screen.findByRole("menuitem", { name: /^Thông báo/ });
    expect(item).toHaveAttribute("aria-haspopup", "dialog");

    fireEvent.click(item);
    const dialog = await screen.findByRole("dialog", { name: "Thông báo" });
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(control).toHaveFocus());
  });
});
