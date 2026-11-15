import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assignments: vi.fn(), save: vi.fn(), schools: vi.fn(), templates: vi.fn() }));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-period-times-api", () => ({ loadSchoolPeriodAssignments: mocks.assignments, saveSchoolPeriodTimes: mocks.save }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-overview-api", () => ({ loadTeachingOverviewSchools: mocks.schools }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-schedule-api", () => ({ loadTeachingPeriodTemplates: mocks.templates }));
vi.mock("@/routes/route-feedback", () => ({ ContentPendingSkeleton: () => <div>loading</div> }));

import { SchoolPeriodsPage } from "./school-periods-page";

const slot = (periodNo: number, session: "MORNING" | "AFTERNOON", startTime: string | null, endTime: string | null) => ({ endTime, periodNo, session, startTime });
const TEMPLATE = { id: "tp1", name: "Mùa đông", periodsPerDay: 3, slots: [slot(1, "MORNING", "07:15", "08:00"), slot(2, "MORNING", "08:00", "08:45"), slot(3, "AFTERNOON", null, null)] };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><SchoolPeriodsPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.schools.mockResolvedValue({ items: [{ schoolId: "s1", schoolName: "THCS Trương Công Định" }, { schoolId: "s2", schoolName: "THCS Lê Lợi" }] });
  mocks.assignments.mockResolvedValue([{ current: true, effectiveFrom: "2026-11-01", schoolId: "s1", schoolName: "THCS Trương Công Định", templateId: "tp1", templateName: "Mùa đông" }]);
  mocks.templates.mockResolvedValue([TEMPLATE]);
  mocks.save.mockResolvedValue({});
});

it("lists real schools, marks the one without a table and shows the current table of the first school", async () => {
  renderPage();
  const nav = await screen.findByRole("navigation", { name: "Trường" });
  expect(within(nav).getByText("Chưa nhập giờ tiết")).toBeInTheDocument();
  expect(within(nav).getByText("Từ 01/11/2026")).toBeInTheDocument();
  expect(screen.getByText(/2 tiết đang dùng/)).toBeInTheDocument();
  expect(screen.getByLabelText("Tiết 1 bắt đầu")).toHaveValue("07:15");
  expect(screen.getByRole("switch", { name: "Tiết 3 đang dùng" })).not.toBeChecked();
});

it("saves the edited rows with the effective date through saveSchoolPeriodTimes", async () => {
  renderPage();
  fireEvent.change(await screen.findByLabelText("Tiết 2 kết thúc"), { target: { value: "08:50" } });
  fireEvent.click(screen.getByRole("switch", { name: "Tiết 3 đang dùng" }));
  fireEvent.change(screen.getByLabelText("Áp dụng từ"), { target: { value: "2026-12-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu giờ tiết" }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalled());
  expect(mocks.save.mock.calls[0][0]).toMatchObject({
    effectiveFrom: "2026-12-01", name: "THCS Trương Công Định · từ 01/12/2026", schoolId: "s1",
    slots: [slot(1, "MORNING", "07:15", "08:00"), slot(2, "MORNING", "08:00", "08:50"), slot(3, "AFTERNOON", "13:30", "14:15")],
  });
});

it("blocks saving with a Vietnamese message when times overlap", async () => {
  renderPage();
  fireEvent.change(await screen.findByLabelText("Tiết 2 bắt đầu"), { target: { value: "07:30" } });
  expect(screen.getByRole("alert")).toHaveTextContent("Tiết bắt đầu trước khi tiết trước kết thúc");
  expect(screen.getByRole("button", { name: "Lưu giờ tiết" })).toBeDisabled();
});

it("fills the form of a school without a table from a template and from another school", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: /THCS Lê Lợi/ }));
  expect(screen.queryByLabelText("Tiết 1 bắt đầu")).toBeNull();
  expect(screen.getByRole("button", { name: "Sao chép từ trường khác" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Sao chép từ trường khác" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "THCS Trương Công Định" }));
  expect(screen.getByLabelText("Tiết 1 bắt đầu")).toHaveValue("07:15");
  fireEvent.click(screen.getByRole("button", { name: "Tự điền theo mẫu…" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: /Mùa đông/ }));
  expect(screen.getByLabelText("Tiết 2 kết thúc")).toHaveValue("08:45");
});

it("caps the table at 10 timed periods", async () => {
  renderPage();
  const add = (await screen.findAllByRole("button", { name: "+ Thêm tiết" }))[0];
  for (let i = 0; i < 8; i += 1) fireEvent.click(add);
  fireEvent.click(screen.getByRole("switch", { name: "Tiết 11 đang dùng" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Tối đa 10 tiết");
});
