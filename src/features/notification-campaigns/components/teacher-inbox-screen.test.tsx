import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { toPageResponse } from "@/features/notifications/api/notification-mappers";

import type { CampaignResponse } from "../api/campaign-types";
import { TeacherInboxScreen } from "./teacher-inbox-screen";

const nav = vi.hoisted(() => ({ navigate: vi.fn(), searchStr: "" }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => nav.navigate,
  useLocation: ({ select }: { select: (location: { searchStr: string }) => string }) => select({ searchStr: nav.searchStr }),
}));
const perms = vi.hoisted(() => ({ canSend: true }));
vi.mock("../model/can-send-campaigns", () => ({ canSendCampaigns: () => perms.canSend }));
vi.mock("@/features/notifications/api/notification-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/notifications/api/notification-api")>()),
  fetchNotificationFeed: async () => toPageResponse([], 0, 50, 0),
}));

const boxes = vi.hoisted(() => ({ calls: [] as Array<{ box: string; mine: boolean }>, items: {} as Record<string, CampaignResponse[]> }));
vi.mock("../api/campaign-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/campaign-api")>()),
  fetchCampaigns: async (input: { box: string; mine: boolean }) => {
    boxes.calls.push(input);
    const items = boxes.items[input.box] ?? [];
    return { items, page: 0, totalItems: items.length, hasNext: false };
  },
}));

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><TeacherInboxScreen /></QueryClientProvider>);
}

beforeEach(() => {
  nav.navigate.mockReset();
  nav.searchStr = "";
  perms.canSend = true;
  boxes.calls = [];
  boxes.items = {
    SENT: [
      { id: "c1", title: "Lịch kiểm tra", status: "SENT", recipientCount: 30, viewedCount: 10 },
      { id: "c2", title: "Gửi hỏng", status: "FAILED", recipientCount: 30 },
    ],
    SCHEDULED: [{ id: "s1", title: "Nhắc nộp bài", status: "SCHEDULED" }],
    DRAFT: [{ id: "d1", title: "Nháp", status: "DRAFT" }],
  };
});

test("without the send permission the page stays the plain inbox (fail closed)", async () => {
  perms.canSend = false;
  wrap();
  expect(await screen.findByRole("heading", { level: 1, name: "Hộp thư" })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: "Đã gửi" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Gửi lớp" })).toBeNull();
  expect(boxes.calls).toHaveLength(0);
});

test("senders get Hộp thư / Đã gửi / Lên lịch / Nháp with one Gửi lớp action", () => {
  wrap();
  expect(screen.getByRole("tablist", { name: "Hộp thư và thông báo của tôi" })).toBeInTheDocument();
  expect(within(screen.getByRole("tablist", { name: "Hộp thư và thông báo của tôi" })).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Hộp thư", "Đã gửi", "Lên lịch", "Nháp"]);
  // The inbox's own filters stay as they were.
  expect(within(screen.getByRole("tablist", { name: "Lọc thông báo" })).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Tất cả", "Trung tâm", "Hệ thống"]);
  fireEvent.click(screen.getByRole("button", { name: "Gửi lớp" }));
  expect(nav.navigate).toHaveBeenCalledWith({ href: "/teacher/notifications/compose" });
});

test("Đã gửi lists own campaigns; a row opens the teacher detail; a failed send shows Gửi lỗi", async () => {
  nav.searchStr = "?tab=SENT";
  wrap();
  const list = await screen.findByRole("list", { name: "Thông báo đã gửi" });
  expect(boxes.calls.at(-1)).toEqual(expect.objectContaining({ box: "SENT", mine: true }));
  expect(within(list).getByText("Gửi lỗi")).toBeInTheDocument();
  fireEvent.click(within(list).getByText("Lịch kiểm tra"));
  expect(nav.navigate).toHaveBeenLastCalledWith({ href: "/teacher/notifications/sent/c1" });
});

test("Lên lịch rows edit in compose and offer Hủy hẹn beside the row", async () => {
  nav.searchStr = "?tab=SCHEDULED";
  wrap();
  const list = await screen.findByRole("list", { name: "Thông báo đã hẹn giờ" });
  fireEvent.click(within(list).getByText("Nhắc nộp bài"));
  expect(nav.navigate).toHaveBeenLastCalledWith({ href: "/teacher/notifications/compose/s1" });
  fireEvent.click(within(list).getByRole("button", { name: "Hủy hẹn: Nhắc nộp bài" }));
  expect(screen.getByRole("dialog", { name: "Hủy hẹn gửi?" })).toBeInTheDocument();
  expect(nav.navigate).toHaveBeenCalledTimes(1);
});
