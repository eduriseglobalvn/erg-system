import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionItem, RecentPunch } from "../api/timekeeping-types";
import { PunchReviewDialog } from "./punch-review-dialog";

const h = vi.hoisted(() => ({ api: { reviewPunch: vi.fn() }, success: vi.fn() }));
vi.mock("../api/timekeeping-admin-api", () => ({ timekeepingAdminApi: h.api }));
vi.mock("sonner", () => ({ toast: { success: h.success, error: vi.fn() } }));

const ITEM: ActionItem = { kind: "PUNCH_REVIEW", targetId: "p1", userId: "u1", userName: "Lê Thị B", label: "Chấm ngoài vùng 180 m" };
const PUNCH: RecentPunch = { id: "p1", userName: "Lê Thị B", siteName: "CS Cầu Giấy", time: "2026-11-06T00:12:00Z", direction: "IN", status: "FLAGGED", hasPhoto: false };

function renderDialog() {
  const onClose = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><PunchReviewDialog item={ITEM} onClose={onClose} punch={PUNCH} /></QueryClientProvider>);
  return { onClose };
}

afterEach(() => vi.clearAllMocks());

describe("PunchReviewDialog", () => {
  it("rejecting needs a reason and makes no API call without one", async () => {
    renderDialog();
    expect(screen.getByText("Chấm ngoài vùng 180 m")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Từ chối" }));
    expect(await screen.findByText("Nhập lý do từ chối")).toBeInTheDocument();
    expect(h.api.reviewPunch).not.toHaveBeenCalled();
  });

  it("accepts without a comment", async () => {
    h.api.reviewPunch.mockResolvedValue({});
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận" }));
    await waitFor(() => expect(h.api.reviewPunch).toHaveBeenCalledWith("p1", { decision: "ACCEPT", comment: "" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
