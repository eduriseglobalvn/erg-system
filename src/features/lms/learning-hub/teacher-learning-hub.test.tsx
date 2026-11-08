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

  it("links to every learning screen; the Giao bài tile is the only solid action", () => {
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
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(0);
    expect(screen.getByText("Lớp chưa có hoạt động đang mở. Bấm “Giao bài” để bắt đầu.")).toBeInTheDocument();
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
    ["lms.assignment.create", /^Giao bài$/],
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

  it("lists the open activities with progress and opens their progress page", () => {
    const model = { deniedPermissions: [], grantedPermissions: ALL, navigate, runs: [{ id: "r1", title: "Luyện tập chương 2", subjectLabel: "Toán", targetLevel: "7A", activeClasses: 1, completionRate: 74, submittedCount: 28, inProgressCount: 0, needsReviewCount: 6, dueLabel: "Hạn 20:00" }] } as unknown as LmsTeacherShellController;
    render(<LmsTeacherShellContext.Provider value={model}><TeacherLearningHub /></LmsTeacherShellContext.Provider>);
    expect(screen.getByRole("progressbar", { name: "Hoàn thành 74%" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /Luyện tập chương 2/ }));
    expect(navigate).toHaveBeenCalledWith({ href: "/teacher/homework/progress?assignmentId=r1" });
  });
});
