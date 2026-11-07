import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { notificationQueryKeys } from "../api/notification-api";
import { useUnreadNotificationCount } from "./use-unread-notification-count";

const api = vi.hoisted(() => ({ unread: vi.fn() }));
vi.mock("../api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/notification-api")>()),
  fetchUnreadNotificationCount: (...args: unknown[]) => api.unread(...args),
}));

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api.unread.mockReset().mockResolvedValue({ unread: 3 });
});

test("student dock badge: the elearning inbox's server count, refreshed when the inbox reads a message", async () => {
  const { result } = renderHook(() => useUnreadNotificationCount("elearning"), { wrapper });
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBe(3));
  expect(api.unread).toHaveBeenCalledWith("elearning", expect.anything());

  api.unread.mockResolvedValue({ unread: 2 });
  await act(() => client.invalidateQueries({ queryKey: notificationQueryKeys.root("elearning") }));
  await waitFor(() => expect(result.current).toBe(2));
});

test("does not fetch while disabled (signed-out viewer)", () => {
  renderHook(() => useUnreadNotificationCount("elearning", false), { wrapper });
  expect(api.unread).not.toHaveBeenCalled();
});
