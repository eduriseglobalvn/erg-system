import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MonthView } from "../../api/timekeeping-types";
import { MonthCalendarGrid } from "./month-calendar-grid";
import { MyTimesheetPage } from "./my-timesheet-page";

const api = vi.hoisted(() => ({ month: vi.fn(), day: vi.fn() }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

const MONTH: MonthView = {
  actualUnits: 12.5,
  annualLeaveRemaining: 11,
  days: [
    { date: "2026-10-12", status: "FULL", units: 1 },
    { date: "2026-10-13", status: "LEAVE", leaveKind: "UNPAID", units: 0 },
    { date: "2026-10-14", status: "MISSING_PUNCH", units: 0.5 },
  ],
  lateCount: 1,
  lateMinutes: 7,
  locked: false,
  period: "2026-10",
  periods: 30,
  reviewUntil: "2026-11-08",
  standardUnits: 22,
};

function renderPage(month: MonthView = MONTH) {
  api.month.mockResolvedValue(month);
  api.day.mockResolvedValue({ date: "2026-10-14", missing: "OUT", explanationsRemaining: 2, status: "MISSING_PUNCH", units: 0.5 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MyTimesheetPage currentPeriod="2026-11" period="2026-10" /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("MonthCalendarGrid", () => {
  it("exposes each day as a named button and reports the clicked date", async () => {
    const onSelect = vi.fn();
    render(<MonthCalendarGrid days={MONTH.days ?? []} onSelect={onSelect} period="2026-10" />);
    fireEvent.click(screen.getByRole("button", { name: "14/10, Thiếu chấm" }));
    expect(onSelect).toHaveBeenCalledWith("2026-10-14");
    expect(screen.getByRole("button", { name: "13/10, Nghỉ không lương" })).toBeInTheDocument();
  });
});

describe("MyTimesheetPage (G04)", () => {
  it("shows stats, the review line and the missing-day card with an explanation button", async () => {
    renderPage();
    expect(await screen.findByText("Rà soát đến 08/11, sau đó chốt")).toBeInTheDocument();
    expect(screen.getByText("Tháng 10/2026")).toBeInTheDocument();
    expect(screen.getByText("12,5 / 22")).toBeInTheDocument();
    expect(await screen.findByText("14/10 · Thiếu giờ ra")).toBeInTheDocument();
    expect(await screen.findByText("Đang tính 0,5 công · còn 2 lượt giải trình")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Giải trình" }));
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ href: "/teacher/timekeeping/requests?new=explanation&date=2026-10-14" }));
  });

  it("hides Giải trình when the month is locked", async () => {
    renderPage({ ...MONTH, locked: true });
    expect(await screen.findByText("Đã chốt")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/^14\/10 · /)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Giải trình" })).not.toBeInTheDocument();
  });
});
