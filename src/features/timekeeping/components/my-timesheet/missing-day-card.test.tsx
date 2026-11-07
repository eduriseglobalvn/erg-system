import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissingDayCard } from "./missing-day-card";

const api = vi.hoisted(() => ({ day: vi.fn(), myRequests: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: api }));

function renderCard(pending: object[]) {
  api.day.mockResolvedValue({ date: "2026-10-14", missing: "OUT", explanationsRemaining: 2 });
  api.myRequests.mockResolvedValue({ items: pending });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenRequest = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <MissingDayCard issue={{ date: "2026-10-14", status: "MISSING_PUNCH", units: 0.5 }} locked={false} onExplain={vi.fn()} onOpenRequest={onOpenRequest} />
    </QueryClientProvider>,
  );
  return onOpenRequest;
}

afterEach(() => vi.clearAllMocks());

describe("MissingDayCard (G04)", () => {
  it("offers Giải trình when nothing is pending for the day", async () => {
    renderCard([]);
    expect(await screen.findByRole("button", { name: "Giải trình" })).toBeInTheDocument();
  });

  it("shows the waiting explanation with a link to it instead of the button", async () => {
    const open = renderCard([{ id: "r7", type: "EXPLANATION", status: "PENDING", workDate: "2026-10-14" }]);
    expect(await screen.findByText("Đã gửi giải trình, chờ duyệt")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Giải trình" })).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Xem đơn" }).click();
    expect(open).toHaveBeenCalledWith("r7");
  });
});
