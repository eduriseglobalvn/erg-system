import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const context = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));
const mobile = vi.hoisted(() => ({ value: true }));
const canAccess = vi.hoisted(() => vi.fn((_path: string) => true));
const navigate = vi.hoisted(() => vi.fn());
const selectSchool = vi.hoisted(() => vi.fn());

vi.mock("@mui/material/useMediaQuery", () => ({ default: () => mobile.value }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/features/lcms/admin-shell-context", () => ({ useAdminShellModel: () => ({ canAccess }) }));
vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => context.value,
}));
vi.mock("@/features/lcms/school-management/components/school-page-shell", () => ({
  SchoolPageShell: ({ children }: { children: React.ReactNode }) => <div data-testid="desktop-shell">{children}</div>,
}));
vi.mock("@/features/lcms/school-management/components/school-form-dialog", () => ({ SchoolFormDialog: () => <div role="dialog" /> }));

import SchoolDirectoryScreen from "./school-directory-screen";

const school = (id: string, name: string, status: string, classCount: number, studentCount: number, district = "Quận 1") => ({
  id, name, status, classCount, studentCount, district, schoolType: "secondary", students: [], classes: [], subjects: [], principal: "", contactPhone: "",
});

beforeEach(() => {
  mobile.value = true;
  canAccess.mockImplementation(() => true);
  navigate.mockClear();
  selectSchool.mockClear();
  context.value = {
    error: null,
    isLoading: false,
    refetch: vi.fn(),
    saveSchool: vi.fn(),
    selectSchool,
    schools: [school("s1", "THCS Nguyễn Du", "active", 12, 410), school("s2", "THCS Lê Lợi", "onboarding", 3, 95)],
  };
});

it("on phones renders the N6 view: title, count, school cards sorted by name with counts and status", () => {
  render(<SchoolDirectoryScreen />);

  expect(screen.queryByTestId("desktop-shell")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Trường học" })).toBeInTheDocument();
  expect(screen.getByText("2 trường · sắp theo tên")).toBeInTheDocument();
  const items = within(screen.getByRole("list", { name: "Danh sách trường" })).getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(within(items[0]).getByText("THCS Lê Lợi")).toBeInTheDocument();
  expect(items[0]).toHaveTextContent("3 lớp");
  expect(items[0]).toHaveTextContent("95 HS");
  expect(within(items[0]).getByText("Đang triển khai")).toBeInTheDocument();
  expect(within(items[1]).getByText("THCS · Quận 1")).toBeInTheDocument();
  expect(within(items[1]).getByText("Đang vận hành")).toBeInTheDocument();
});

it("filters by search and opens a school from its card", () => {
  render(<SchoolDirectoryScreen />);

  fireEvent.change(screen.getByRole("textbox", { name: "Tìm trường" }), { target: { value: "lê lợi" } });
  const items = within(screen.getByRole("list", { name: "Danh sách trường" })).getAllByRole("listitem");
  expect(items).toHaveLength(1);

  fireEvent.click(screen.getByRole("button", { name: "Mở THCS Lê Lợi" }));
  expect(selectSchool).toHaveBeenCalledWith("s2");
  expect(navigate).toHaveBeenCalledWith({ href: "/admin/schools/detail?schoolId=s2" });
});

it("section chips navigate to the school screens the session can open", () => {
  canAccess.mockImplementation((path: string) => !path.endsWith("/imports"));
  render(<SchoolDirectoryScreen />);

  const tabs = screen.getAllByRole("tab");
  expect(tabs.map((tab) => tab.textContent)).toEqual(["Danh sách trường", "Người học", "Giám sát"]);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  fireEvent.click(tabs[1]);
  expect(navigate).toHaveBeenCalledWith({ href: "/admin/schools/students" });
});

it("has exactly one contained button, which opens the add-school form", () => {
  const { container } = render(<SchoolDirectoryScreen />);

  expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Thêm trường" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("shows empty states for no schools and for a search with no match", () => {
  context.value = { ...context.value, schools: [] };
  const { rerender } = render(<SchoolDirectoryScreen />);
  expect(screen.getByText("Chưa có trường nào")).toBeInTheDocument();

  context.value = { ...context.value, schools: [school("s1", "THCS Nguyễn Du", "active", 12, 410)] };
  rerender(<SchoolDirectoryScreen />);
  fireEvent.change(screen.getByRole("textbox", { name: "Tìm trường" }), { target: { value: "zzz" } });
  expect(screen.getByText("Không có trường phù hợp")).toBeInTheDocument();
});

it("shows the error state with a retry when the list fails to load", () => {
  context.value = { ...context.value, error: new Error("boom"), schools: [] };
  render(<SchoolDirectoryScreen />);

  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(context.value.refetch).toHaveBeenCalled();
});

it("keeps the desktop table from md up", () => {
  mobile.value = false;
  render(<SchoolDirectoryScreen />);

  expect(screen.getByTestId("desktop-shell")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { level: 1, name: "Trường học" })).not.toBeInTheDocument();
  expect(screen.getByRole("table")).toBeInTheDocument();
});
