import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import type { HolidayConfig, HolidayImportPreviewRow } from "../../api/timekeeping-types";
import { DaysOffAddDialog } from "./days-off-add-dialog";
import { DaysOffImportDialog } from "./days-off-import-dialog";
import { DaysOffMonthGrid } from "./days-off-month-grid";
import { DaysOffPastWarningDialog } from "./days-off-past-warning-dialog";
import { SaturdayModesCard } from "./saturday-modes-card";
import { SelectedHolidayCard } from "./days-off-selected-card";

const h = vi.hoisted(() => ({
  api: {
    createHoliday: vi.fn(), updateHoliday: vi.fn(), deleteHoliday: vi.fn(), holidayImportPreview: vi.fn(), importHolidays: vi.fn(),
    saturdayModes: vi.fn(), setSaturdayMode: vi.fn(), holidays: vi.fn(),
  },
  loads: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/graphql-client", () => ({ getDefaultTenantId: () => "t1" }));
vi.mock("sonner", () => ({ toast: h.toast }));
vi.mock("../../api/timekeeping-admin-api", () => ({ timekeepingAdminApi: h.api }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-day-loads-api", () => ({
  useTeachingDayLoads: () => ({ data: h.loads() }),
}));

const NHA_GIAO: HolidayConfig = { id: "h1", date: "2026-11-20", name: "Ngày Nhà giáo Việt Nam", kind: "COMPANY", payMode: "UNPAID", teachingAction: "CANCEL", createdByName: "HR", affectedPeriods: 18, affectedSchools: 6 };
const PAST_ERROR = new ApiClientError("Conflict", "HOLIDAY_AFFECTS_PAST_PERIODS", 409, {
  code: "HOLIDAY_AFFECTS_PAST_PERIODS",
  data: {
    dates: ["2026-11-12"], taughtPeriods: 14, reportedPeriods: 9,
    schools: [
      { schoolId: "a", schoolName: "THCS Kết Đoàn", taughtPeriods: 5, reportedPeriods: 3 },
      { schoolId: "b", schoolName: "THCS Trương Công Định", taughtPeriods: 4, reportedPeriods: 3 },
      { schoolId: "c", schoolName: "THCS Nguyễn Du", taughtPeriods: 3, reportedPeriods: 2 },
      { schoolId: "d", schoolName: "THCS Nghĩa Tân", taughtPeriods: 2, reportedPeriods: 1 },
    ],
  },
});

const withClient = (ui: ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

afterEach(() => { vi.clearAllMocks(); h.loads.mockReturnValue(undefined); });

describe("«Thêm ngày nghỉ»", () => {
  const open = () => render(withClient(<DaysOffAddDialog date="2026-11-27" onClose={vi.fn()} onSaved={vi.fn()} />));
  const payGroup = () => screen.getByRole("radiogroup", { name: "Tính lương ngày này" });

  it("starts with no pay mode chosen and the save button disabled", () => {
    open();
    expect(screen.getByText("Áp cho toàn hệ thống.")).toBeInTheDocument();
    expect(within(payGroup()).getAllByRole("radio").every((radio) => radio.getAttribute("aria-checked") === "false")).toBe(true);
    fireEvent.change(screen.getByLabelText("Tên ngày nghỉ"), { target: { value: "Du lịch công ty" } });
    const save = screen.getByRole("button", { name: "Thêm ngày nghỉ" });
    expect(save).toBeDisabled();
    fireEvent.click(within(payGroup()).getByRole("radio", { name: "Có lương (L)" }));
    expect(save).toBeEnabled();
  });

  it("offers only «Huỷ tiết» and «Vẫn dạy» for the teaching periods", () => {
    open();
    const names = within(screen.getByRole("radiogroup", { name: "Tiết dạy trong ngày" })).getAllByRole("radio").map((radio) => radio.textContent);
    expect(names).toEqual(["Huỷ tiết", "Vẫn dạy"]);
  });

  it("locks a state holiday and a compensatory day to «Có lương (L)»", () => {
    open();
    for (const kind of ["Lễ nhà nước", "Nghỉ bù"]) {
      fireEvent.click(screen.getByRole("radio", { name: kind }));
      expect(within(payGroup()).getByRole("radio", { name: "Có lương (L)" })).toHaveAttribute("aria-checked", "true");
      expect(within(payGroup()).getByRole("radio", { name: "Trừ phép năm (P)" })).toBeDisabled();
      expect(within(payGroup()).getByRole("radio", { name: "Không lương (KL)" })).toBeDisabled();
    }
  });

  it("shows the orange notice with the loaded periods of the day", () => {
    h.loads.mockReturnValue([{ date: "2026-11-27", periods: 18, schools: 6 }]);
    open();
    fireEvent.change(screen.getByLabelText("Tên ngày nghỉ"), { target: { value: "Du lịch công ty" } });
    expect(screen.getByText(/^18 tiết ở 6 trường rơi vào ngày này\. Chọn «Huỷ tiết»/)).toBeInTheDocument();
  });

  it("sends the command and, after the 409 warning, the same command with confirmPast", async () => {
    h.api.createHoliday.mockRejectedValueOnce(PAST_ERROR).mockResolvedValueOnce([]);
    open();
    fireEvent.change(screen.getByLabelText("Tên ngày nghỉ"), { target: { value: "Du lịch công ty" } });
    fireEvent.click(within(payGroup()).getByRole("radio", { name: "Có lương (L)" }));
    fireEvent.click(screen.getByRole("button", { name: "Thêm ngày nghỉ" }));
    expect(await screen.findByText("Huỷ 14 tiết đã dạy?")).toBeInTheDocument();
    expect(h.api.createHoliday).toHaveBeenCalledWith({ from: "2026-11-27", to: "2026-11-27", name: "Du lịch công ty", kind: "COMPANY", payMode: "PAID", teachingAction: "CANCEL" });
    fireEvent.click(screen.getByRole("button", { name: "Vẫn huỷ 14 tiết" }));
    await waitFor(() => expect(h.api.createHoliday).toHaveBeenCalledTimes(2));
    expect(h.api.createHoliday.mock.calls[1][0]).toMatchObject({ confirmPast: true, name: "Du lịch công ty" });
  });

  it("explains a duplicate day (HOLIDAY_EXISTS)", async () => {
    h.api.createHoliday.mockRejectedValueOnce(new ApiClientError("exists", "HOLIDAY_EXISTS", 409));
    open();
    fireEvent.change(screen.getByLabelText("Tên ngày nghỉ"), { target: { value: "Du lịch công ty" } });
    fireEvent.click(within(payGroup()).getByRole("radio", { name: "Có lương (L)" }));
    fireEvent.click(screen.getByRole("button", { name: "Thêm ngày nghỉ" }));
    expect(await screen.findByText("Ngày lễ này đã có. Mở ngày đó trên lịch để sửa.")).toBeInTheDocument();
  });
});

describe("warning dialog", () => {
  const warning = (confirm = vi.fn()) => ({
    confirm,
    payload: { dates: ["2026-11-12"], taughtPeriods: 14, reportedPeriods: 9, schools: [{ schoolId: "a", schoolName: "THCS Kết Đoàn", taughtPeriods: 5, reportedPeriods: 3 }, { schoolId: "b", schoolName: "THCS Nguyễn Du", taughtPeriods: 9, reportedPeriods: 6 }] },
  });

  it("names the periods and schools, confirms with the count in the button", () => {
    const confirm = vi.fn();
    const onCancel = vi.fn();
    render(<DaysOffPastWarningDialog onCancel={onCancel} warning={warning(confirm)} />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Huỷ 14 tiết đã dạy?")).toBeInTheDocument();
    expect(screen.getByText("THCS Kết Đoàn")).toBeInTheDocument();
    expect(screen.getByText("9 báo giảng đã nộp không còn được tính công.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vẫn huỷ 14 tiết" }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("sends nothing on «Huỷ»", () => {
    const confirm = vi.fn();
    render(<DaysOffPastWarningDialog onCancel={vi.fn()} warning={warning(confirm)} />);
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe("selected day off", () => {
  it("saves a chip at once and asks before cancelling taught periods", async () => {
    h.api.updateHoliday.mockRejectedValueOnce(PAST_ERROR).mockResolvedValueOnce(NHA_GIAO);
    render(withClient(<SelectedHolidayCard holiday={{ ...NHA_GIAO, teachingAction: "KEEP" }} />));
    expect(screen.getByText("Thứ 6, 20/11 · Ngày Nhà giáo Việt Nam")).toBeInTheDocument();
    expect(screen.getByText("Toàn hệ thống · tạo bởi HR")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Huỷ tiết" }));
    expect(await screen.findByText("Huỷ 14 tiết đã dạy?")).toBeInTheDocument();
    expect(h.api.updateHoliday).toHaveBeenCalledWith("h1", { from: "2026-11-20", to: "2026-11-20", name: "Ngày Nhà giáo Việt Nam", kind: "COMPANY", payMode: "UNPAID", teachingAction: "CANCEL" });
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(h.api.updateHoliday).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio", { name: "Vẫn dạy" })).toHaveAttribute("aria-checked", "true");
  });

  it("locks the pay mode when the kind becomes a state holiday", async () => {
    h.api.updateHoliday.mockResolvedValue(NHA_GIAO);
    render(withClient(<SelectedHolidayCard holiday={NHA_GIAO} />));
    fireEvent.click(screen.getByRole("radio", { name: "Lễ nhà nước" }));
    await waitFor(() => expect(h.api.updateHoliday).toHaveBeenCalled());
    expect(h.api.updateHoliday.mock.calls[0][1]).toMatchObject({ kind: "STATE", payMode: "PAID" });
  });

  it("shows the orange notice only when periods fall on the day", () => {
    const { rerender } = render(withClient(<SelectedHolidayCard holiday={NHA_GIAO} />));
    expect(screen.getByText(/^18 tiết ở 6 trường rơi vào ngày này\./)).toBeInTheDocument();
    rerender(withClient(<SelectedHolidayCard holiday={{ ...NHA_GIAO, affectedPeriods: 0 }} />));
    expect(screen.queryByText(/rơi vào ngày này/)).not.toBeInTheDocument();
  });
});

describe("Saturday modes", () => {
  it("shows every Saturday and sends the picked mode", async () => {
    h.api.saturdayModes.mockResolvedValue([{ date: "2026-11-07", mode: "OFFICE" }, { date: "2026-11-14", mode: "WFH" }]);
    h.api.setSaturdayMode.mockResolvedValue({});
    render(withClient(<SaturdayModesCard hasHolidays holidayNames={new Map()} month="2026-11" />));
    expect(await screen.findByText("28/11")).toBeInTheDocument();
    const row = screen.getByRole("radiogroup", { name: "Chế độ thứ 7 21/11" });
    fireEvent.click(within(row).getByRole("radio", { name: "Nghỉ (KL)" }));
    await waitFor(() => expect(h.api.setSaturdayMode).toHaveBeenCalledWith("2026-11-21", "UNPAID_OFF"));
    expect(within(screen.getByRole("radiogroup", { name: "Chế độ thứ 7 14/11" })).getByRole("radio", { name: "WFH" })).toHaveAttribute("aria-checked", "true");
  });

  it("names a day off instead of offering a mode", async () => {
    h.api.saturdayModes.mockResolvedValue([]);
    render(withClient(<SaturdayModesCard hasHolidays holidayNames={new Map([["2026-11-14", "Du lịch công ty"]])} month="2026-11" />));
    expect(await screen.findByText("Du lịch công ty")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Chế độ thứ 7 14/11" })).not.toBeInTheDocument();
  });
});

describe("month calendar", () => {
  const props = { modes: new Map(), month: "2026-11", onPick: vi.fn(), periods: new Map<string, number>(), selected: "2026-11-20", showLegend: true, today: "2026-11-14" };

  it("writes the six legend entries in the board order", () => {
    render(<DaysOffMonthGrid {...props} holidays={new Map([["2026-11-20", NHA_GIAO]])} />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toBe("Nghỉ lễ nhà nước · nghỉ bùNghỉ công tyThứ 7 lên công tyThứ 7 WFHThứ 7 nghỉ có lươngThứ 7 nghỉ không lươngNghỉ có lương (L) = 1 công");
  });

  it("marks the day off, the Saturdays and the weekday loads", () => {
    const { container } = render(<DaysOffMonthGrid {...props} holidays={new Map([["2026-11-20", NHA_GIAO]])} modes={new Map([["2026-11-14", "WFH"]])} periods={new Map([["2026-11-16", 16], ["2026-11-14", 4]])} />);
    expect(screen.getByText("Ngày Nhà giáo Việt Nam · không lương · 18 tiết huỷ")).toBeInTheDocument();
    expect(screen.getByText("16 tiết")).toBeInTheDocument();
    expect(screen.getByText("WFH")).toBeInTheDocument();
    expect(screen.getByText("4 tiết ở trường")).toBeInTheDocument();
    expect(screen.getAllByText("Lên công ty")).toHaveLength(3);
    expect(container.querySelectorAll("button")).toHaveLength(42);
  });

  it("selects a day off but asks to add on any other day, and hides the legend when empty", () => {
    const onPick = vi.fn();
    const { rerender } = render(<DaysOffMonthGrid {...props} holidays={new Map([["2026-11-20", NHA_GIAO]])} onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: /^Thứ 6, 20\/11/ }));
    expect(onPick).toHaveBeenLastCalledWith("2026-11-20", NHA_GIAO);
    fireEvent.click(screen.getByRole("button", { name: /^Thứ 2, 16\/11/ }));
    expect(onPick).toHaveBeenLastCalledWith("2026-11-16", undefined);
    rerender(<DaysOffMonthGrid {...props} holidays={new Map()} onPick={onPick} showLegend={false} />);
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });
});

describe("yearly import", () => {
  const ROWS: HolidayImportPreviewRow[] = [
    { date: "2027-01-01", name: "Tết dương lịch", kind: "STATE", status: "EXISTS" },
    { date: "2027-02-04", lunarDate: "28/12", name: "Tết", kind: "STATE", status: "NEW" },
    { date: "2027-05-03", name: "Nghỉ bù Ngày Quốc tế Lao động", kind: "COMPENSATORY", status: "NEW" },
    { date: "2027-11-24", name: "Ngày Văn hoá Việt Nam", kind: "STATE", status: "VERIFY" },
  ];
  const open = () => render(withClient(<DaysOffImportDialog onClose={vi.fn()} year={2027} />));

  it("ticks «Đã có» (disabled) and «Mới», leaves «Cần đối chiếu» off, and counts the rest", async () => {
    h.api.holidayImportPreview.mockResolvedValue({ source: "SAVED", savedOn: "2026-11-15", rows: ROWS });
    open();
    expect(await screen.findByText("Nguồn: lịch «Ngày lễ ở Việt Nam» của Google, bản lưu ngày 15/11/2026.")).toBeInTheDocument();
    const exists = screen.getByRole("checkbox", { name: /01\/01 Tết dương lịch/ });
    expect(exists).toBeChecked();
    expect(exists).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /24\/11/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Nhập 2 ngày" })).toBeEnabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /24\/11/ }));
    expect(screen.getByRole("button", { name: "Nhập 3 ngày" })).toBeEnabled();
  });

  it("imports the ticked rows only", async () => {
    h.api.holidayImportPreview.mockResolvedValue({ source: "SAVED", savedOn: "2026-11-15", rows: ROWS });
    h.api.importHolidays.mockResolvedValue({ imported: 2, skipped: 0 });
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Nhập 2 ngày" }));
    await waitFor(() => expect(h.api.importHolidays).toHaveBeenCalled());
    expect(h.api.importHolidays.mock.calls[0][0]).toEqual({ rows: [{ date: "2027-02-04", name: "Tết", kind: "STATE" }, { date: "2027-05-03", name: "Nghỉ bù Ngày Quốc tế Lao động", kind: "COMPENSATORY" }] });
  });

  it("previews again with the .ics file the user picks", async () => {
    h.api.holidayImportPreview.mockResolvedValue({ source: "SAVED", savedOn: "2026-11-15", rows: ROWS });
    open();
    await screen.findByText("Tết dương lịch");
    const file = new File(["BEGIN:VCALENDAR"], "holidays.ics", { type: "text/calendar" });
    fireEvent.change(screen.getByLabelText("Chọn tệp .ics"), { target: { files: [file] } });
    await waitFor(() => expect(h.api.holidayImportPreview).toHaveBeenLastCalledWith(2027, file));
  });
});
