import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { ClassroomSchool, ClassroomSnapshot } from "@/domain/school/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

import { ClassListWorkspace } from "./class-list-workspace";

const leaf: DashboardLeaf = { breadcrumb: ["Lớp học"], description: "", id: "class-active", title: "Danh sách lớp", variant: "class-active" };
const school = { id: "s1", name: "Trường A" } as ClassroomSchool;

function snapshot(id: string, className: string, studentCount: number): ClassroomSnapshot {
  return {
    activeAssignments: 0, averageScore: 8, className, clusterId: "central", competitionPoints: 0,
    completionRate: 50, gradeLabel: "Khối 6", homeroomTeacher: `GV ${className}`, id, lastSubmissionAt: "", riskStudents: 0,
    schoolId: "s1", schoolName: "Trường A", studentCount,
  };
}

function renderList(snapshots: ClassroomSnapshot[], onOpenLeaf = vi.fn()) {
  render(
    <ClassListWorkspace activeLeaf={leaf} mode="active" onOpenLeaf={onOpenLeaf} schools={[school]} selectedSchoolId="s1" snapshots={snapshots} />,
  );
  return onOpenLeaf;
}

const firstColumn = () => screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].querySelector("h3")?.textContent);

test("renders class rows and sorts by header click", () => {
  renderList([snapshot("b", "6B", 30), snapshot("a", "6A", 25)]);

  expect(firstColumn()).toEqual(["6B", "6A"]);
  fireEvent.click(screen.getByRole("button", { name: "Lớp" }));
  expect(firstColumn()).toEqual(["6A", "6B"]);
});

test("row actions open the report and student leaves", () => {
  const onOpenLeaf = renderList([snapshot("a", "6A", 25)]);
  const row = screen.getAllByRole("row")[1];

  fireEvent.click(within(row).getByRole("button", { name: "Báo cáo" }));
  fireEvent.click(within(row).getByRole("button", { name: "Học sinh" }));
  expect(onOpenLeaf.mock.calls).toEqual([["class-reports"], ["class-students"]]);
});

test("paginates after ten classes and shows a grey dash for missing metrics", () => {
  const snapshots = Array.from({ length: 12 }, (_, index) => snapshot(`c${index}`, `Lớp ${String(index).padStart(2, "0")}`, 20));
  snapshots[0] = { ...snapshots[0], metricsAvailable: false };
  renderList(snapshots);

  expect(screen.getAllByRole("row")).toHaveLength(11);
  expect(screen.getByText("1–10 trên 12 lớp")).toBeInTheDocument();
  expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: /next page/i }));
  expect(screen.getAllByRole("row")).toHaveLength(3);
});

test("shows the empty state when no class matches", () => {
  renderList([]);

  expect(screen.getByText("Chưa có lớp đang hoạt động")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
