import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DaysOffPage } from "./days-off-page";
import type { DaysOffState } from "./use-days-off";

const h = vi.hoisted(() => ({ state: {} as DaysOffState }));
vi.mock("./use-days-off", () => ({ useDaysOff: () => h.state }));
vi.mock("@/lib/graphql-client", () => ({ getDefaultTenantId: () => "t1" }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../api/timekeeping-config-query", () => ({
  useSaturdayModes: () => ({ data: [], isError: false }),
  useSetSaturdayMode: () => ({ mutate: vi.fn(), isPending: false }),
}));

const base = {
  month: "2026-12", today: "2026-11-15", adding: null, importing: false, selected: "", selectedHoliday: undefined, importYear: 2027, editing: false,
  holidays: new Map(), monthHolidays: [], modes: new Map(), periods: new Map(), loading: false, failed: false,
  retry: vi.fn(), prev: vi.fn(), next: vi.fn(), select: vi.fn(), openAdd: vi.fn(), closeAdd: vi.fn(), openImport: vi.fn(), closeImport: vi.fn(), closeEdit: vi.fn(),
} as unknown as DaysOffState;

const renderPage = (state: Partial<DaysOffState>) => {
  h.state = { ...base, ...state };
  render(<QueryClientProvider client={new QueryClient()}><DaysOffPage /></QueryClientProvider>);
};

describe("DaysOffPage", () => {
  it("shows the empty month panel without the legend", () => {
    renderPage({});
    expect(screen.getByRole("heading", { name: "Ngày nghỉ & thứ 7" })).toBeInTheDocument();
    expect(screen.getByText("Tháng 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("Tháng này chưa có ngày nghỉ")).toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nhập lịch nghỉ lễ năm 2027" })).toBeEnabled();
  });

  it("shows the load error with a retry and disables the two header actions", () => {
    renderPage({ failed: true });
    expect(screen.getByText("Không tải được lịch.")).toBeInTheDocument();
    expect(screen.getByText("Kiểm tra kết nối rồi thử lại.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Nhập lịch nghỉ lễ năm 2027" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thêm ngày nghỉ" })).toBeDisabled();
  });
});
