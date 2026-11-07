import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { mapNotificationItem, toPageResponse } from "../api/notification-mappers";
import type { NotificationFeedItem } from "../api/notification-types";
import { InboxList } from "./inbox-list";

const feed = vi.hoisted(() => ({ items: [] as NotificationFeedItem[], calls: [] as unknown[] }));

vi.mock("../api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/notification-api")>()),
  fetchNotificationFeed: async (input: unknown) => {
    feed.calls.push(input);
    return toPageResponse(feed.items, 0, 50, feed.items.length);
  },
}));

const item = (id: string, extra: Partial<NotificationFeedItem> = {}) => ({ ...mapNotificationItem({ id, title: `Tin ${id}` }), ...extra });

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  feed.calls = [];
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

test("no Gửi lớp button without a compose handler; empty filter shows an empty state", async () => {
  feed.items = [item("a", { unread: false, status: "read" })];
  wrap(<InboxList portal="elearning" workspace="STUDENT" onOpen={vi.fn()} />);
  await screen.findByRole("list", { name: "Danh sách thông báo" });
  expect(screen.queryByRole("button", { name: "Gửi lớp" })).toBeNull();

  fireEvent.click(screen.getByRole("tab", { name: "Chưa đọc" }));
  expect(screen.getByText("Không còn thông báo chưa đọc.")).toBeInTheDocument();
});

test("admin received tab uses Tất cả / Cần xử lý / Từ trường / Hệ thống", async () => {
  wrap(<InboxList portal="lcms" workspace="ADMIN" onOpen={vi.fn()} />);
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Tất cả", "Cần xử lý", "Từ trường", "Hệ thống"]);
  await screen.findByRole("list", { name: "Danh sách thông báo" });
  fireEvent.click(screen.getByRole("tab", { name: "Cần xử lý" }));
  expect(within(screen.getByRole("list", { name: "Danh sách thông báo" })).getAllByRole("button")).toHaveLength(1);
});
