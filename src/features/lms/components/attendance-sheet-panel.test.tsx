import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { classroomSnapshots, classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import { AttendanceSheetPanel } from "@/features/lms/components/attendance-sheet-panel";

const selectedClass = classroomSnapshots[0];
const students = classroomStudents.filter((student) => student.classId === selectedClass.id).slice(0, 4);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-02T12:00:00+07:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

test("shows up to five future attendance columns and keeps them empty", () => {
  render(<AttendanceSheetPanel selectedClass={selectedClass} selectedSchoolName="ERG Alpha Campus" students={students} />);

  expect(screen.getByText("Điểm danh 30/05 - 06/06")).toBeInTheDocument();
  expect(screen.getByText("30/05")).toBeInTheDocument();
  expect(screen.getByText("31/05")).toBeInTheDocument();
  expect(screen.getByText("01/06")).toBeInTheDocument();
  expect(screen.getByText("02/06")).toBeInTheDocument();
  expect(screen.getByText("03/06")).toBeInTheDocument();
  expect(screen.getByText("04/06")).toBeInTheDocument();
  expect(screen.getByText("05/06")).toBeInTheDocument();
  expect(screen.getByText("06/06")).toBeInTheDocument();
  expect(screen.queryByText("07/06")).not.toBeInTheDocument();

  const futureButtons = [
    ...screen.getAllByLabelText(/Thứ Tư Tiết 1/),
    ...screen.getAllByLabelText(/Thứ Năm Tiết 1/),
    ...screen.getAllByLabelText(/Thứ Năm Tiết 2/),
    ...screen.getAllByLabelText(/Thứ Sáu Tiết 1/),
    ...screen.getAllByLabelText(/Thứ Bảy Tiết 1/),
  ];
  const disabledFutureButtons = futureButtons.filter((button) => button.hasAttribute("disabled"));
  expect(disabledFutureButtons).toHaveLength(students.length * 5);
  disabledFutureButtons.forEach((button) => {
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("—");
  });
});

test("clamps a future selected date back to today", () => {
  render(<AttendanceSheetPanel selectedClass={selectedClass} selectedSchoolName="ERG Alpha Campus" students={students} />);

  const dateInput = screen.getByLabelText("Chọn ngày trọng tâm") as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: "2026-06-05" } });

  expect(dateInput.value).toBe("2026-06-02");
  expect(screen.getByText("Điểm danh 30/05 - 06/06")).toBeInTheDocument();
  expect(screen.getByText("03/06")).toBeInTheDocument();
  expect(screen.getByText("04/06")).toBeInTheDocument();
  expect(screen.getByText("05/06")).toBeInTheDocument();
  expect(screen.getByText("06/06")).toBeInTheDocument();
  expect(screen.queryByText("07/06")).not.toBeInTheDocument();
});
