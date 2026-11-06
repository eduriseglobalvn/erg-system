import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LmsTeacherShellContext } from "@/features/lms/components/lms-teacher-shell-context";
import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { TeacherLearningHub } from "./teacher-learning-hub";

const navigate = vi.fn();

const ALL = [
  "lms.assignment.read",
  "lms.assignment.create",
  "lms.exercise.read",
  "lms.assignment.progress.read",
  "lms.class.read",
  "lms.student_group.read",
  "lms.report.read",
];

function renderHub(granted: string[], denied: string[] = []) {
  const model = { deniedPermissions: denied, grantedPermissions: granted, navigate } as unknown as LmsTeacherShellController;
  return render(
    <LmsTeacherShellContext.Provider value={model}>
      <TeacherLearningHub />
    </LmsTeacherShellContext.Provider>,
  );
}

const without = (permission: string) => ALL.filter((p) => p !== permission);

describe("TeacherLearningHub", () => {
  beforeEach(() => navigate.mockReset());

  it("links to every learning screen with a single contained button", () => {
    const { container } = renderHub(ALL);
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

  it("follows the shell model's permissions (no auth session is provided at all)", () => {
    renderHub(["lms.assignment.read", "lms.report.read"]);
    expect(screen.getByRole("link", { name: /Báo cáo/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Tiến độ học tập/ })).toBeNull();
  });

  it("navigates in-app instead of reloading", () => {
    renderHub(ALL);
    fireEvent.click(screen.getByRole("link", { name: /Tiến độ học tập/ }));
    expect(navigate).toHaveBeenCalledWith({ href: "/teacher/homework/progress" });
  });

  it.each([
    ["lms.report.read", /Báo cáo/],
    ["lms.student_group.read", /Nhóm học sinh/],
    ["lms.assignment.create", /Giao bài tập/],
    ["lms.exercise.read", /Kho luyện tập/],
  ])("hides the entry that needs %s", (permission, name) => {
    const full = renderHub(ALL);
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
    full.unmount();
    renderHub(without(permission));
    expect(screen.queryByRole("link", { name })).toBeNull();
  });

  it("hides entries that are explicitly denied", () => {
    renderHub(ALL, ["lms.report.read"]);
    expect(screen.queryByRole("link", { name: /Báo cáo/ })).toBeNull();
  });

  it("filters by the text each entry renders", () => {
    renderHub(ALL);
    const search = screen.getByRole("textbox", { name: "Tìm nhanh" });
    fireEvent.change(search, { target: { value: "báo cáo" } });
    expect(screen.getByRole("link", { name: /Báo cáo/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Tiến độ học tập/ })).toBeNull();
    // "theo dõi" is only in a row's hidden description, so it must not match.
    fireEvent.change(search, { target: { value: "theo dõi" } });
    expect(screen.queryByRole("link", { name: /Tiến độ học tập/ })).toBeNull();
    // A card's description is rendered, so it matches.
    fireEvent.change(search, { target: { value: "soạn" } });
    expect(screen.getByRole("link", { name: /Giao bài tập/ })).toBeInTheDocument();
  });
});
