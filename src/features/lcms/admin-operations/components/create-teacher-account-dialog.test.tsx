import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { CreateTeacherAccountDialog } from "@/features/lcms/admin-operations/components/create-teacher-account-dialog";

const options = {
  scopes: [
    {
      scopeType: "school" as const,
      scopeId: "school-1",
      name: "ERG School",
      badge: "School",
      icon: "school",
      description: "Trường ERG",
    },
  ],
  modules: [{ id: "lms", name: "LMS", description: "Learning management" }],
  roleGroups: [
    {
      id: "lms_teacher_standard",
      name: "Giáo viên tiêu chuẩn",
      description: "Vận hành lớp được phân công",
      scopeTypes: ["school" as const],
      permissions: ["lms.dashboard.read"],
    },
  ],
};

describe("create teacher account dialog", () => {
  test("validates identity, role group, and access policy before provisioning", async () => {
    const onProvision = vi.fn().mockResolvedValue({
      user: { id: "teacher-1", primaryEmail: "teacher@erg.edu.vn", fullName: "Nguyễn An", status: "PROVISIONED" },
      deliveryStatus: "SENT",
    });

    render(
      <CreateTeacherAccountDialog
        onClose={vi.fn()}
        onCreated={vi.fn()}
        onProvision={onProvision}
        open
        options={options}
      />,
    );

    expect(screen.getByLabelText("Họ và tên")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Vui lòng nhập họ và tên.")).toBeInTheDocument();
    expect(screen.getByText("Email đăng nhập không hợp lệ.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn An" } });
    fireEvent.change(screen.getByLabelText("Email đăng nhập"), { target: { value: "teacher@erg.edu.vn" } });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "0909000111" } });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(await screen.findByText("Chọn ít nhất một nhóm quyền.")).toBeInTheDocument();
    expect(screen.getByText("Chọn phạm vi và module truy cập.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Giáo viên tiêu chuẩn" }));
    fireEvent.click(screen.getByRole("radio", { name: /ERG School/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "LMS" }));
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    await waitFor(() =>
      expect(onProvision).toHaveBeenCalledWith({
        primaryEmail: "teacher@erg.edu.vn",
        fullName: "Nguyễn An",
        phone: "0909000111",
        recoveryEmail: undefined,
        roleGroupIds: ["lms_teacher_standard"],
        policies: [
          {
            scopeType: "school",
            scopeId: "school-1",
            scopeName: "ERG School",
            roleGroup: "lms_teacher_standard",
            modules: ["lms"],
          },
        ],
        credentialDelivery: "EMAIL_INVITE",
      }),
    );
    expect(await screen.findByText("Đã tạo tài khoản giáo viên")).toBeInTheDocument();
  });

  test("shows a field-level provisioning error without pretending success", async () => {
    const onProvision = vi.fn().mockRejectedValue(Object.assign(new Error("Email already exists"), { field: "primaryEmail" }));

    render(
      <CreateTeacherAccountDialog
        onClose={vi.fn()}
        onCreated={vi.fn()}
        onProvision={onProvision}
        open
        options={options}
      />,
    );

    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn An" } });
    fireEvent.change(screen.getByLabelText("Email đăng nhập"), { target: { value: "teacher@erg.edu.vn" } });
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Giáo viên tiêu chuẩn" }));
    fireEvent.click(screen.getByRole("radio", { name: /ERG School/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "LMS" }));
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
    expect(screen.queryByText("Đã tạo tài khoản giáo viên")).not.toBeInTheDocument();
  });
});
