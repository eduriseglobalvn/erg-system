import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import { AccessSectionUnsupported } from "./user-access-control-sections";
import { EducationUnitEditor } from "./admin-operations-education-editor";

vi.mock("@/features/lcms/admin-operations/components/student-sheet-import-workspace", () => ({
  StudentSheetImportWorkspace: () => null,
}));

it("tells the admin that scoped access policies are not supported yet", () => {
  render(<ErgMuiProvider><AccessSectionUnsupported /></ErgMuiProvider>);

  expect(screen.getByText("Chưa hỗ trợ phân quyền theo phạm vi")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Lưu phân quyền/ })).toBeNull();
});

it("shows education units read-only because the backend has no update endpoint", () => {
  const unit = { id: "school-1", name: "Trường A", type: "school", code: "A", status: "active" };
  render(
    <ErgMuiProvider>
      <EducationUnitEditor centers={[]} classes={[]} managementScope={{} as never} unit={unit} units={[unit]} />
    </ErgMuiProvider>,
  );

  expect(screen.getByText("Chưa hỗ trợ chỉnh sửa")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Lưu" })).toBeNull();
  expect(screen.getByDisplayValue("Trường A")).toBeDisabled();
});
