import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { SchoolInformationStep } from "@/features/lcms/school-management/components/setup/school-information-step";

const saveSchool = vi.fn();
const school = {
  id: "s1", name: "Trường A", address: "", district: "", principal: "", contactPhone: "", contactEmail: "",
  academicYear: "2026–2027", schoolType: "primary", status: "active", classes: [], students: [],
};

vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => ({ saveSchool, selectedSchool: school }),
}));

it("blocks saving a blank school name and shows why, without claiming it saved", () => {
  render(<SchoolInformationStep />);
  fireEvent.change(screen.getByLabelText(/Tên trường/), { target: { value: "  " } });
  expect(screen.getByText("Tên trường không được trống")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  expect(saveSchool).not.toHaveBeenCalled();
  expect(screen.queryByText("Đã lưu")).toBeNull();
});
