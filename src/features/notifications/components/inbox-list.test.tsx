import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { mapNotificationItem, toPageResponse } from "../api/notification-mappers";
import type { NotificationFeedItem } from "../api/notification-types";
import { InboxList } from "./inbox-list";

const feed = vi.hoisted(() => ({ items: [] as NotificationFeedItem[], unread: [] as NotificationFeedItem[], unreadCount: 0, calls: [] as Array<{ status?: string; size?: number }> }));

vi.mock("../api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/notification-api")>()),
  fetchNotificationFeed: async (input: { status?: string; size?: number }) => {
    feed.calls.push(input);
    const items = input.status === "unread" ? feed.unread : feed.items;
    return toPageResponse(items, 0, input.size ?? 50, items.length);
  },
  fetchUnreadNotificationCount: async () => ({ unread: feed.unreadCount }),
  markAllNotificationsRead: async () => {
    feed.unreadCount = 0;
    return { read: true, updated: 1 };
  },
}));

const item = (id: string, extra: Partial<NotificationFeedItem> = {}) => ({ ...mapNotificationItem({ id, title: `Tin ${id}` }), ...extra });

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  feed.unreadCount = 0;
  feed.calls = [];
  feed.unread = [];
  feed.items = [
    item("a", { type: "system", unread: false, status: "read" }),
    item("b", { campaignId: "c1", priorityLevel: "URGENT", requireReadAck: true }),
    item("c", { type: "company" }),
  ];
});

test("teacher inbox: role tabs, Gửi lớp action, urgent first with a text badge", async () => {
  const onCompose = vi.fn();
  wrap(<InboxList portal="lms" workspace="TEACHER" title="Hộp thư" onCompose={onCompose} onOpen={vi.fn()} />);

  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Tất cả", "Trung tâm", "Hệ thống"]);
  const list = await screen.findByRole("list", { name: "Danh sách thông báo" });
  const rows = within(list).getAllByRole("button");
  expect(rows[0]).toHaveAccessibleName(/Chưa đọc.*Khẩn.*Cần xác nhận.*Tin b/);
  expect(within(rows[0]).getByText("Khẩn")).toBeInTheDocument();
  expect(rows[1]).not.toHaveAccessibleName(/Chưa đọc/);
  expect(feed.calls[0]).toMatchObject({ portal: "lms", status: "all" });

  fireEvent.click(screen.getByRole("button", { name: "Gửi lớp" }));
  expect(onCompose).toHaveBeenCalledOnce();
});

test("filter tabs narrow the list; opening an item passes it up", async () => {
  const onOpen = vi.fn();
  wrap(<InboxList portal="lms" workspace="TEACHER" onOpen={onOpen} />);
  await screen.findByRole("list", { name: "Danh sách thông báo" });

  fireEvent.click(screen.getByRole("tab", { name: "Hệ thống" }));
  const rows = within(screen.getByRole("list", { name: "Danh sách thông báo" })).getAllByRole("button");
  expect(rows).toHaveLength(1);
  fireEvent.click(rows[0]);
  expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
});

test("Chưa đọc asks the server (status=unread) and shows what it returns", async () => {
  feed.items = [item("a", { unread: false, status: "read" })];
  // Older than the first page of "all": only the server knows it is unread.
  feed.unread = [item("old")];
  wrap(<InboxList portal="elearning" workspace="STUDENT" onOpen={vi.fn()} />);
  await screen.findByRole("list", { name: "Danh sách thông báo" });
  expect(screen.queryByRole("button", { name: "Gửi lớp" })).toBeNull();

  fireEvent.click(screen.getByRole("tab", { name: "Chưa đọc" }));
  expect(await screen.findByRole("button", { name: /Tin old/ })).toBeInTheDocument();
  expect(feed.calls.at(-1)).toMatchObject({ portal: "elearning", status: "unread" });
});

test("empty unread inbox says so", async () => {
  wrap(<InboxList portal="elearning" workspace="STUDENT" onOpen={vi.fn()} />);
  await screen.findByRole("list", { name: "Danh sách thông báo" });
  fireEvent.click(screen.getByRole("tab", { name: "Chưa đọc" }));
  expect(await screen.findByText("Không còn thông báo chưa đọc.")).toBeInTheDocument();
});

test("admin received tab uses Tất cả / Cần xử lý / Từ trường / Hệ thống", async () => {
  wrap(<InboxList portal="lcms" workspace="ADMIN" onOpen={vi.fn()} />);
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Tất cả", "Cần xử lý", "Từ trường", "Hệ thống"]);
  await screen.findByRole("list", { name: "Danh sách thông báo" });
  fireEvent.click(screen.getByRole("tab", { name: "Cần xử lý" }));
  expect(within(await screen.findByRole("list", { name: "Danh sách thông báo" })).getAllByRole("button")).toHaveLength(1);
  expect(feed.calls.at(-1)).toMatchObject({ status: "all", size: 100 });
});

test("Cần xử lý with nothing to ack is honest about scanning recent messages only", async () => {
  feed.items = [item("a")];
  wrap(<InboxList portal="lcms" workspace="ADMIN" onOpen={vi.fn()} />);
  await screen.findByRole("list", { name: "Danh sách thông báo" });
  fireEvent.click(screen.getByRole("tab", { name: "Cần xử lý" }));
  expect(await screen.findByText("Không có thông báo cần xử lý trong các tin gần đây.")).toBeInTheDocument();
});

test("titled inbox: unread count on Tất cả and a mark-all-read action that clears it", async () => {
  feed.unreadCount = 2;
  wrap(<InboxList portal="elearning" workspace="STUDENT" title="Hộp thư" onOpen={vi.fn()} />);
  expect(await screen.findByRole("tab", { name: "Tất cả 2" })).toBeInTheDocument();
  const markAll = screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" });
  await vi.waitFor(() => expect(markAll).toBeEnabled());
  fireEvent.click(markAll);
  await vi.waitFor(() => expect(markAll).toBeDisabled());
  expect(screen.getByRole("tab", { name: "Tất cả" })).toBeInTheDocument();
});
