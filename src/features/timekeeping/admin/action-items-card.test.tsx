import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionItem } from "../api/timekeeping-types";
import { ActionItemsCard } from "./action-items-card";

const h = vi.hoisted(() => ({ api: { remind: vi.fn() }, toast: vi.fn() }));
vi.mock("../api/timekeeping-admin-api", () => ({ timekeepingAdminApi: h.api }));
vi.mock("sonner", () => ({ toast: { success: h.toast, error: vi.fn() } }));

const ITEMS: ActionItem[] = [
  { kind: "NOT_PUNCHED_PERIOD_SOON", targetId: "u1", userId: "u1", userName: "Lê Thị B", label: "Lê Thị B chưa chấm, có tiết lúc 07:45" },
  { kind: "REQUEST_OVERDUE", targetId: "r9", userId: "u2", userName: "Trần C", label: "Đơn của Trần C quá hạn" },
  { kind: "UNCOVERED_PERIODS", targetId: "p1", label: "2 tiết chưa có người dạy thay" },
];

function renderCard() {
  const handlers = { onOpen: vi.fn(), onView: vi.fn() };
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><ActionItemsCard items={ITEMS} {...handlers} /></QueryClientProvider>);
  return handlers;
}

afterEach(() => vi.clearAllMocks());

describe("ActionItemsCard", () => {
  it("reminds the item's user and toasts sent / skipped", async () => {
    h.api.remind.mockResolvedValue({ sent: 1, skipped: 0 });
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Nhắc Lê Thị B" }));
    await waitFor(() => expect(h.api.remind).toHaveBeenCalledWith(["u1"]));
    await waitFor(() => expect(h.toast).toHaveBeenCalledWith("Đã nhắc 1 người"));
  });

  it("opens an overdue request and hides items without a known kind (no substitute assignment, D15)", () => {
    const { onOpen } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Mở đơn của Trần C" }));
    expect(onOpen).toHaveBeenCalledWith(ITEMS[1]);
    expect(screen.queryByText(/người dạy thay/)).not.toBeInTheDocument();
    expect(screen.queryByText("Phân công")).not.toBeInTheDocument();
  });
});
