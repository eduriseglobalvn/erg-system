import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { classroomSnapshots, classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
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

  const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]');
  expect(dateInput).not.toBeNull();
  expect(dateInput!.value).toBe("2026-06-02");

  // Picking a future date clamps back to today, so the visible window does not move past 06/06.
  fireEvent.change(dateInput!, { target: { value: "2026-06-09" } });

  expect(dateInput!.value).toBe("2026-06-02");
  expect(screen.getAllByText("06/06").length).toBeGreaterThan(0);
  expect(screen.queryByText("07/06")).not.toBeInTheDocument();
});
