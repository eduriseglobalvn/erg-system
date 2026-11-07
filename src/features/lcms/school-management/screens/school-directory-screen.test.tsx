import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const context = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));
const navigate = vi.hoisted(() => vi.fn());
const selectSchool = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => context.value,
}));
vi.mock("@/features/lcms/school-management/components/school-page-shell", () => ({
  SchoolPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/features/lcms/school-management/components/school-form-dialog", () => ({ SchoolFormDialog: () => null }));

import SchoolDirectoryScreen from "./school-directory-screen";

const school = (id: string, name: string, status: string, classCount: number, district = "Quận 1") => ({
  id, name, status, classCount, district, schoolType: "secondary", students: [], classes: [], subjects: [], principal: "", contactPhone: "",
});

beforeEach(() => {
  navigate.mockClear();
  selectSchool.mockClear();
  context.value = {
    error: null,
    isLoading: false,
    refetch: vi.fn(),
    saveSchool: vi.fn(),
    selectSchool,
    schools: [school("s1", "THCS Nguyễn Du", "active", 12), school("s2", "THCS Lê Lợi", "onboarding", 3)],
  };
});

it("lists schools as cards (list/listitem) with name, class count and status for phones", () => {
  render(<SchoolDirectoryScreen />);

  const list = screen.getByRole("list", { name: "Danh sách trường" });
  const items = within(list).getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(within(items[0]).getByText("THCS Nguyễn Du")).toBeInTheDocument();
  expect(within(items[0]).getByText("12 lớp")).toBeInTheDocument();
  expect(within(items[0]).getByText("Đang vận hành")).toBeInTheDocument();
  expect(within(items[1]).getByText("Đang triển khai")).toBeInTheDocument();
});

it("opens a school from its card and keeps the search filter", () => {
  render(<SchoolDirectoryScreen />);

  fireEvent.change(screen.getByPlaceholderText("Tìm tên, mã trường, địa phương..."), { target: { value: "lê lợi" } });
  const items = within(screen.getByRole("list", { name: "Danh sách trường" })).getAllByRole("listitem");
  expect(items).toHaveLength(1);

  fireEvent.click(within(items[0]).getByRole("button", { name: /THCS Lê Lợi/ }));
  expect(selectSchool).toHaveBeenCalledWith("s2");
  expect(navigate).toHaveBeenCalledWith({ href: "/admin/schools/detail?schoolId=s2" });
});
