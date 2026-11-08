import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import { StudentGroupsMobile } from "@/features/lms/components/student-groups-mobile";
import { StudentGroupsPage } from "@/features/lms/components/student-groups-page";
import type { StudentGroup } from "@/features/lms/components/student-groups-parts";

const classes = [
  { id: "c1", className: "7A", gradeLabel: "Khối 7", homeroomTeacher: "Nguyễn Thu Hạnh", studentCount: 38 },
  { id: "c2", className: "7B", gradeLabel: "Khối 7", homeroomTeacher: "", studentCount: 35 },
] as ClassroomSnapshot[];

const groups: StudentGroup[] = [
  { id: "g1", name: "Tổ 1", note: "Ôn tập cuối tuần", color: "#0071E3", studentIds: ["s1", "s2", "s3", "s4"] },
  { id: "g2", name: "Tổ 2", note: "", color: "#0071E3", studentIds: [] },
];

const studentNames = new Map([["s1", "Lê Tuấn Kiệt"], ["s2", "Phạm Quang Hải"], ["s3", "Trần Ngọc Vy"], ["s4", "Đỗ Hải Nam"]]);

function renderView(list = groups, onCreate = vi.fn()) {
  render(
    <StudentGroupsMobile
      classes={classes}
      createPending={false}
      groups={list}
      onBack={vi.fn()}
      onCreate={onCreate}
      status="ready"
      studentNames={studentNames}
      subtitle="THCS Lê Lợi"
    />,
  );
  return onCreate;
}

const cards = (name: string) => within(screen.getByRole("list", { name })).getAllByRole("listitem").map((li) => li.textContent);

afterEach(cleanup);

describe("StudentGroupsMobile (N11)", () => {
  it("opens on the groups tab with member avatars and counts", () => {
    renderView();
    expect(screen.getByRole("tab", { name: "Nhóm 2" }).getAttribute("aria-selected")).toBe("true");
    const items = cards("Danh sách nhóm");
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("Tổ 1");
    expect(items[0]).toContain("Ôn tập cuối tuần");
    expect(items[0]).toContain("TK");
    expect(items[0]).toContain("4 HS");
    expect(items[0]).not.toContain("HN"); // only 3 avatars in the stack
    expect(items[1]).toContain("0 HS");
  });

  it("switches to the class cards with the segment", () => {
    renderView();
    fireEvent.click(screen.getByRole("tab", { name: "Lớp 2" }));
    const items = cards("Danh sách lớp");
    expect(items[0]).toContain("7A");
    expect(items[0]).toContain("GVCN Nguyễn Thu Hạnh");
    expect(items[0]).toContain("38 HS");
    expect(items[1]).not.toContain("GVCN");
    expect(screen.queryByRole("button", { name: "Tạo nhóm" })).toBeNull();
  });

  it("shows the dashed empty state when there are no groups", () => {
    renderView([]);
    expect(screen.getByText("Chưa có nhóm nào. Bấm “Tạo nhóm” để bắt đầu.")).toBeTruthy();
  });

  it("has exactly one contained button: Tạo nhóm", () => {
    const onCreate = renderView();
    const button = screen.getByRole("button", { name: "Tạo nhóm" });
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(button.className).toContain("MuiButton-contained");
    fireEvent.click(button);
    expect(onCreate).toHaveBeenCalled();
  });

  it("is what StudentGroupsPage renders on a phone", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <StudentGroupsPage classes={classes} onBack={vi.fn()} selectedSchoolName="THCS Lê Lợi" />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Lớp và nhóm" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /^Lớp 2/ })).toBeTruthy();
  });
});
