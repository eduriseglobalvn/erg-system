import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  grid: vi.fn(), navigate: vi.fn(), schools: vi.fn(), search: { value: "" }, settings: vi.fn(), teachers: vi.fn(), workspace: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useLocation: () => ({ searchStr: mocks.search.value }), useNavigate: () => mocks.navigate }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-overview-api", () => ({
  loadTeachingOverviewGrid: mocks.grid,
  loadTeachingOverviewSchools: mocks.schools,
  loadTeachingOverviewTeachers: mocks.teachers,
  loadTeachingScheduleLoadSettings: mocks.settings,
}));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-workspace-query-api", () => ({ loadLcmsTeachingCalendarWorkspace: mocks.workspace }));

import { OverviewPage } from "./overview-page";

const school = (id: string, name: string, patch: object = {}) => ({ conflictCount: 0, hasDraft: false, periodCount: 16, schoolId: id, schoolName: name, schoolShortName: name, ...patch });
const SCHOOLS = { items: [school("s1", "THCS Trương Công Định", { conflictCount: 1 }), school("s2", "THCS Nguyễn Du"), school("s3", "THCS Văn Lang"), school("s4", "THCS Minh Đức")], quickCounts: { conflicts: 3, drafts: 7, empty: 12, travel: 1 }, total: 4 };
const day = (weekday: number) => ({ multiSchoolSameSession: false, onLeave: false, schoolShortNames: ["TCĐ"], travel: null, weekday });
const teacher = (patch: object) => ({
  conflictCount: 0, days: [1, 2, 3, 4, 5, 6].map(day), initials: "NV", leave: null, maxPeriods: 24, revokeNotice: null, schoolCount: 1, slots: [],
  teacherId: "t1", teacherName: "Q.Vương", weeklyPeriods: 7, ...patch,
});
const slot = (patch: object) => ({ classNames: ["9A4"], conflict: false, eventIds: [], onLeave: false, periodNo: 1, roles: ["MAIN"], schoolShortNames: ["TCĐ"], status: "PUBLISHED", travel: false, weekday: 1, ...patch });

function renderPage(search: string) {
  mocks.search.value = search;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><OverviewPage /></QueryClientProvider>);
}

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.schools.mockReset().mockResolvedValue(SCHOOLS);
  mocks.grid.mockReset().mockResolvedValue({ cells: [], conflicts: [], holidays: [], schools: SCHOOLS.items.slice(0, 2), template: { id: "t", name: "THCS", periodsPerDay: 10, slots: [] }, weekStart: "2026-11-09" });
  mocks.settings.mockReset().mockResolvedValue({ loadMax: 24, loadWarn: 18 });
  mocks.workspace.mockReset().mockResolvedValue({ catalog: undefined, events: [], permissions: {} });
  mocks.teachers.mockReset().mockResolvedValue({
    items: [
      teacher({ slots: [slot({ classNames: ["9A3"], periodNo: 4, roles: ["ASSISTANT"] }), slot({ classNames: ["9A1"], periodNo: 5, weekday: 2 })], weeklyPeriods: 7 }),
      teacher({ initials: "BN", slots: [slot({ classNames: ["9A3"], roles: ["ASSISTANT"] })], teacherId: "t2", teacherName: "Bảo Ngọc", weeklyPeriods: 2 }),
    ],
    quickCounts: { conflicts: 1, empty: 6, multiSchool: 4, overload: 1, travel: 1 },
    total: 2,
  });
});

const SLOTS = [[1, "MORNING", "07:15", "08:00"], [2, "MORNING", "08:00", "08:45"], [6, "AFTERNOON", "13:30", "14:15"]].map(([periodNo, session, startTime, endTime]) => ({ endTime, periodNo, session, startTime }));
const lesson = (patch: object) => ({ assistantName: null, batchLabel: "Đợt HK1·2", className: "9A4", conflictKinds: [], eventId: null, note: null, roomName: "PM 03", schoolId: "s1", status: "PUBLISHED", teacherName: "T.Tuấn", weekday: 1, ...patch });

it("draws schools as rows and Thứ 2…Thứ 7 as columns with merged time ranges and teacher names", async () => {
  mocks.grid.mockResolvedValue({ cells: [lesson({ periodNo: 1 }), lesson({ periodNo: 2 }), lesson({ conflictKinds: ["TEACHER_TIME"], periodNo: 6, teacherName: "Q.Vương", weekday: 3 })], conflicts: [], holidays: [], schools: SCHOOLS.items.slice(0, 2), template: { id: "t", name: "THCS", periodsPerDay: 10, slots: SLOTS }, weekStart: "2026-11-09" });
  renderPage("?week=2026-11-09&schools=s1,s2");
  expect(await screen.findByRole("button", { name: "Trường: 2 / 4 ▾" })).toBeInTheDocument();
  expect(await screen.findByText("07:15–08:45")).toBeInTheDocument();
  expect(screen.getByText("13:30–14:15")).toBeInTheDocument();
  expect(screen.getByText("Thứ 7")).toBeInTheDocument();
  expect(screen.getByText("Bấm vào khung giờ để xem chi tiết")).toBeInTheDocument();
  fireEvent.click(screen.getByText("T.Tuấn"));
  const dialog = await screen.findByRole("dialog", { name: "Chi tiết khung giờ" });
  expect(within(dialog).getByText("Không có")).toBeInTheDocument();
  expect(within(dialog).getByText("Đã xuất bản · Đợt HK1·2")).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Đổi giáo viên" })).toBeInTheDocument();
});

it("caps side-by-side schools at four", async () => {
  mocks.schools.mockResolvedValue({ ...SCHOOLS, items: [...SCHOOLS.items, school("s5", "THCS Bạch Đằng")], total: 5 });
  renderPage("?week=2026-11-09&schools=s1,s2,s3,s4");
  fireEvent.click(await screen.findByRole("button", { name: "Trường: 4 / 5 ▾" }));
  fireEvent.click(await screen.findByRole("checkbox", { name: "THCS Bạch Đằng" }));
  expect(mocks.navigate).not.toHaveBeenCalled();
});

it("filters the teacher tab with quick chips through the URL", async () => {
  renderPage("?tab=teachers&week=2026-11-09");
  fireEvent.click(await screen.findByRole("button", { name: "Có xung đột · 1" }));
  expect(mocks.navigate.mock.calls[0][0].href).toContain("quick=CONFLICT");
});

it("shows assistant slots, the folded tiet 5 mark and the extended load cell on the teacher tab", async () => {
  renderPage("?tab=teachers&week=2026-11-09");
  const row = (await screen.findByText("Q.Vương")).closest("[role=row]") as HTMLElement;
  expect(within(row).getByText("TG 9A3")).toBeInTheDocument();
  expect(within(row).getByText("9A1 +1")).toBeInTheDocument();
  expect(within(row).getByText(/^\s*\/ 24 tiết/)).toHaveTextContent("7 / 24 tiết gồm 1 trợ giảng");
  const only = screen.getByText("Bảo Ngọc").closest("[role=row]") as HTMLElement;
  expect(within(only).getByText("Chỉ trợ giảng · 1 tiết")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Quá 18 tiết · 1" })).toBeInTheDocument();
});

it("toggles the load sort in the URL", async () => {
  renderPage("?tab=teachers&week=2026-11-09");
  fireEvent.click(await screen.findByRole("button", { name: /Tải tuần/ }));
  expect(mocks.navigate.mock.calls[0][0].href).toContain("sort=LOAD_ASC");
});
