import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErgPortalHeader from "@/components/portal/ErgPortalHeader";
import { PortalHeaderNotifications } from "@/components/portal/portal-header-notifications";
import {
  notificationPortalFromPath,
  PortalNotificationsSourceContext,
  type PortalNotification,
  type PortalNotificationsState,
} from "@/components/portal/use-portal-notifications";
import { ADMIN_NOTIFICATION_PORTAL, TEACHER_NOTIFICATION_PORTAL } from "@/platform/workspaces/workspace-notification-portal";
import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";

let pathname = "/admin/notifications";
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
  useNavigate: () => vi.fn(),
}));

const item = (n: number, patch: Partial<PortalNotification> = {}): PortalNotification => ({
  id: `n${n}`,
  title: `Tiêu đề ${n}`,
  preview: `Nội dung ${n}`,
  createdAt: "2026-11-05T08:30:00Z",
  unread: false,
  priority: null,
  needsAck: false,
  ...patch,
});

const state = (patch: Partial<PortalNotificationsState> = {}): PortalNotificationsState => ({
  unreadCount: 0,
  notifications: [],
  isPending: false,
  isError: false,
  refetch: vi.fn(),
  markRead: vi.fn().mockResolvedValue(undefined),
  ...patch,
});

const anchors: HTMLElement[] = [];
afterEach(() => {
  anchors.splice(0).forEach((anchor) => anchor.remove());
});

function renderPopover(patch: Partial<PortalNotificationsState> = {}, props: { pathname?: string; onNavigate?: (path: string) => void } = {}) {
  const anchor = document.createElement("button");
  document.body.appendChild(anchor);
  anchors.push(anchor);
  const onClose = vi.fn();
  const value = state(patch);
  render(<PortalHeaderNotifications anchorEl={anchor} onClose={onClose} pathname={props.pathname ?? "/admin/notifications"} state={value} onNavigate={props.onNavigate} />);
  return { anchor, onClose, state: value };
}

beforeEach(() => {
  pathname = "/admin/notifications";
});

describe("PortalHeaderNotifications popover", () => {
  it("is a labelled dialog listing the given messages with text cues for unread, urgent and ack", () => {
    renderPopover({
      notifications: [item(1, { unread: true, priority: "Khẩn", needsAck: true }), item(2)],
      unreadCount: 1,
    });
    const dialog = screen.getByRole("dialog", { name: "Thông báo" });
    const urgent = within(dialog).getByRole("link", { name: /Chưa đọc.*Khẩn.*Cần xác nhận.*Tiêu đề 1/ });
    expect(urgent).toHaveAttribute("href", `${adminPath("/notifications")}/n1`);
    expect(within(urgent).getByText("Khẩn")).toBeInTheDocument();
    expect(within(urgent).getByText("Cần xác nhận")).toBeInTheDocument();
    expect(within(dialog).getByText("Nội dung 2")).toBeInTheDocument();
    expect(within(dialog).getAllByText(/05\/11\/2026/, { selector: "span" })).toHaveLength(2);
  });

  it("is 380px wide and never wider than the viewport", () => {
    renderPopover({ notifications: [item(1)] });
    const paper = screen.getByRole("dialog").closest(".MuiPopover-paper") ?? screen.getByRole("dialog");
    expect(getComputedStyle(paper).width).toBe("380px");
    expect(getComputedStyle(paper).maxWidth).toBe("calc(100vw - 32px)");
  });

  it("marks the shown unread messages read from 'Đánh dấu đã đọc'", () => {
    const { state: s } = renderPopover({ notifications: [item(1, { unread: true }), item(2), item(3, { unread: true })], unreadCount: 9 });
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã đọc" }));
    expect(s.markRead).toHaveBeenCalledWith(["n1", "n3"]);
  });

  it("disables 'Đánh dấu đã đọc' when nothing shown is unread", () => {
    renderPopover({ notifications: [item(1)] });
    expect(screen.getByRole("button", { name: "Đánh dấu đã đọc" })).toBeDisabled();
  });

  it.each([
    ["/admin/notifications", adminPath("/notifications")],
    ["/teacher/home", teacherPath("/notifications")],
  ])("links 'Mở trang Thông báo' for %s", (path, href) => {
    renderPopover({ notifications: [item(1)] }, { pathname: path });
    expect(screen.getByRole("link", { name: "Mở trang Thông báo" })).toHaveAttribute("href", href);
  });

  it("opens a message's detail route for the workspace and closes", () => {
    const onNavigate = vi.fn();
    const { onClose } = renderPopover({ notifications: [item(1)] }, { pathname: "/teacher/home", onNavigate });
    fireEvent.click(screen.getByRole("link", { name: /Tiêu đề 1/ }));
    expect(onNavigate).toHaveBeenCalledWith(`${teacherPath("/notifications")}/n1`);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a skeleton while loading", () => {
    renderPopover({ isPending: true });
    expect(screen.getByRole("status", { name: "Đang tải thông báo" })).toBeInTheDocument();
  });

  it("keeps the last list on screen when a refresh fails, with an inline retry", () => {
    const { state: s } = renderPopover({ isError: true, notifications: [item(1)] });
    expect(screen.getByRole("link", { name: /Tiêu đề 1/ })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Không cập nhật được thông báo.");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(s.refetch).toHaveBeenCalled();
  });

  it("sends one set of requests on a double click and stays disabled until they finish", async () => {
    let finish!: () => void;
    const markRead = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderPopover({ notifications: [item(1, { unread: true })], markRead });
    const button = screen.getByRole("button", { name: "Đánh dấu đã đọc" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    finish();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("shows 'Chưa có thông báo' when empty", () => {
    renderPopover({});
    expect(screen.getByText("Chưa có thông báo")).toBeInTheDocument();
  });

  it("offers a retry when loading failed with nothing cached", () => {
    const { state: s } = renderPopover({ isError: true });
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(s.refetch).toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { onClose } = renderPopover({ notifications: [item(1)] });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("inbox pages and the bell share one portal per workspace", () => {
  it("pins the pages' portal constants to the bell's portal for the same route", () => {
    expect(ADMIN_NOTIFICATION_PORTAL).toBe(notificationPortalFromPath("/admin/notifications"));
    expect(TEACHER_NOTIFICATION_PORTAL).toBe(notificationPortalFromPath("/teacher/notifications"));
  });
});

describe("header bell", () => {
  function renderHeader(source: PortalNotificationsState, onPortal?: (portal: string) => void) {
    return render(
      <PortalNotificationsSourceContext.Provider
        value={(portal) => {
          onPortal?.(portal);
          return source;
        }}
      >
        <ErgPortalHeader portalName="ERG" />
      </PortalNotificationsSourceContext.Provider>,
    );
  }

  it("badge and label use the API unread count, not the list length", () => {
    renderHeader(state({ unreadCount: 7, notifications: [item(1, { unread: true })] }));
    const bell = screen.getByRole("button", { name: "Thông báo, 7 chưa đọc" });
    expect(bell).toHaveAttribute("aria-haspopup", "dialog");
    expect(within(bell).getByText("7")).toBeInTheDocument();
  });

  it("opens the popover and returns focus to the bell on Escape", async () => {
    renderHeader(state({ unreadCount: 1, notifications: [item(1, { unread: true })] }));
    const bell = screen.getByRole("button", { name: "Thông báo, 1 chưa đọc" });
    bell.focus();
    fireEvent.click(bell);
    const dialog = await screen.findByRole("dialog", { name: "Thông báo" });
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(bell).toHaveFocus();
  });

  it.each([
    ["/admin/notifications", "lcms"],
    ["/teacher/home", "lms"],
    ["/student", "elearning"],
    ["/crm/leads", "crm"],
    ["/calendar", "lms"],
  ])("reads the %s feed through portal %s, the same session the inbox page uses", (path, portal) => {
    pathname = path;
    const seen: string[] = [];
    renderHeader(state(), (p) => seen.push(p));
    expect(seen.every((p) => p === portal)).toBe(true);
    expect(notificationPortalFromPath(path)).toBe(portal);
  });
});
