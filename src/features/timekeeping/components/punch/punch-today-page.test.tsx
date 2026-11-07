import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NEARBY_FIX, TODAY } from "@/test/fixtures/timekeeping-punch-fixtures";
import { PunchTodayPage } from "./punch-today-page";

const api = vi.hoisted(() => ({ today: vi.fn(), month: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../hooks/use-server-clock", () => ({ useServerClock: () => ({ now: () => new Date(2026, 10, 6, 7, 30, 0), offsetMs: 0, ready: true }) }));
vi.mock("../../hooks/use-geolocation", () => ({ useGeolocation: () => ({ reading: NEARBY_FIX, error: null, request: vi.fn() }) }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><PunchTodayPage /></QueryClientProvider>);
}

afterEach(() => vi.restoreAllMocks());

describe("PunchTodayPage (G01)", () => {
  it("shows Chấm vào inside the zone and it is the only contained button", async () => {
    api.today.mockResolvedValue(TODAY);
    api.month.mockResolvedValue({ actualUnits: 4, standardUnits: 22, lateCount: 1, lateMinutes: 7, annualLeaveRemaining: 11, pendingRequests: 2 });
    const { container } = renderPage();
    const button = await screen.findByRole("button", { name: "Chấm vào" });
    await waitFor(() => expect(button).toBeEnabled());
    expect(await screen.findByText("Trong vùng Cơ sở Cầu Giấy · cách 38 m")).toBeInTheDocument();
    expect(screen.getByText("Thứ Sáu, 06/11/2026")).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("disables the button and says why when offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    api.today.mockResolvedValue(TODAY);
    api.month.mockResolvedValue({});
    renderPage();
    expect(await screen.findByText("Cần có mạng để chấm công")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chấm vào" })).toBeDisabled();
  });

  it("offers Chấm ra once there is a check-in", async () => {
    api.today.mockResolvedValue({ ...TODAY, in: { code: "CC-0001", serverTime: "2026-11-06T07:24:00+07:00" } });
    api.month.mockResolvedValue({});
    renderPage();
    expect(await screen.findByRole("button", { name: "Chấm ra" })).toBeInTheDocument();
  });
});
