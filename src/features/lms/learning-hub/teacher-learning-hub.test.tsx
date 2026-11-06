import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  session: { permissions: [] as string[], deniedPermissions: [] as string[] },
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/platform/auth/hooks/use-auth-session", () => ({ useAuthSession: () => ({ session: mocks.session }) }));

import { TeacherLearningHub } from "./teacher-learning-hub";

const ALL = [
  "lms.assignment.read",
  "lms.assignment.create",
  "lms.exercise.read",
  "lms.assignment.progress.read",
  "lms.class.read",
  "lms.student_group.read",
  "lms.report.read",
];

describe("TeacherLearningHub", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.session = { permissions: ALL, deniedPermissions: [] };
  });

  it("links to every learning screen with a single contained button", () => {
    const { container } = render(<TeacherLearningHub />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/teacher/homework/assign",
        "/teacher/homework/exercise-bank",
        "/teacher/homework/progress",
        "/teacher/homework/class",
        "/teacher/homework/student-groups",
        "/teacher/reports",
      ]),
    );
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("navigates in-app instead of reloading", () => {
    render(<TeacherLearningHub />);
    fireEvent.click(screen.getByRole("link", { name: /Tiến độ học tập/ }));
    expect(mocks.navigate).toHaveBeenCalledWith({ href: "/teacher/homework/progress" });
  });

  it("hides entries the user has no permission for", () => {
    mocks.session = { permissions: ALL.filter((p) => p !== "lms.report.read"), deniedPermissions: [] };
    render(<TeacherLearningHub />);
    expect(screen.queryByRole("link", { name: /Báo cáo/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Tiến độ học tập/ })).toBeInTheDocument();
  });

  it("filters entries with the quick search", () => {
    render(<TeacherLearningHub />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm nhanh" }), { target: { value: "báo cáo" } });
    expect(screen.getByRole("link", { name: /Báo cáo/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Tiến độ học tập/ })).toBeNull();
  });
});
