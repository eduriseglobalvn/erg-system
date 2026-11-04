import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { classroomSnapshots, classroomStudents } from "@/test/fixtures/mock-classroom-data";
import { AttendanceSheetPanel } from "@/features/lms/components/attendance-sheet-panel";

const selectedClass = classroomSnapshots[0];
const students = classroomStudents.filter((student) => student.classId === selectedClass.id).slice(0, 4);

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AttendanceSheetPanel selectedClass={selectedClass} selectedSchoolName="ERG Alpha Campus" students={students} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-02T12:00:00+07:00"));

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

test("shows up to five future attendance columns and stops at the fifth", () => {
  renderPanel();

  // Three attended days before the focus date, the focus date, then five future lesson slots —
  // 06/06 is the fifth, 07/06 is never reached. A date with two lessons renders two column headers,
  // so each present date has one or more headers; the day past the window has none.
  for (const date of ["30/05", "31/05", "01/06", "02/06", "03/06", "04/06", "05/06", "06/06"]) {
    expect(screen.getAllByText(date).length).toBeGreaterThan(0);
  }
  expect(screen.queryByText("07/06")).not.toBeInTheDocument();
});

test("clamps a future selected date back to today", () => {
  const { container } = renderPanel();

  // vi-locale date field (dd/MM/yyyy), not the browser-locale native date input.
  const dateInput = container.querySelector<HTMLInputElement>("input[aria-hidden=true]")!;
  expect(dateInput.value).toBe("02/06/2026");

  // Picking a future date clamps back to today, so the visible window does not move past 06/06.
  fireEvent.change(dateInput, { target: { value: "09/06/2026" } });

  expect(dateInput.value).toBe("02/06/2026");
  expect(screen.getAllByText("06/06").length).toBeGreaterThan(0);
  expect(screen.queryByText("07/06")).not.toBeInTheDocument();
});

test("Tất cả có mặt marks every unmarked student for the focus date in one click", () => {
  renderPanel();

  fireEvent.click(screen.getByRole("button", { name: "Tất cả có mặt" }));

  // Today (Tue) has two lessons x 4 students = 8 cells (rows are virtualised away in jsdom, so assert the notice).
  expect(screen.getByText(/Đã đánh dấu có mặt 8 lượt/)).toBeInTheDocument();
});

test("hides the admin-only teaching plan warning from teachers", () => {
  renderPanel();
  fireEvent.click(screen.getByRole("button", { name: "Khung chương trình" }));
  expect(screen.queryByText(/Chưa cấu hình lịch dạy/)).not.toBeInTheDocument();
});
