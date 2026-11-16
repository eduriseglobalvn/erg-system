import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  load: vi.fn(), remove: vi.fn(), saveLoad: vi.fn(), schools: vi.fn(), travel: vi.fn(), upsert: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-travel-api", () => ({
  deleteSchoolTravelTime: mocks.remove, loadSchoolTravelTimes: mocks.travel, upsertSchoolTravelTime: mocks.upsert,
}));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-overview-api", () => ({
  loadTeachingOverviewSchools: mocks.schools,
  loadTeachingScheduleLoadSettings: mocks.load,
  updateTeachingScheduleLoadSettings: mocks.saveLoad,
}));

import { TravelTimesPage } from "./travel-times-page";
import { validateLoad } from "./use-travel-settings";

const school = (schoolId: string, schoolName: string) => ({ conflictCount: 0, hasDraft: false, periodCount: 0, schoolId, schoolName, schoolShortName: schoolName });
const ROW = { minutes: 60, schoolA: school("s1", "THCS Trương Công Định"), schoolB: school("s2", "THCS Lê Quý Đôn"), updatedAt: null };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><TravelTimesPage /></QueryClientProvider>);
}

beforeEach(() => {
  mocks.travel.mockReset().mockResolvedValue([ROW]);
  mocks.schools.mockReset().mockResolvedValue({ items: [ROW.schoolA, ROW.schoolB].map((s) => ({ ...s })) });
  mocks.load.mockReset().mockResolvedValue({ loadMax: 24, loadWarn: 18 });
  mocks.upsert.mockReset().mockResolvedValue(ROW);
  mocks.remove.mockReset().mockResolvedValue(true);
  mocks.saveLoad.mockReset().mockResolvedValue({ loadMax: 24, loadWarn: 20 });
});

it("lists pairs with minutes and shows the board header", async () => {
  renderPage();
  expect(await screen.findByText("60′")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Di chuyển giữa trường" })).toBeInTheDocument();
  expect(screen.getByText("Mặc định 50′.", { exact: false })).toBeInTheDocument();
  expect(screen.getByText("Ngưỡng tải tuần")).toBeInTheDocument();
});

it("deletes a pair after confirming", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Xoá" }));
  fireEvent.click(await screen.findByRole("button", { name: "Xoá" }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalled());
  expect(mocks.remove.mock.calls[0][0]).toEqual({ schoolAId: "s1", schoolBId: "s2" });
});

it("edits a pair with minutes outside 0-240 blocked", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Sửa" }));
  const input = await screen.findByLabelText("Thời gian tối thiểu (phút)");
  fireEvent.change(input, { target: { value: "300" } });
  expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "75" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
  await waitFor(() => expect(mocks.upsert).toHaveBeenCalled());
  expect(mocks.upsert.mock.calls[0][0]).toEqual({ minutes: 75, schoolAId: "s1", schoolBId: "s2" });
});

it("blocks a warn threshold above max and saves a valid one", async () => {
  renderPage();
  const warn = await screen.findByLabelText("Cảnh báo khi quá");
  fireEvent.change(warn, { target: { value: "30" } });
  expect(screen.getByRole("alert")).toHaveTextContent("Ngưỡng cảnh báo phải nhỏ hơn hoặc bằng mức tối đa.");
  fireEvent.change(warn, { target: { value: "20" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
  await waitFor(() => expect(mocks.saveLoad).toHaveBeenCalled());
  expect(mocks.saveLoad.mock.calls[0][0]).toEqual({ loadMax: 24, loadWarn: 20 });
});

it("validateLoad rejects warn > max and negatives", () => {
  expect(validateLoad(18, 24)).toBeNull();
  expect(validateLoad(25, 24)).not.toBeNull();
  expect(validateLoad(-1, 24)).not.toBeNull();
});
