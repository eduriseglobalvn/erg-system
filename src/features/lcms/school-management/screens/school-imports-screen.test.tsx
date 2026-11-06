import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import SchoolImportsScreen from "@/features/lcms/school-management/screens/school-imports-screen";

vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => ({
    selectedSchool: { id: "01a171e6-1111-4222-8333-444455556666", name: "Trường A" },
    unsupportedApiMessage: "Chưa hỗ trợ.",
  }),
}));
vi.mock("@/features/lcms/school-management/components/school-page-shell", () => ({
  SchoolPageShell: ({ action, children }: { action: React.ReactNode; children: React.ReactNode }) => <div>{action}{children}</div>,
}));

test("disabled 'Tạo đợt nhập' explains why via tooltip", async () => {
  const { container } = render(<SchoolImportsScreen />);
  const button = screen.getByRole("button", { name: "Tạo đợt nhập" });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.mouseOver(button.parentElement as HTMLElement);
  expect(await screen.findByRole("tooltip")).toBeTruthy();
  expect(screen.getByRole("tooltip").textContent).toContain("Backend chưa cung cấp");
  expect(container.textContent).not.toContain("01a171e6");
});
