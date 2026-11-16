import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useEmployeeCommands: vi.fn(),
  useAssignableRoles: vi.fn(),
  useEmployeeSchoolOptions: vi.fn(),
}));

vi.mock("@/features/employee-management/hooks/use-employee-management", () => hooks);

import { initialForm } from "@/features/employee-management/components/create-employee/constants";
import { RoleScopeStep } from "@/features/employee-management/components/create-employee/role-scope-step";
import { CreateEmployeeWizard } from "@/features/employee-management/components/create-employee-wizard";

describe("CreateEmployeeWizard", () => {
  beforeEach(() => {
    hooks.useAssignableRoles.mockReturnValue({ data: [], isPending: false });
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

  test("wizard lists only assignable roles and enforces exclusive roles", () => {
    const roles = [
      { id: "role_pdt_operator", label: "Phòng đào tạo", code: "pdt_operator" },
      { id: "role_lms_teacher", label: "Giáo viên", code: "lms.instructor" },
      { id: "role_director", label: "Giám đốc", code: "director", exclusive: true },
    ];
    function Harness() {
      const [form, setForm] = useState(initialForm);
      return <><RoleScopeStep dbClasses={[]} dbSchools={[]} form={form} roleOptions={roles} set={vi.fn()} setForm={setForm} tenantId="t" /><output data-testid="chosen">{form.roleNames.join(",")}</output></>;
    }
    render(<Harness />);
    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]!);
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Phòng đào tạo", "Giáo viên", "Giám đốc"]);

    fireEvent.click(screen.getByRole("option", { name: "Giáo viên" }));
    fireEvent.click(screen.getByRole("option", { name: "Phòng đào tạo" }));
    expect(screen.getByTestId("chosen").textContent).toBe("lms.instructor,pdt_operator");

    fireEvent.click(screen.getByRole("option", { name: "Giám đốc" }));
    expect(screen.getByTestId("chosen").textContent).toBe("director");

    fireEvent.click(screen.getByRole("option", { name: "Giáo viên" }));
    expect(screen.getByTestId("chosen").textContent).toBe("lms.instructor");
  });
});
