import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { notificationPortalFromPath } from "@/components/portal/use-portal-notifications";

import type { NotificationFeedItem } from "../api/notification-types";
import { usePortalNotifications } from "./use-portal-notifications";

const api = vi.hoisted(() => ({ feed: vi.fn(), unread: vi.fn(), read: vi.fn() }));
vi.mock("../api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/notification-api")>()),
  fetchNotificationFeed: (...args: unknown[]) => api.feed(...args),
  fetchUnreadNotificationCount: (...args: unknown[]) => api.unread(...args),
  markNotificationRead: (...args: unknown[]) => api.read(...args),
}));

const feedItem = (id: string, patch: Partial<NotificationFeedItem> = {}) =>
  ({ id, title: `T${id}`, bodyPreview: `P${id}`, description: "", createdAt: "2026-11-05T08:00:00Z", unread: true, priorityLevel: "URGENT", requireReadAck: true, ackedAt: null, ...patch }) as NotificationFeedItem;

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api.feed.mockReset().mockResolvedValue({ items: [feedItem("1"), feedItem("2", { unread: false, priorityLevel: undefined, requireReadAck: false })] });
  api.unread.mockReset().mockResolvedValue({ unread: 42 });
  api.read.mockReset().mockResolvedValue({ read: true, updated: 1 });
});

test("asks for the newest six only when the popover is open; the count is the API's", async () => {
  const { result, rerender } = renderHook(({ open }) => usePortalNotifications("lcms", open), { wrapper, initialProps: { open: false } });
  await waitFor(() => expect(result.current.unreadCount).toBe(42));
  expect(api.feed).not.toHaveBeenCalled();
  expect(result.current.isPending).toBe(false);

  rerender({ open: true });
  await waitFor(() => expect(result.current.notifications).toHaveLength(2));
  expect(api.feed).toHaveBeenCalledWith(expect.objectContaining({ portal: "lcms", status: "all", page: 0, size: 6 }), expect.anything());
  expect(result.current.notifications[0]).toMatchObject({ id: "1", title: "T1", preview: "P1", unread: true, priority: "Khẩn", needsAck: true });
  expect(result.current.notifications[1]).toMatchObject({ priority: null, needsAck: false });
});

test("markRead marks only the given messages, then refreshes the badge", async () => {
  const { result } = renderHook(() => usePortalNotifications("lcms", false), { wrapper });
  await waitFor(() => expect(result.current.unreadCount).toBe(42));
  api.unread.mockResolvedValue({ unread: 40 });

  await act(() => result.current.markRead(["1", "3"]));

  expect(api.read.mock.calls).toEqual([["1", "lcms"], ["3", "lcms"]]);
  await waitFor(() => expect(result.current.unreadCount).toBe(40));
});

test("the admin bell shares the inbox's query root, so a read in the inbox refreshes the badge", async () => {
  const portal = notificationPortalFromPath("/admin/notifications");
  expect(portal).toBe("lcms");
  const { result } = renderHook(() => usePortalNotifications(portal, false), { wrapper });
  await waitFor(() => expect(result.current.unreadCount).toBe(42));
  api.unread.mockResolvedValue({ unread: 41 });

  // what NotificationDetail does after marking a message read on the admin inbox page
  const { notificationQueryKeys } = await import("../api/notification-api");
  await act(() => client.invalidateQueries({ queryKey: notificationQueryKeys.root("lcms") }));

  await waitFor(() => expect(result.current.unreadCount).toBe(41));
});
