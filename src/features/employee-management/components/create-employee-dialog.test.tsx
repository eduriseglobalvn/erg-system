import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useEmployeeCommands: vi.fn(),
  useAssignableRoles: vi.fn(),
}));

vi.mock("@/features/employee-management/hooks/use-employee-management", () => hooks);

import { initialForm } from "@/features/employee-management/components/create-employee/constants";
import { RoleStep } from "@/features/employee-management/components/create-employee/role-step";
import { CreateEmployeeDialog } from "@/features/employee-management/components/create-employee-dialog";

describe("CreateEmployeeDialog", () => {
  beforeEach(() => {
    hooks.useAssignableRoles.mockReturnValue({ data: [], isPending: false });
    hooks.useEmployeeCommands.mockReturnValue({ create: { mutateAsync: vi.fn(), isPending: false } });
  });

  const roles = [{ id: "role_lms_teacher", label: "Giáo viên", code: "lms.instructor" }];

  function fill(withRole: boolean, name = "Nhân Sự A", email = "a@erg.edu.vn") {
    fireEvent.change(screen.getByPlaceholderText("Nguyễn Văn A"), { target: { value: name } });
    fireEvent.change(screen.getByPlaceholderText("name@erg.edu.vn"), { target: { value: email } });
    if (withRole) {
      fireEvent.mouseDown(screen.getAllByRole("combobox")[0]!);
      fireEvent.click(screen.getByRole("option", { name: "Giáo viên" }));
      fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    }
  }

  test("creates with only name, email and role; code and job title are filled in", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ account: {} });
    hooks.useAssignableRoles.mockReturnValue({ data: roles, isPending: false });
    hooks.useEmployeeCommands.mockReturnValue({ create: { mutateAsync, isPending: false } });
    render(<CreateEmployeeDialog tenantId="tenant-1" open onClose={vi.fn()} />);

    fill(true);
    fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const payload = mutateAsync.mock.calls[0]![0];
    expect(payload.policies).toEqual([]);
    expect(payload.profile.employeeCode).toMatch(/^NV-[0-9]{4}$/);
    expect(payload.profile.jobTitle).toBe("Giáo viên");
  });

  test("create button stays disabled until name, email and a role are all set", () => {
    hooks.useAssignableRoles.mockReturnValue({ data: roles, isPending: false });
    render(<CreateEmployeeDialog tenantId="tenant-1" open onClose={vi.fn()} />);
    const create = screen.getByRole("button", { name: "Tạo tài khoản" });
    expect(create).toBeDisabled();
    fill(false);
    expect(create).toBeDisabled();
    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]!);
    fireEvent.click(screen.getByRole("option", { name: "Giáo viên" }));
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    expect(create).toBeEnabled();
    fireEvent.change(screen.getByPlaceholderText("name@erg.edu.vn"), { target: { value: "" } });
    expect(create).toBeDisabled();
  });

  test("wizard lists only assignable roles and enforces exclusive roles", () => {
    const roles = [
      { id: "role_pdt_operator", label: "Phòng đào tạo", code: "pdt_operator" },
      { id: "role_lms_teacher", label: "Giáo viên", code: "lms.instructor" },
      { id: "role_director", label: "Giám đốc", code: "director", exclusive: true },
    ];
    function Harness() {
      const [form, setForm] = useState(initialForm);
      return <><RoleStep form={form} roleOptions={roles} setForm={setForm} /><output data-testid="chosen">{form.roleNames.join(",")}</output></>;
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
