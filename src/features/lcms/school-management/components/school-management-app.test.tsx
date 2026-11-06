import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const context = vi.hoisted(() => ({ value: { error: null as Error | null, isLoading: false, selectedSchool: null as object | null } }));

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/admin/schools/classes", searchStr: "" }),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  SchoolManagementProvider: ({ children }: { children: React.ReactNode }) => children,
  useSchoolManagementContext: () => context.value,
}));
vi.mock("@/features/lcms/school-management/screens/school-classes-screen", () => ({ default: () => <p>classes screen</p> }));

import { SchoolManagementApp } from "./school-management-app";

beforeEach(() => {
  context.value = { error: null, isLoading: false, selectedSchool: null };
});

it("shows an error instead of a blank page when the school data failed to load", () => {
  context.value.error = new Error("401");
  render(<SchoolManagementApp />);
  expect(screen.getByRole("alert")).toHaveTextContent("Không tải được dữ liệu trường học");
});

it("shows an honest empty state when no school is selected", () => {
  render(<SchoolManagementApp />);
  expect(screen.getByText("Chưa chọn trường")).toBeInTheDocument();
});

it("renders the screen once a school is selected", async () => {
  context.value.selectedSchool = { id: "s1" };
  render(<SchoolManagementApp />);
  expect(await screen.findByText("classes screen")).toBeInTheDocument();
});
