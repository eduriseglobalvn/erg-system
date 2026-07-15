import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ErgPortalSidebar from "@/components/portal/ErgPortalSidebar";
import type { MenuGroup } from "@/components/portal/ErgPortalLayout";
import { ERG_ASSETS } from "@/config/seo";

const routeState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("@/routes/router-compat", () => ({
  useLocation: () => ({ pathname: routeState.pathname }),
}));

const menuGroups: MenuGroup[] = [{
  label: "Quản lý",
  items: [{
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
      portalInfo={{ name: "LCMS" }}
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

  it("switches to the compact presentation without waiting for a layout timer", () => {
    const view = renderSidebar();

    view.rerender(
      <ErgPortalSidebar
        collapsed
        menuGroups={menuGroups}
        onCollapsedChange={vi.fn()}
        onNavigate={vi.fn()}
        portalInfo={{ name: "LCMS" }}
      />,
    );

    expect(screen.getByRole("img", { name: "ERG" })).toHaveAttribute(
      "src",
      ERG_ASSETS.mobileLogo,
    );
  });
});
