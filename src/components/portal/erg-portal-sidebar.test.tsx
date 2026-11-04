import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/portal/use-portal-notifications", () => ({ notificationPortalFromPath: () => "lms", usePortalNotifications: () => ({ notifications: [], unreadCount: undefined }) }));
import ErgPortalSidebar from "@/components/portal/ErgPortalSidebar";
import type { MenuGroup } from "@/components/portal/ErgPortalLayout";

const routeState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: routeState.pathname }),
}));

const menuGroups: MenuGroup[] = [{
  label: "Quản lý",
  items: [{ label: "Lịch toàn trung tâm", path: "/calendar" }, {
    id: "settings-group",
    label: "Thiết lập",
    children: [{ label: "Phân quyền", path: "/setting/roles" }],
  }],
}];

function renderSidebar(collapsed = false) {
  return render(
    <ErgPortalSidebar
      collapsed={collapsed}
      menuGroups={menuGroups}
      onCollapsedChange={vi.fn()}
      onNavigate={vi.fn()}
      portalInfo={{ name: "Admin", workspaceCapabilities: ["ADMIN", "TEACHER"] }}
    />,
  );
}

describe("ErgPortalSidebar submenu disclosure", () => {
  beforeEach(() => {
    routeState.pathname = "/";
  });

  it("opens and closes a submenu with an explicit accessible state", () => {
    renderSidebar();
    const trigger = screen.getByRole("button", { name: "Thiết lập" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("starts an active child branch open but still allows manual collapse", () => {
    routeState.pathname = "/setting/roles";
    renderSidebar();
    const trigger = screen.getByRole("button", { name: "Thiết lập" });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("collapsed mode shows icon buttons with accessible names and no truncated label text", () => {
    renderSidebar(true);

    expect(screen.getByRole("button", { name: "Lịch toàn trung tâm" })).toBeInTheDocument();
    expect(screen.queryByText("Lịch toàn trung tâm")).not.toBeInTheDocument();
    expect(screen.queryAllByText(/.../)).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Mở rộng menu" })).toBeInTheDocument();
  });

  it("opens the portal switcher from the header in both modes and lists the accessible portals", () => {
    const view = renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /Không gian làm việc/ }));
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Admin LMS");
    expect(items[1]).toHaveTextContent("Giáo viên");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    view.unmount();

    renderSidebar(true);
    fireEvent.click(screen.getByRole("button", { name: /Không gian làm việc/ }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });
});
