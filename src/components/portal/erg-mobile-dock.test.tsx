import HomeIcon from "@mui/icons-material/Home";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErgMobileDock, formatDockBadge, type ErgMobileDockItem } from "./erg-mobile-dock";

type Id = "home" | "inbox" | "a" | "b" | "c" | "more";

const items: Array<ErgMobileDockItem<Id>> = [
  { id: "home", label: "Trang chủ", icon: HomeIcon, path: "/home" },
  { id: "inbox", label: "Hộp thư", icon: HomeIcon, path: "/inbox", badgeCount: 120 },
  { id: "a", label: "Mục A", icon: HomeIcon, path: "/a" },
  { id: "b", label: "Mục B", icon: HomeIcon, path: "/b" },
  { id: "c", label: "Mục C", icon: HomeIcon, path: "/c" },
  { id: "more", label: "Thêm", icon: HomeIcon, path: "", opensSheet: true, avatarInitials: "LT" },
];

function setup() {
  const onNavigate = vi.fn();
  const onOpenSheet = vi.fn();
  render(
    <ErgMobileDock
      activeId="inbox"
      ariaLabel="Điều hướng test"
      hideAt="xl"
      items={items}
      onNavigate={onNavigate}
      onOpenSheet={onOpenSheet}
    />,
  );
  return { onNavigate, onOpenSheet };
}

describe("formatDockBadge", () => {
  it("formats counts", () => {
    expect(formatDockBadge(undefined)).toBeNull();
    expect(formatDockBadge(0)).toBeNull();
    expect(formatDockBadge(7)).toBe("7");
    expect(formatDockBadge(99)).toBe("99");
    expect(formatDockBadge(100)).toBe("99+");
  });
});

describe("ErgMobileDock", () => {
  it("renders one button per item and marks only the active one", () => {
    setup();
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(screen.getByRole("button", { name: /Hộp thư/ })).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
    screen.getAllByRole("button").filter((b) => !b.getAttribute("aria-label")?.startsWith("Hộp thư")).forEach((b) => expect(b).not.toHaveAttribute("aria-current"));
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Điều hướng test");
  });

  it("shows the label text only on the active item; the others are named by aria-label", () => {
    setup();
    const nav = screen.getByRole("navigation");
    expect(nav.textContent).toContain("Hộp thư");
    for (const label of ["Trang chủ", "Mục A", "Mục B", "Mục C"]) {
      expect(nav.textContent).not.toContain(label);
      expect(screen.getByRole("button", { name: label })).toBeVisible();
    }
  });

  it("marks unread items with a dot and keeps the count in the aria-label", () => {
    setup();
    expect(screen.getByRole("button", { name: "Hộp thư, 99+ chưa đọc" })).toBeVisible();
    expect(screen.getAllByTestId("erg-mobile-dock-dot")).toHaveLength(1);
    expect(screen.queryByText("99+")).toBeNull();
  });

  it("renders the account item as an initials avatar", () => {
    setup();
    expect(screen.getByRole("button", { name: "Thêm" }).textContent).toBe("LT");
  });

  it("navigates on a normal item", () => {
    const { onNavigate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trang chủ" }));
    expect(onNavigate).toHaveBeenCalledWith("/home");
  });

  it("opens the sheet instead of navigating", () => {
    const { onNavigate, onOpenSheet } = setup();
    const more = screen.getByRole("button", { name: "Thêm" });
    expect(more).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(more);
    expect(onOpenSheet).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe("dock auto-hide", () => {
  function scrollTo(scroller: HTMLElement, top: number) {
    Object.defineProperty(scroller, "scrollTop", { configurable: true, value: top });
    fireEvent.scroll(scroller);
  }
  const dockVisibility = () => getComputedStyle(document.querySelector("nav[aria-label=\"Điều hướng test\"]")!).visibility;

  it("hides on scroll down, returns on scroll up and near the top", () => {
    const scroller = document.body.appendChild(document.createElement("main"));
    setup();
    scrollTo(scroller, 100);
    scrollTo(scroller, 160);
    expect(dockVisibility()).toBe("hidden");
    expect(document.documentElement.style.getPropertyValue("--erg-dock-lift")).not.toBe("");
    scrollTo(scroller, 130);
    scrollTo(scroller, 100);
    expect(dockVisibility()).toBe("visible");
    expect(document.documentElement.style.getPropertyValue("--erg-dock-lift")).toBe("");
    scrollTo(scroller, 300);
    scrollTo(scroller, 400);
    scrollTo(scroller, 10);
    expect(dockVisibility()).toBe("visible");
    scroller.remove();
  });

  it("hides while a text field is focused (on-screen keyboard)", () => {
    setup();
    const field = document.body.appendChild(document.createElement("textarea"));
    act(() => field.focus());
    expect(dockVisibility()).toBe("hidden");
    act(() => field.blur());
    expect(dockVisibility()).toBe("visible");
    field.remove();
  });
});
