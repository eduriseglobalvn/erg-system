import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DayDetailView } from "../../api/timekeeping-types";
import { DayDetailPage } from "./day-detail-page";

const api = vi.hoisted(() => ({ month: vi.fn(), day: vi.fn(), myRequests: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

const DAY: DayDetailView = {
  date: "2026-10-14",
  explanationsRemaining: 2,
  in: { photoPurged: true, punch: { direction: "IN", distanceM: 38, method: "GPS_FACE", serverTime: "2026-10-14T07:24:00+07:00", siteName: "Cơ sở Cầu Giấy" } },
  lateMinutes: 0,
  missing: "OUT",
  missingReason: "Không có lượt chấm ra trong 11:30–12:30",
  periods: [{ className: "8A", end: "2026-10-14T11:15:00+07:00" }, { className: "7B", end: "2026-10-14T10:00:00+07:00" }],
  shift: { name: "Ca sáng", start: "07:30:00", end: "11:30:00", workUnits: 1 },
  status: "MISSING_PUNCH",
  units: 0.5,
};

function renderPage(day: DayDetailView = DAY, locked = false, pending: object[] = []) {
  api.day.mockResolvedValue(day);
  api.myRequests.mockResolvedValue({ items: pending });
  api.month.mockResolvedValue({ locked });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><DayDetailPage date="2026-10-14" /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("DayDetailPage (G05)", () => {
  it("shows purged photo text without an img, no Sổ đầu bài, one contained button", async () => {
    const { container } = renderPage();
    expect(await screen.findByText("Ảnh đã xoá theo hạn lưu")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText(/Sổ đầu bài/)).not.toBeInTheDocument();
    expect(screen.getByText("Không có lượt chấm ra trong 11:30–12:30")).toBeInTheDocument();
    expect(screen.getByText("2 tiết · tiết cuối 8A kết thúc 11:15")).toBeInTheDocument();
    expect(screen.getByText("Công tạm tính 0,5 / 1 công · đủ 1 khi giải trình được duyệt")).toBeInTheDocument();
    expect(screen.getByText("Lịch dạy ca sáng")).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Giải trình chấm công" })).toBeInTheDocument();
  });

  it("renders a lazy signed image when the photo exists", async () => {
    const withPhoto = { ...DAY, in: { ...DAY.in, photoPurged: false, photoUrl: "https://files.example/p.jpg?sig=1" } };
    const { container } = renderPage(withPhoto);
    await screen.findByText("Vào");
    expect(container.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("offers the pending explanation instead of a second one", async () => {
    renderPage(DAY, false, [{ id: "r7", type: "EXPLANATION", status: "PENDING", workDate: "2026-10-14" }]);
    expect(await screen.findByText("Đã gửi giải trình, chờ duyệt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem đơn" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Giải trình chấm công" })).not.toBeInTheDocument();
  });

  it("ignores pending explanations of other days", async () => {
    renderPage(DAY, false, [{ id: "r8", type: "EXPLANATION", status: "PENDING", workDate: "2026-10-13" }]);
    expect(await screen.findByRole("button", { name: "Giải trình chấm công" })).toBeInTheDocument();
  });

  it("replaces the button with the reason when the period is locked", async () => {
    renderPage(DAY, true);
    expect(await screen.findByText("Kỳ công đã chốt, không thể giải trình.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Giải trình chấm công" })).not.toBeInTheDocument();
  });
});
