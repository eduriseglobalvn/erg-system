import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assignments: vi.fn(), edit: vi.fn(), options: vi.fn(), remove: vi.fn(), swap: vi.fn(), templates: vi.fn(), workspace: vi.fn() }));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-slot-change-api", () => ({ editTeachingScheduleSlot: mocks.edit, swapTeachingScheduleTeacher: mocks.swap }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-slot-options-api", () => ({ loadTeachingSlotOptions: mocks.options }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-period-times-api", () => ({ loadSchoolPeriodAssignments: mocks.assignments }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-schedule-api", () => ({ loadTeachingPeriodTemplates: mocks.templates }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-workspace-query-api", () => ({ loadLcmsTeachingCalendarWorkspace: mocks.workspace }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-command-api", () => ({ deleteTeachingScheduleEvent: mocks.remove }));

import { ApiClientError } from "@/lib/api-client/errors";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { SlotEditDialog } from "./slot-edit-dialog";
import { TeacherSwapDialog } from "./teacher-swap-dialog";

const EVENT = {
  assistantName: null, batchId: "b1", className: "9A4", classId: "c1", date: "2026-11-11", endTime: "14:15", id: "e1", periodStart: 6, roomId: "r1", roomName: "PM 03",
  schoolId: "s1", schoolName: "THCS Trương Công Định", startTime: "13:30", status: "PUBLISHED", subjectId: "sub1", subjectName: "IC3",
  teachers: [{ displayName: "Q.Vương", role: "MAIN", userId: "t1" }],
} as unknown as TeachingCalendarEvent;

const result = (extra: object = {}) => ({ affectedCount: 1, applied: false, blocking: false, conflicts: [], events: [], ...extra });
const teacher = (teacherId: string, teacherName: string, extra: object = {}) => ({ classAccess: "EXISTING", initials: teacherName.slice(0, 2), state: "FREE", taughtHereLastWeek: false, teacherId, teacherName, weeklyPeriods: 7, ...extra });

function renderUi(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assignments.mockResolvedValue([{ current: true, effectiveFrom: null, schoolId: "s1", schoolName: "A", templateId: "tp1", templateName: "T" }]);
  mocks.templates.mockResolvedValue([{ id: "tp1", name: "T", periodsPerDay: 7, slots: [
    { endTime: "14:15", periodNo: 6, session: "AFTERNOON", startTime: "13:30" }, { endTime: "15:00", periodNo: 7, session: "AFTERNOON", startTime: "14:15" }, { endTime: null, periodNo: 8, session: "AFTERNOON", startTime: null },
  ] }]);
  mocks.options.mockResolvedValue({ classes: [], grade: null, rooms: [{ roomId: "r1", roomName: "PM 03", state: "FREE" }, { roomId: "r2", roomName: "PM 04", state: "BUSY" }], schoolName: "A", teachers: [teacher("t1", "Q.Vương"), teacher("t2", "T.Tuấn"), teacher("t3", "Lan Anh", { state: "BUSY" })] });
  mocks.workspace.mockResolvedValue({ catalog: { subjects: [{ id: "sub1", label: "IC3" }] } });
});

it("edit dialog previews with dryRun after a period change and saves with the same patch", async () => {
  mocks.edit.mockResolvedValue(result());
  const onClose = vi.fn();
  renderUi(<SlotEditDialog canDelete event={EVENT} onClose={onClose} />);
  expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
  fireEvent.mouseDown(await screen.findByRole("combobox", { name: /Tiết/ }));
  fireEvent.click(await screen.findByRole("option", { name: /Tiết 7/ }));
  await waitFor(() => expect(mocks.edit).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, eventId: "e1", periodNo: 7, scope: { dates: undefined, kind: "THIS_ONLY" } }), expect.anything()));
  expect(await screen.findByText(/1 tiết sẽ đổi/)).toBeInTheDocument();
  const save = screen.getByRole("button", { name: "Lưu thay đổi" });
  await waitFor(() => expect(save).toBeEnabled());
  fireEvent.click(save);
  await waitFor(() => expect(mocks.edit.mock.calls.some(([input]) => input.dryRun === false && input.periodNo === 7)).toBe(true));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

it("edit dialog blocks saving when the dry run reports ERROR conflicts and shows them", async () => {
  mocks.edit.mockResolvedValue(result({ affectedCount: 6, blocking: true, conflicts: [{ id: "c", kind: "ROOM_TIME", message: "PM 03 đã có lớp khác", severity: "ERROR", weekday: 3, periodNo: 7, firstDate: "2026-11-11", affectedWeeks: 1, totalWeeks: 6, mine: {}, other: null }] }));
  renderUi(<SlotEditDialog canDelete={false} event={EVENT} onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole("radio", { name: /Từ 11\/11 đến hết đợt/ }));
  fireEvent.mouseDown(await screen.findByRole("combobox", { name: /Tiết/ }));
  fireEvent.click(await screen.findByRole("option", { name: /Tiết 7/ }));
  expect(await screen.findByText(/6 tiết sẽ đổi, nhưng còn xung đột/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Xoá tiết" })).toBeNull();
});

it("edit dialog shows the Vietnamese message of a backend error code and offers delete", async () => {
  mocks.edit.mockImplementation((input: { dryRun: boolean }) => (input.dryRun ? Promise.resolve(result()) : Promise.reject(new ApiClientError("x", "GRAPHQL_ERROR", 409, [{ extensions: { code: "STALE_VERSION" } }]))));
  mocks.remove.mockResolvedValue({ deleted: true });
  renderUi(<SlotEditDialog canDelete event={EVENT} onClose={vi.fn()} />);
  fireEvent.mouseDown(await screen.findByRole("combobox", { name: /Tiết/ }));
  fireEvent.click(await screen.findByRole("option", { name: /Tiết 7/ }));
  const save = screen.getByRole("button", { name: "Lưu thay đổi" });
  await waitFor(() => expect(save).toBeEnabled());
  fireEvent.click(save);
  expect(await screen.findByRole("alert")).toHaveTextContent("người khác");
  fireEvent.click(screen.getByRole("button", { name: "Xoá tiết" }));
  fireEvent.click(await screen.findByRole("button", { name: "Xoá" }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith({ eventId: "e1", tenantId: expect.any(String) }, "lcms"));
});

it("swap dialog lists candidates without the current teacher and sends scope, reason and teacher", async () => {
  mocks.swap.mockResolvedValue(result({ affectedCount: 6 }));
  renderUi(<TeacherSwapDialog event={EVENT} onClose={vi.fn()} />);
  const swap = screen.getByRole("button", { name: "Đổi giáo viên" });
  expect(swap).toBeDisabled();
  const list = await screen.findByRole("listbox", { name: "Giáo viên" });
  expect(within(list).queryByText("Q.Vương")).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: /Từ 11\/11 đến hết đợt/ }));
  fireEvent.click(screen.getByRole("button", { name: "Giáo viên nghỉ" }));
  fireEvent.click(within(list).getByRole("option", { name: /T\.Tuấn/ }));
  await waitFor(() => expect(mocks.swap).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, eventId: "e1", newTeacherId: "t2", reason: "TEACHER_ON_LEAVE", scope: { dates: undefined, kind: "FROM_DATE_TO_END" } }), expect.anything()));
  expect(screen.queryByRole("listbox", { name: "Giáo viên" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Chọn giáo viên khác" }));
  expect(await screen.findByRole("listbox", { name: "Giáo viên" })).toBeInTheDocument();
  expect(await screen.findByText(/6 tiết sẽ đổi/)).toBeInTheDocument();
  expect(screen.getByText(/Sau khi đổi/)).toBeInTheDocument();
  await waitFor(() => expect(swap).toBeEnabled());
  fireEvent.click(swap);
  await waitFor(() => expect(mocks.swap.mock.calls.some(([input]) => input.dryRun === false && input.newTeacherId === "t2")).toBe(true));
});

it("swap dialog needs at least one date for «Chọn ngày…»", async () => {
  mocks.swap.mockResolvedValue(result());
  renderUi(<TeacherSwapDialog event={EVENT} onClose={vi.fn()} />);
  const list = await screen.findByRole("listbox", { name: "Giáo viên" });
  fireEvent.click(within(list).getByRole("option", { name: /T\.Tuấn/ }));
  await waitFor(() => expect(mocks.swap).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("radio", { name: "Chọn ngày…" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Đổi giáo viên" })).toBeDisabled());
  fireEvent.change(screen.getByLabelText("Ngày áp dụng"), { target: { value: "2026-11-18" } });
  fireEvent.click(screen.getByRole("button", { name: "Thêm ngày" }));
  await waitFor(() => expect(mocks.swap).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, scope: { dates: ["2026-11-18"], kind: "SELECTED_DATES" } }), expect.anything()));
});
