import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { useNewNotificationToast } from "./use-new-notification-toast";

const api = vi.hoisted(() => ({ feed: vi.fn(), info: vi.fn(), navigate: vi.fn() }));
vi.mock("sonner", () => ({ toast: { info: (...args: unknown[]) => api.info(...args) } }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => api.navigate }));
vi.mock("../api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/notification-api")>()),
  fetchNotificationFeed: (...args: unknown[]) => api.feed(...args),
}));

const client = new QueryClient();
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const render = (unread: number | undefined) =>
  renderHook(({ count }) => useNewNotificationToast("lcms", count), { wrapper, initialProps: { count: unread } });

beforeEach(() => {
  api.feed.mockReset().mockResolvedValue({ items: [{ id: "n9", title: "Họp hội đồng", bodyPreview: "15h thứ Sáu", description: "" }] });
  api.info.mockReset();
  document.documentElement.removeAttribute("data-erg-quiz-active");
});

test("a higher unread count while the app is open shows the newest message, keyed by its id", async () => {
  const { rerender } = render(2);
  rerender({ count: 3 });
  await waitFor(() => expect(api.info).toHaveBeenCalledTimes(1));
  expect(api.feed).toHaveBeenCalledWith(expect.objectContaining({ portal: "lcms", status: "unread", page: 0, size: 1 }));
  expect(api.info).toHaveBeenCalledWith("Họp hội đồng", expect.objectContaining({ id: "n9", description: "15h thứ Sáu" }));
  api.info.mock.calls[0][1].action.onClick();
  expect(api.navigate).toHaveBeenCalledWith({ href: "/notifications/n9" });
});

test("no card on first load, when the count drops, or during a quiz", async () => {
  const { rerender } = render(undefined);
  rerender({ count: 5 });
  rerender({ count: 4 });
  document.documentElement.setAttribute("data-erg-quiz-active", "");
  rerender({ count: 6 });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(api.feed).not.toHaveBeenCalled();
  expect(api.info).not.toHaveBeenCalled();
});
