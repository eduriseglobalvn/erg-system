import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useEmployeeCommands: vi.fn(),
  useEmployeeRoleOptions: vi.fn(),
  useEmployeeSchoolOptions: vi.fn(),
}));

vi.mock("@/features/employee-management/hooks/use-employee-management", () => hooks);

import { CreateEmployeeWizard } from "@/features/employee-management/components/create-employee-wizard";

describe("CreateEmployeeWizard", () => {
  beforeEach(() => {
    hooks.useEmployeeRoleOptions.mockReturnValue({ data: [], isPending: false });
    hooks.useEmployeeSchoolOptions.mockReturnValue({ schools: [], classes: [], isPending: false });
    hooks.useEmployeeCommands.mockReturnValue({ create: { mutateAsync: vi.fn(), isPending: false } });
  });

  test("starts at identity step and moves to profile step", () => {
    render(<CreateEmployeeWizard tenantId="tenant-1" open onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText("name@erg.edu.vn")).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Tiếp tục" });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Nguyễn Văn A"), { target: { value: "Nhân Sự A" } });
    fireEvent.change(screen.getByPlaceholderText("name@erg.edu.vn"), { target: { value: "a@erg.edu.vn" } });
    fireEvent.click(next);

    expect(screen.getByPlaceholderText("Giảng viên chuyên trách...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("name@erg.edu.vn")).not.toBeInTheDocument();
  });
});
