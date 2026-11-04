import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, test, vi } from "vitest";

import { classroomSnapshots, classroomStudents } from "@/test/fixtures/mock-classroom-data";
import { ScoreSheetPanel } from "@/features/lms/components/score-sheet-panel";

const selectedClass = classroomSnapshots[0];
const students = classroomStudents.filter((student) => student.classId === selectedClass.id).slice(0, 4);

beforeEach(() => {
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

test("titles the desktop score sheet with the class and guides the teacher to create an offline column", () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ScoreSheetPanel selectedClass={selectedClass} selectedSchoolName="ERG Alpha Campus" students={students} />
    </QueryClientProvider>,
  );

  expect(screen.getByText(`Bảng điểm · ${selectedClass.className}`)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tạo cột" })).toBeInTheDocument();
  expect(screen.getByText(/dán cả cột|Bấm “Tạo cột”/)).toBeInTheDocument();
});
