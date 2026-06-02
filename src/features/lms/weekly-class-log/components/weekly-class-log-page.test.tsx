import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { WeeklyClassLogPage } from "@/features/lms/weekly-class-log";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

test("edits class log cells, auto signs complete rows, and switches weeks with compact controls", async () => {
  render(
    <WeeklyClassLogPage
      selectedSchoolName="Trường Tiểu học ERG"
      teacherName="Lê Thị Thùy"
    />,
  );

  fireEvent.change(screen.getAllByDisplayValue("6A1")[0], {
    target: { value: "6A9" },
  });

  expect(screen.getByDisplayValue("6A9")).toBeInTheDocument();
  expect(screen.getAllByDisplayValue("Lê Thị Thùy").length).toBeGreaterThan(0);
  expect(screen.getAllByDisplayValue("Không ghi nhận")[0]).toBeDisabled();
  expect(screen.queryByTestId("save-weekly-class-log-draft")).not.toBeInTheDocument();
  expect(screen.queryByTestId("submit-weekly-class-log")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Tuần trước" }));

  expect(screen.getByLabelText("Chọn tuần")).toHaveValue("week-2026-05-25");
  fireEvent.change(screen.getByLabelText("Chọn tuần"), { target: { value: "week-2026-06-01" } });
  expect(screen.getByLabelText("Chọn tuần")).toHaveValue("week-2026-06-01");
});

test("suggests students with spaces in the query and highlights selected mentions", async () => {
  const { container } = render(
    <WeeklyClassLogPage
      selectedClass={{
        id: "class-6a1",
        schoolId: "school-erg-alpha",
        schoolName: "ERG Alpha Campus",
        clusterId: "central",
        className: "Lớp 6A1",
        gradeLabel: "Khối 6",
        homeroomTeacher: "Lê Thị Thùy",
        studentCount: 50,
        activeAssignments: 0,
        completionRate: 0,
        averageScore: 0,
        riskStudents: 0,
        competitionPoints: 0,
        lastSubmissionAt: "-",
      }}
      selectedSchoolName="Trường Tiểu học ERG"
      teacherName="Lê Thị Thùy"
    />,
  );

  const absentCell = screen.getAllByDisplayValue("")[0];
  fireEvent.change(absentCell, { target: { value: "@Võ Ngọc" } });

  const mentionOption = await screen.findByText(/Võ Ngọc Linh/);
  fireEvent.mouseDown(mentionOption);
  fireEvent.blur(absentCell);

  expect((absentCell as HTMLTextAreaElement).value).toContain("Võ Ngọc Linh");
  expect((absentCell as HTMLTextAreaElement).value).not.toContain("@Võ Ngọc Linh");
  expect(container.querySelector(".text-sky-600")?.textContent).toBe("Võ Ngọc Linh");
});
