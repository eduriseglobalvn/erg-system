import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ApprovalItem } from "../../api/timekeeping-types";
import { ApprovalList } from "./approval-list";

const ITEMS: ApprovalItem[] = [
  { overdue: true, requesterName: "Lê Thị B", request: { id: "r1", code: "DT-2026-0001", type: "LEAVE", leaveKind: "ANNUAL", status: "PENDING", days: 2, fromDate: "2026-11-10", toDate: "2026-11-11", steps: [{ stepNo: 1, resolver: "MANAGER", status: "WAITING" }, { stepNo: 2, resolver: "SCHOOL_ROLE:VICE_PRINCIPAL", status: "WAITING" }] } },
  { overdue: false, requesterName: "Trần C", request: { id: "r2", code: "DT-2026-0002", type: "WFH", status: "PENDING", fromDate: "2026-11-12", toDate: "2026-11-12" } },
];

describe("ApprovalList", () => {
  it("marks only the overdue request with Quá hạn and shows the current step", () => {
    render(<ApprovalList checked={new Set()} items={ITEMS} onOpen={vi.fn()} onToggle={vi.fn()} onToggleAll={vi.fn()} />);
    expect(screen.getAllByText("Quá hạn")).toHaveLength(1);
    expect(screen.getByText(/Bước 1\/2 · Tổ trưởng/)).toBeInTheDocument();
  });

  it("labels each checkbox with the request code and opens a row on click", () => {
    const onOpen = vi.fn();
    const onToggle = vi.fn();
    render(<ApprovalList checked={new Set(["r2"])} items={ITEMS} onOpen={onOpen} onToggle={onToggle} onToggleAll={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Chọn đơn DT-2026-0002" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Chọn đơn DT-2026-0001" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn đơn DT-2026-0001" }));
    expect(onToggle).toHaveBeenCalledWith("r1");
    fireEvent.click(screen.getByText("Lê Thị B"));
    expect(onOpen).toHaveBeenCalledWith("r1");
  });

  it("has no checkboxes outside the bulk tab", () => {
    render(<ApprovalList items={ITEMS} onOpen={vi.fn()} onToggle={vi.fn()} onToggleAll={vi.fn()} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
