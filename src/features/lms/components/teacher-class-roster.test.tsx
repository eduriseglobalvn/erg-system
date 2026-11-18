import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, test, vi } from "vitest";

import { classroomSnapshots } from "@/test/fixtures/mock-classroom-data";
import { ScoreSheetPanel } from "@/features/lms/components/score-sheet-panel";
import { TeacherClassRoster } from "@/features/lms/components/teacher-class-roster";

const loadWorkspace = vi.hoisted(() => vi.fn());

vi.mock("@/features/lms/api/lms-classroom-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lms/api/lms-classroom-api")>()),
  loadLmsClassWorkspace: loadWorkspace,
}));
vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  hasApiBase: () => true,
}));

const selectedClass = classroomSnapshots[0];
const page = (items: unknown[]) => ({ items, page: 0, size: 50, totalItems: items.length, totalPages: 1, hasNext: false, hasPrevious: false });
const workspace = (count: number) => ({
  classInfo: { id: selectedClass.id, schoolId: selectedClass.schoolId, name: selectedClass.className },
  students: page(Array.from({ length: count }, (_, index) => ({
    id: `student-${index + 1}`,
    fullName: `Hoc sinh ${index + 1}`,
    academicClassId: selectedClass.id,
    schoolId: selectedClass.schoolId,
    status: "active",
  }))),
  assignments: page([]),
});

function renderScoreSheet() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <TeacherClassRoster selectedClass={selectedClass}>
        {(students) => <ScoreSheetPanel selectedClass={selectedClass} selectedSchoolName="Truong thu nghiem" students={students} />}
      </TeacherClassRoster>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  loadWorkspace.mockReset();
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

test("score sheet lists the students returned by the class workspace query", async () => {
  loadWorkspace.mockResolvedValue(workspace(3));
  renderScoreSheet();

  expect(await screen.findByText(/3 học sinh/)).toBeInTheDocument();
  expect(loadWorkspace).toHaveBeenCalledWith(expect.objectContaining({ classId: selectedClass.id }), expect.anything());
});

test("a failed roster query shows an error, not an empty class", async () => {
  loadWorkspace.mockRejectedValue(new Error("boom"));
  renderScoreSheet();

  expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được danh sách học sinh");
  expect(screen.queryByText(/0 học sinh/)).not.toBeInTheDocument();
});

test("a genuinely empty class still renders the sheet with 0 students", async () => {
  loadWorkspace.mockResolvedValue(workspace(0));
  renderScoreSheet();

  expect(await screen.findByText(/0 học sinh/)).toBeInTheDocument();
});
