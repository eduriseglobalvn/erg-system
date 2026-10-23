import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErgCalendarWorkspace, type ErgCalendarEvent, type ErgCalendarWorkspaceProps } from "./erg-calendar-workspace";
import { useErgCalendarWorkspace } from "./use-erg-calendar-workspace";

const events: ErgCalendarEvent[] = [
  { attendees: "Lớp A", date: "2026-07-21", duration: "09:00 - 10:00", id: "late", lane: "LMS", location: "P.1", time: "09:00", title: "Tiết sau", tone: "blue" },
  { attendees: "Lớp A", date: "2026-07-21", duration: "07:00 - 08:00", id: "early", lane: "LMS", location: "P.1", time: "07:00", title: "Tiết trước", tone: "green" },
  { attendees: "Lớp B", date: "2026-07-22", duration: "08:00 - 09:00", id: "crm", lane: "CRM", location: "P.2", time: "08:00", title: "CRM", tone: "red" },
];

function createProps(overrides: Partial<ErgCalendarWorkspaceProps> = {}): ErgCalendarWorkspaceProps {
  return {
    events,
    initialDate: "2026-07-21",
    lanes: ["LMS", "CRM"],
    todayDate: "2026-07-21",
    ...overrides,
  };
}

describe("useErgCalendarWorkspace", () => {
  it("giữ nguyên các điều khiển chính của workspace", () => {
    render(<ErgCalendarWorkspace {...createProps()} showCreateButton={false} />);

    expect(screen.getByRole("button", { name: "Về hôm nay" })).toHaveTextContent("Hôm nay");
    expect(screen.getByRole("button", { name: "Lùi khoảng thời gian" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tới khoảng thời gian tiếp theo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tuần" })).toHaveAttribute("aria-pressed", "true");
  });

  it("nhóm sự kiện theo ngày và giữ thứ tự thời gian mà không sửa mảng đầu vào", () => {
    const originalOrder = events.map((event) => event.id);
    const { result } = renderHook(() => useErgCalendarWorkspace(createProps()));

    expect(result.current.eventsByDate.get("2026-07-21")?.map((event) => event.id)).toEqual(["early", "late"]);
    expect(events.map((event) => event.id)).toEqual(originalOrder);
  });

  it("chỉ báo visible range khi khóa range thực sự thay đổi", () => {
    const onVisibleRangeChange = vi.fn();
    const props = createProps({ initialMode: "week", onVisibleRangeChange });
    const { rerender, result } = renderHook(() => useErgCalendarWorkspace(props));

    expect(onVisibleRangeChange).toHaveBeenCalledTimes(1);
    expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2026-07-20", mode: "week", to: "2026-07-26" }));

    rerender();
    expect(onVisibleRangeChange).toHaveBeenCalledTimes(1);

    act(() => result.current.moveRange(1));
    expect(onVisibleRangeChange).toHaveBeenCalledTimes(2);
    expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2026-07-27", to: "2026-08-02" }));
  });

  it("lọc summary nhưng không cho phép trạng thái không chọn bất kỳ summary nào", () => {
    const props = createProps({
      laneSummaries: [
        { color: "#1A73E8", count: 2, label: "Lớp A" },
        { color: "#D93025", count: 1, label: "Lớp B" },
      ],
      resolveEventSummaryLabel: (event) => event.attendees,
    });
    const { result } = renderHook(() => useErgCalendarWorkspace(props));

    act(() => result.current.toggleSummaryLabel("Lớp B"));
    expect(result.current.filteredEvents.map((event) => event.id)).toEqual(["late", "early"]);

    act(() => result.current.toggleSummaryLabel("Lớp A"));
    expect(result.current.filteredEvents.map((event) => event.id)).toEqual(["late", "early"]);
  });

  it("giữ scope đã chọn khi API refetch làm danh sách option thay đổi", () => {
    let schoolOptions = [
      { color: "#1A73E8", count: 2, id: "school-a", label: "Trường Alpha" },
      { color: "#188038", count: 1, id: "school-b", label: "Trường Beta" },
    ];
    const props = createProps({
      filterEventsByLane: false,
      filterEventsByScope: false,
      lanes: ["Lịch theo trường"],
      resolveLaneScopeOptions: () => schoolOptions,
    });
    const { rerender, result } = renderHook(() => useErgCalendarWorkspace(props));

    act(() => result.current.setCalendarLane("Lịch theo trường"));
    act(() => result.current.selectScopeValue("school-a"));
    expect(result.current.selectedScopeId).toBe("school-a");

    schoolOptions = [{ color: "#1A73E8", count: 2, id: "school-a", label: "Trường Alpha" }];
    rerender();

    expect(result.current.selectedScopeId).toBe("school-a");
    expect(result.current.selectedScopeLabel).toBe("Trường Alpha");
  });

  it("hiển thị dữ liệu tổng hợp của lane trước khi chọn scope khi server chịu trách nhiệm lọc", () => {
    const props = createProps({
      filterEventsByLane: false,
      filterEventsByScope: false,
      lanes: ["Lịch theo trường"],
      resolveLaneScopeOptions: () => [{ color: "#1A73E8", count: 2, id: "school-a", label: "Trường Alpha" }],
    });
    const { result } = renderHook(() => useErgCalendarWorkspace(props));

    act(() => result.current.setCalendarLane("Lịch theo trường"));

    expect(result.current.filteredEvents).toHaveLength(events.length);
  });

  it("tạo range ba ngày và di chuyển theo bước ba ngày", () => {
    const onVisibleRangeChange = vi.fn();
    const props = createProps({ initialMode: "three-day", onVisibleRangeChange });
    const { result } = renderHook(() => useErgCalendarWorkspace(props));

    expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      from: "2026-07-21",
      mode: "three-day",
      to: "2026-07-23",
    }));

    act(() => result.current.moveRange(1));
    expect(onVisibleRangeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      from: "2026-07-24",
      mode: "three-day",
      to: "2026-07-26",
    }));
  });
});
