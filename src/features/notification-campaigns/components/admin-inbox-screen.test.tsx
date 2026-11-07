import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { ErgMuiProvider } from "@/themes/ErgMuiProvider";

import type { CampaignResponse } from "../api/campaign-types";
import { AdminInboxScreen } from "./admin-inbox-screen";

const nav = vi.hoisted(() => ({ navigate: vi.fn(), searchStr: "?tab=SENT" }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => nav.navigate,
  useLocation: ({ select }: { select: (location: { searchStr: string }) => string }) => select({ searchStr: nav.searchStr }),
}));
vi.mock("../model/can-send-campaigns", () => ({ canSendCampaigns: () => true }));

const boxes = vi.hoisted(() => ({ calls: [] as Array<{ box: string; mine: boolean }>, items: {} as Record<string, CampaignResponse[]> }));
vi.mock("../api/campaign-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/campaign-api")>()),
  fetchCampaigns: async (input: { box: string; mine: boolean }) => {
    boxes.calls.push(input);
    const items = boxes.items[input.box] ?? [];
    return { items, page: 0, totalItems: items.length, hasNext: false };
  },
  fetchCampaignSummary: async () => ({ sentThisMonth: 12, avgViewedRate: 0.78, unackedTotal: 214, unackedCampaigns: 2 }),
}));

function viewport(desktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: desktop && query.includes("min-width"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }),
  });
}

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<ErgMuiProvider><QueryClientProvider client={client}><AdminInboxScreen /></QueryClientProvider></ErgMuiProvider>);
}

beforeEach(() => {
  nav.navigate.mockReset();
  nav.searchStr = "?tab=SENT";
  boxes.calls = [];
  boxes.items = {
    SENT: [{ id: "c1", title: "Lịch nghỉ lễ", status: "SENT", recipientCount: 10, viewedCount: 5, pushEnabled: true }],
    DRAFT: [{ id: "d1", title: "Nháp họp", status: "DRAFT" }],
  };
});

test("md and up: four tabs, KPI row and the Đã gửi table; a row opens the campaign detail", async () => {
  viewport(true);
  wrap();

  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Nhận", "Đã gửi", "Lên lịch", "Nháp"]);
  expect(await screen.findByText("78%")).toBeInTheDocument();
  const table = await screen.findByRole("table", { name: "Thông báo đã gửi" });
  expect(boxes.calls.at(-1)).toMatchObject({ box: "SENT", mine: false });
  fireEvent.click(within(table).getByRole("button", { name: "Lịch nghỉ lễ" }));
  expect(nav.navigate).toHaveBeenCalledWith({ href: "/admin/notifications/sent/c1" });

  fireEvent.click(screen.getByRole("button", { name: "Chỉ của tôi" }));
  expect(screen.getByRole("button", { name: "Chỉ của tôi" })).toHaveAttribute("aria-pressed", "true");
  await screen.findByRole("table", { name: "Thông báo đã gửi" });
  expect(boxes.calls.at(-1)).toMatchObject({ box: "SENT", mine: true });
});

test("below md: the phone list stays; sent rows open the detail, drafts open compose", async () => {
  viewport(false);
  const { unmount } = wrap();

  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText("Đã gửi tháng này")).toBeNull();
  const list = await screen.findByRole("list", { name: "Thông báo đã gửi" });
  fireEvent.click(within(list).getByRole("button"));
  expect(nav.navigate).toHaveBeenLastCalledWith({ href: "/admin/notifications/sent/c1" });
  unmount();

  nav.searchStr = "?tab=DRAFT";
  wrap();
  fireEvent.click(within(await screen.findByRole("list", { name: "Bản nháp" })).getByRole("button"));
  expect(nav.navigate).toHaveBeenLastCalledWith({ href: "/admin/notifications/compose/d1" });
});

test("Lên lịch lists the scheduled box", async () => {
  viewport(true);
  nav.searchStr = "?tab=SCHEDULED";
  wrap();
  expect(await screen.findByText("Chưa hẹn giờ thông báo nào.")).toBeInTheDocument();
  expect(boxes.calls.at(-1)).toMatchObject({ box: "SCHEDULED", mine: true });
});
