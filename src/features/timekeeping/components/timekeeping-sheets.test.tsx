import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DayDetailView } from "../api/timekeeping-types";
import { RequestsScreen } from "./requests/requests-screen";
import { TeacherTimekeepingTimesheetRoute } from "./timekeeping-route-pages";

const h = vi.hoisted(() => ({
  api: { day: vi.fn(), explanationContext: vi.fn(), month: vi.fn(), myRequests: vi.fn() },
  mobile: true,
  navigate: vi.fn(),
  search: {} as Record<string, unknown>,
}));
vi.mock("../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("@mui/material/useMediaQuery", () => ({ default: () => h.mobile }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => h.navigate, useSearch: () => h.search }));

const DAY: DayDetailView = {
  date: "2026-10-14",
  explanationsRemaining: 2,
  in: { photoPurged: true, punch: { direction: "IN", method: "GPS_FACE", serverTime: "2026-10-14T07:24:00+07:00" } },
  missing: "OUT",
  missingReason: "Không có lượt chấm ra trong 11:30–12:30",
  shift: { name: "Ca sáng", start: "07:30:00", end: "11:30:00", workUnits: 1 },
  status: "MISSING_PUNCH",
  units: 0.5,
};

function renderWith(ui: ReactNode, search: Record<string, unknown>, mobile = true) {
  h.search = search;
  h.mobile = mobile;
  h.api.day.mockResolvedValue(DAY);
  h.api.month.mockResolvedValue({ days: [], locked: false });
  h.api.myRequests.mockResolvedValue({ items: [], total: 0 });
  h.api.explanationContext.mockResolvedValue({ remaining: 2 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const lastHref = () => h.navigate.mock.calls.at(-1)?.[0] as { href: string; replace?: boolean };

afterEach(() => vi.clearAllMocks());

describe("G05 day detail on phones", () => {
  it("opens as a dialog over the timesheet, with an outlined explain action", async () => {
    renderWith(<TeacherTimekeepingTimesheetRoute />, { date: "2026-10-14" });
    const dialog = await screen.findByRole("dialog", { name: "Thứ Tư, 14/10/2026" });
    expect(await within(dialog).findByText("Không có lượt chấm ra trong 11:30–12:30")).toBeInTheDocument();
    const explain = await within(dialog).findByRole("button", { name: "Giải trình chấm công" });
    expect(explain).toHaveClass("MuiButton-outlined");
    expect(screen.getByRole("heading", { hidden: true, name: "Bảng công của tôi" })).toBeInTheDocument();

    fireEvent.click(explain);
    expect(lastHref().href).toContain("/timekeeping/requests?new=explanation&date=2026-10-14");
  });

  it("closing clears the date and keeps the month", async () => {
    renderWith(<TeacherTimekeepingTimesheetRoute />, { date: "2026-10-14" });
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng" }));
    expect(lastHref()).toMatchObject({ replace: true });
    expect(lastHref().href).toMatch(/\/timekeeping\/timesheet\?period=2026-10$/);
  });

  it("stays a page on wide screens", async () => {
    renderWith(<TeacherTimekeepingTimesheetRoute />, { date: "2026-10-14" }, false);
    expect(await screen.findByRole("heading", { level: 1, name: "Thứ Tư, 14/10/2026" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Bảng công của tôi")).not.toBeInTheDocument();
  });
});

describe("G07 request type picker on phones", () => {
  it("opens as a dialog over the list; choosing a type opens its form", async () => {
    renderWith(<RequestsScreen />, { new: "" });
    const dialog = await screen.findByRole("dialog", { name: "Tạo đơn mới" });
    expect(screen.getByRole("heading", { hidden: true, name: "Đơn từ" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /Nghỉ phép/ }));
    expect(lastHref().href).toMatch(/\/timekeeping\/requests\?new=leave$/);
  });

  it("closing clears ?new=", async () => {
    renderWith(<RequestsScreen />, { new: "" });
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Đóng" }));
    expect(lastHref()).toMatchObject({ replace: true });
    expect(lastHref().href).toMatch(/\/timekeeping\/requests$/);
  });

  it("stays a page on wide screens", () => {
    renderWith(<RequestsScreen />, { new: "" }, false);
    expect(screen.getByRole("heading", { level: 1, name: "Tạo đơn mới" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Đơn từ")).not.toBeInTheDocument();
  });
});
