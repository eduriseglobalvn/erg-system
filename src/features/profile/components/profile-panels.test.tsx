import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileFormPanel } from "@/features/profile/components/profile-panels";
import { EMPTY_PROFILE_FORM } from "@/features/profile/types/profile-types";

function renderPanel(showWorkRoleFields: boolean) {
  return render(
    <ProfileFormPanel
      account={null}
      form={EMPTY_PROFILE_FORM}
      isSaving={false}
      notice={null}
      showWorkRoleFields={showWorkRoleFields}
      onSave={vi.fn()}
      onUpdate={vi.fn()}
    />,
  );
}

describe("ProfileFormPanel", () => {
  it("renders exactly one save button", () => {
    renderPanel(true);
    expect(screen.getAllByRole("button", { name: "Lưu hồ sơ" })).toHaveLength(1);
  });

  it("hides the staff-only fields for students", () => {
    renderPanel(false);
    expect(screen.queryByLabelText("Bộ phận")).toBeNull();
    expect(screen.queryByLabelText("Chức danh")).toBeNull();
  });

  it("shows the staff fields for staff", () => {
    renderPanel(true);
    expect(screen.getByLabelText("Bộ phận")).toBeInTheDocument();
    expect(screen.getByLabelText("Chức danh")).toBeInTheDocument();
  });

  it("gives every input a visible, associated label", () => {
    renderPanel(true);
    for (const label of ["Họ và tên", "Số điện thoại", "Email đăng nhập", "Bộ phận", "Chức danh", "Giới thiệu ngắn"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
