import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { CampaignRecipient, CampaignResponse } from "../api/campaign-types";
import { CampaignDetailPage } from "./campaign-detail-page";

const api = vi.hoisted(() => ({
  campaign: undefined as CampaignResponse | undefined,
  failCampaign: false,
  pages: {} as Record<string, CampaignRecipient[][]>,
  recipientCalls: [] as Array<{ filter?: string; page?: number }>,
}));

vi.mock("../api/campaign-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/campaign-api")>()),
  fetchCampaign: async () => {
    if (api.failCampaign) throw new Error("boom");
    return api.campaign;
  },
  fetchCampaignRecipients: async (_id: string, input: { filter?: string; page?: number }) => {
    api.recipientCalls.push(input);
    const pages = api.pages[input.filter ?? "ALL"] ?? [[]];
    const page = input.page ?? 0;
    return { items: pages[page] ?? [], page, hasNext: page < pages.length - 1 };
  },
}));

const sent: CampaignResponse = {
  id: "c1",
  title: "Lịch nghỉ lễ 2/9",
  body: "Trường nghỉ từ 1/9.",
  status: "SENT",
  senderRole: "ADMIN",
  audience: { wholeTenant: true },
  requireReadAck: true,
  sentAt: new Date(2026, 8, 1, 7, 5).toISOString(),
  recipientCount: 200,
  viewedCount: 150,
  ackedCount: 120,
};

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  api.campaign = sent;
  api.failCampaign = false;
  api.recipientCalls = [];
  api.pages = {
    ALL: [
      [{ userId: "u1", displayName: "Nguyễn An", readAt: new Date(2026, 8, 1, 8, 0).toISOString(), ackedAt: new Date(2026, 8, 1, 8, 2).toISOString() }],
      [{ userId: "u2", displayName: "Trần Bình" }],
    ],
    UNACKED: [[{ userId: "u2", displayName: "Trần Bình" }]],
  };
});

test("sent campaign: heading, status, KPIs, recipients with read/ack times, load more", async () => {
  wrap(<CampaignDetailPage campaignId="c1" onBack={vi.fn()} onEdit={vi.fn()} />);

  expect(await screen.findByRole("heading", { level: 1, name: "Lịch nghỉ lễ 2/9" })).toBeInTheDocument();
  expect(screen.getByText("Đã gửi")).toBeInTheDocument();
  expect(screen.getByText(/Toàn hệ thống/)).toBeInTheDocument();
  expect(screen.getByText("75%")).toBeInTheDocument();
  expect(screen.getByText("Đã xác nhận")).toBeInTheDocument();
  expect(screen.getByText("60%")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sửa" })).toBeNull();

  const list = await screen.findByRole("list", { name: "Người nhận" });
  const first = within(list).getByText("Nguyễn An").closest("li") as HTMLElement;
  expect(first).toHaveTextContent("Đã xem 01/09/2026 08:00");
  expect(first).toHaveTextContent("Đã xác nhận 01/09/2026 08:02");

  fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }));
  expect(await within(list).findByText("Trần Bình")).toBeInTheDocument();
  expect(within(list).getByText("Nguyễn An")).toBeInTheDocument();
  expect(within(list).getByText("Trần Bình").closest("li")).toHaveTextContent("Chưa xem");
  expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull();
});

test("filter chips are toggle buttons and ask the server for that filter", async () => {
  wrap(<CampaignDetailPage campaignId="c1" onBack={vi.fn()} onEdit={vi.fn()} />);
  await screen.findByRole("list", { name: "Người nhận" });

  const all = screen.getByRole("button", { name: "Tất cả" });
  expect(all).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Chưa xác nhận" }));
  expect(screen.getByRole("button", { name: "Chưa xác nhận" })).toHaveAttribute("aria-pressed", "true");
  expect(all).toHaveAttribute("aria-pressed", "false");
  const list = await screen.findByRole("list", { name: "Người nhận" });
  expect(within(list).getByText("Trần Bình")).toBeInTheDocument();
  expect(within(list).queryByText("Nguyễn An")).toBeNull();
  expect(api.recipientCalls.at(-1)).toMatchObject({ filter: "UNACKED", page: 0 });
});

test("without read-ack there is no ack KPI and no Chưa xác nhận filter; no recipients shows 0%", async () => {
  api.campaign = { ...sent, requireReadAck: false, recipientCount: 0, viewedCount: 0, ackedCount: 0 };
  api.pages = { ALL: [[]] };
  wrap(<CampaignDetailPage campaignId="c1" onBack={vi.fn()} onEdit={vi.fn()} />);

  await screen.findByRole("heading", { level: 1 });
  expect(screen.getByText("0%")).toBeInTheDocument();
  expect(screen.queryByText("Đã xác nhận")).toBeNull();
  expect(screen.getByRole("button", { name: "Chưa xem" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Chưa xác nhận" })).toBeNull();
  expect(await screen.findByText("Không có người nhận nào.")).toBeInTheDocument();
});

test("a scheduled campaign shows when it goes out and the single Sửa action", async () => {
  const onEdit = vi.fn();
  api.campaign = { ...sent, status: "SCHEDULED", sentAt: undefined, scheduledAt: new Date(2026, 10, 10, 6, 30).toISOString() };
  wrap(<CampaignDetailPage campaignId="c1" onBack={vi.fn()} onEdit={onEdit} />);

  expect(await screen.findByText(/Hẹn gửi 10\/11\/2026 06:30/)).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Người nhận" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
  expect(onEdit).toHaveBeenCalledWith("c1");
  expect(api.recipientCalls).toHaveLength(0);
});

test("a failed load shows the error state with Thử lại", async () => {
  api.failCampaign = true;
  wrap(<CampaignDetailPage campaignId="c1" onBack={vi.fn()} onEdit={vi.fn()} />);
  expect(await screen.findByText("Không tải được thông báo")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
});
