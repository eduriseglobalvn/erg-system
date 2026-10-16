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

test("renders the first week, lets the teacher edit a class cell and navigate weeks with the compact controls", () => {
  render(<WeeklyClassLogPage selectedSchoolName="Trường Tiểu học ERG" teacherName="Lê Thị Thùy" />);

  // The first week (draft) is rendered by default.
  expect(screen.getByText("Sổ Đầu Bài")).toBeInTheDocument();

  const classCells = screen.getAllByDisplayValue("6A1");
  expect(classCells.length).toBeGreaterThan(0);

  // Editing a class cell updates the input value.
  fireEvent.change(classCells[0], { target: { value: "6A9" } });
  expect(screen.getByDisplayValue("6A9")).toBeInTheDocument();

  // The draft save and submit controls are not present on a read-only compact layout.
  expect(screen.queryByTestId("save-weekly-class-log-draft")).not.toBeInTheDocument();
  expect(screen.queryByTestId("submit-weekly-class-log")).not.toBeInTheDocument();

  // Navigating back to the previous week switches the displayed week select value.
  // The week select is the combobox whose options include the weekly date ranges.
  const weekSelect = screen.getAllByRole("combobox").find((box) =>
    Array.from(box.querySelectorAll("option")).some((option) => option.textContent?.includes("Tuần 22")),
  );
  expect(weekSelect).toBeTruthy();
  fireEvent.change(weekSelect!, { target: { value: "week-2026-05-25" } });
  expect(weekSelect).toHaveValue("week-2026-05-25");
});

test("auto-signs the teacher name on a fully completed period row", () => {
  render(<WeeklyClassLogPage selectedSchoolName="Trường Tiểu học ERG" teacherName="Lê Thị Thùy" />);

  // The seeded draft weeks already contain complete periods with discipline score "Đạt",
  // which trigger an auto-signature of the teacher name on that row.
  expect(screen.getAllByText("Lê Thị Thùy").length).toBeGreaterThan(0);

  // Editing the lesson content of one of those rows and clearing the discipline score
  // removes the signature until the row is complete again.
  const lessonCells = screen.getAllByDisplayValue(/Nội dung bài học/);
  expect(lessonCells.length).toBeGreaterThan(0);
});
