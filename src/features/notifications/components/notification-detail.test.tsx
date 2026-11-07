import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { mapNotificationDetail } from "../api/notification-mappers";
import type { NotificationDetailResponse } from "../api/notification-types";
import { NotificationDetail } from "./notification-detail";

const state = vi.hoisted(() => ({ detail: {} as NotificationDetailResponse, error: null as unknown, read: vi.fn(), ack: vi.fn(), ackPortal: "" }));

vi.mock("../api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/notification-api")>()),
  fetchNotificationDetail: async (_id: string, portal: string) => {
    if (state.error) throw state.error;
    return mapNotificationDetail(state.detail, portal);
  },
  markNotificationRead: (...args: unknown[]) => state.read(...args),
}));
vi.mock("@/features/notification-campaigns/api/campaign-query", () => ({
  useAckNotification: (portal: string) => {
    state.ackPortal = portal;
    return { isPending: false, mutate: (id: string, options?: { onSuccess?: () => void }) => { state.ack(id); options?.onSuccess?.(); } };
  },
}));

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NotificationDetail portal="elearning" notificationId="n1" onBack={vi.fn()} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.error = null;
  state.read.mockReset().mockResolvedValue({ read: true, updated: 1 });
  state.ack.mockReset();
  state.detail = { id: "n1", title: "Họp phụ huynh", body: "Kính gửi quý phụ huynh.", createdAt: "2026-11-06T08:00:00+07:00", status: "unread", requireReadAck: true, priorityLevel: "IMPORTANT" };
});
afterEach(() => vi.useRealTimers());

test("needs ack: Đã nắm thông tin acks on the student's portal, then shows the ack time", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 9, 5));
  renderDetail();

  fireEvent.click(await screen.findByRole("button", { name: "Đã nắm thông tin" }));

  expect(state.ack).toHaveBeenCalledWith("n1");
  expect(state.ackPortal).toBe("elearning");
  expect(screen.getByText("Đã xác nhận lúc 09:05 07/11/2026")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Đã nắm thông tin" })).toBeNull();
});

test("already acked: shows the server ack time, no button", async () => {
  state.detail = { ...state.detail, ackedAt: new Date(2026, 10, 6, 14, 30).toISOString() };
  renderDetail();
  expect(await screen.findByText("Đã xác nhận lúc 14:30 06/11/2026")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Đã nắm thông tin" })).toBeNull();
});

test("no ack required: no button; an unread message is marked read once", async () => {
  state.detail = { ...state.detail, requireReadAck: false };
  renderDetail();
  expect(await screen.findByRole("heading", { name: "Họp phụ huynh" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Đã nắm thông tin" })).toBeNull();
  expect(state.read).toHaveBeenCalledTimes(1);
  expect(state.read).toHaveBeenCalledWith("n1", "elearning");
});

test("a 404 says the message is gone; another failure offers a retry", async () => {
  state.error = Object.assign(new Error("Not found"), { status: 404 });
  const first = renderDetail();
  expect(await screen.findByText("Không tìm thấy thông báo")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  first.unmount();

  state.error = Object.assign(new Error("Bad gateway"), { status: 502 });
  renderDetail();
  expect(await screen.findByText("Không tải được thông báo")).toBeInTheDocument();
  state.error = null;
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByRole("heading", { name: "Họp phụ huynh" })).toBeInTheDocument();
});

test("an unparsable ack time still reads as acknowledged", async () => {
  state.detail = { ...state.detail, ackedAt: "not-a-date" };
  renderDetail();
  expect(await screen.findByText("Đã xác nhận")).toBeInTheDocument();
});
