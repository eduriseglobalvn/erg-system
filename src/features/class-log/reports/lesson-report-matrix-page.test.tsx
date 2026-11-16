import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LessonReportMatrixPage } from "./lesson-report-matrix-page";

const api = vi.hoisted(() => ({ loadLessonReportMatrix: vi.fn(), remindLessonReport: vi.fn() }));
vi.mock("./lesson-report-api", () => api);
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/features/timekeeping/api/timekeeping-admin-query", () => ({ useTimekeepingSchools: () => ({ data: [{ id: "s1", name: "THCS A" }] }) }));

const days = ["2026-11-09", "2026-11-10"];
const matrix = {
  weekStart: "2026-11-09", days, stats: { periods: 4, teachers: 2, schools: 1, onTime: 2, late: 0, missing: 2 },
  rows: [
    { teacherId: "t1", teacherName: "Thắm", schoolName: "THCS A", cells: [{ date: days[0], state: "ON_TIME", periods: 2 }, { date: days[1], state: "MISSING", periods: 2 }] },
    { teacherId: "t2", teacherName: "Khoa", schoolName: "THCS A", cells: [{ date: days[0], state: "NONE", periods: 0 }, { date: days[1], state: "NONE", periods: 0 }] },
  ],
};

beforeEach(() => { vi.clearAllMocks(); api.loadLessonReportMatrix.mockResolvedValue(matrix); api.remindLessonReport.mockResolvedValue(1); });

function renderPage() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><LessonReportMatrixPage /></QueryClientProvider>);
}

describe("lesson report matrix page", () => {
  it("shows the kpis and one «Nhắc N giáo viên» for the teachers with a missing day", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: "Nhắc 1 giáo viên" })).toBeEnabled();
    expect(screen.getByText("2 giáo viên · 1 trường")).toBeInTheDocument();
    expect(screen.getByText("2 / 4 buổi")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nhắc 1 giáo viên" }));
    await waitFor(() => expect(api.remindLessonReport).toHaveBeenCalledWith(["t1"]));
  });

  it("opens the cell panel with the overdue note and a personal reminder", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Thắm · Thứ 3 10\/11 · Chưa báo/ }));
    expect(screen.getByText(/2 tiết chưa xác nhận · Quá hạn/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nhắc riêng" }));
    await waitFor(() => expect(api.remindLessonReport).toHaveBeenCalledWith(["t1"]));
  });
});
