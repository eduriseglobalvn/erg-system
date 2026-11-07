import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RemoteRuleConfig } from "../../api/timekeeping-types";
import { RemoteWorkPanel } from "./remote-work-panel";

const state = vi.hoisted(() => ({ rules: [] as RemoteRuleConfig[] }));

vi.mock("@/lib/graphql-client", () => ({ getDefaultTenantId: () => "t1" }));
vi.mock("@/features/employee-management/hooks/use-employee-management", () => ({
  useEmployees: () => ({ data: { users: [{ id: "u1", fullName: "Lê Thị B", email: "b@erg.vn" }] }, isPending: false, isError: false }),
}));
vi.mock("../../api/timekeeping-config-query", () => {
  const mutation = () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, reset: vi.fn() });
  return {
    useRemoteRules: () => ({ data: state.rules, isPending: false, isError: false, refetch: vi.fn() }),
    useDeleteRemoteRule: mutation,
    useSaveRemoteRule: mutation,
  };
});

describe("RemoteWorkPanel", () => {
  it("shows the empty state and the fixed remote behaviour", () => {
    state.rules = [];
    const { container } = render(<RemoteWorkPanel schoolId="sc1" />);
    expect(screen.getByText("Chưa có quy tắc chấm công từ xa")).toBeInTheDocument();
    expect(screen.getByText('Khi chấm từ xa: Vẫn cần khuôn mặt · Không lưu vị trí · Gắn nhãn "Từ xa"')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/QR|Làm thêm|\bOT\b/);
  });

  it("lists the three kinds of rules", () => {
    state.rules = [
      { id: "r1", kind: "USERS", userIds: ["u1", "u2"], active: true },
      { id: "r2", kind: "WEEKDAY", weekday: 5, active: true },
      { id: "r3", kind: "APPROVED_WFH", active: false },
    ];
    render(<RemoteWorkPanel schoolId="sc1" />);
    expect(screen.getByText("Nhân sự được chỉ định")).toBeInTheDocument();
    expect(screen.getByText("2 nhân sự")).toBeInTheDocument();
    expect(screen.getByText("Theo ngày cố định")).toBeInTheDocument();
    expect(screen.getByText("T6")).toBeInTheDocument();
    expect(screen.getByText('Khi đơn "Làm việc tại nhà" được duyệt')).toBeInTheDocument();
    expect(screen.getByText("Đã tắt")).toBeInTheDocument();
  });

  it("opens the dialog with the person picker for specified staff and the weekday chips for a fixed day", () => {
    state.rules = [];
    render(<RemoteWorkPanel schoolId="sc1" />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm quy tắc" }));
    expect(screen.getByText("Chọn người")).toBeInTheDocument();
    expect(screen.getByText("Lê Thị B · b@erg.vn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Theo ngày cố định" }));
    expect(screen.getByRole("radio", { name: "T2" })).toBeInTheDocument();
    expect(screen.queryByText("Chọn người")).not.toBeInTheDocument();
  });
});
