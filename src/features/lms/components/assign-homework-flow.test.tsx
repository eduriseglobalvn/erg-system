import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { classroomSnapshots } from "@/test/fixtures/mock-classroom-data";
import { AssignHomeworkPage } from "@/features/lms/components/assign-homework-page";

vi.mock("@/features/question-bank/api/question-bank-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/question-bank/api/question-bank-query")>()),
  // The assign wizard offers only published bank quizzes; give it one.
  useQuestionBankWorkspaceQuery: () => ({
    data: {
      quizzes: [{
        id: "quiz-published", title: "Thiết bị và hệ điều hành", status: "ready", kind: "train",
        subjectId: "subject-ic3", subjectLabel: "IC3 GS6", levelId: "level-1", levelLabel: "Level 1",
        topicLabels: ["Căn bản về công nghệ"], questionIds: ["q1", "q2"], questionCount: 2, durationLabel: "15 phút",
      }],
    },
  }),
}));

vi.mock("@/features/lms/api/lms-assignment-command-api", () => ({
  createLmsAssignment: vi.fn().mockResolvedValue({
    assignmentId: "mock-assign-1",
    recipientCount: 1,
    resources: [],
  }),
}));

vi.mock("@/features/lms/api/lms-classroom-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/lms/api/lms-classroom-api")>();
  return {
    ...actual,
    loadLmsClassWorkspace: vi.fn().mockResolvedValue({
      classInfo: { id: "class-6a1", name: "Lớp 6A1", grade: "6", schoolId: "school-erg-alpha" },
      students: {
        items: [
          { id: "s1", fullName: "Nguyễn Văn A", status: "ACTIVE", studentCode: "HS01" },
          { id: "s2", fullName: "Trần Thị B", status: "ACTIVE", studentCode: "HS02" },
        ],
        page: 0,
        size: 50,
        totalItems: 2,
        totalPages: 1,
      },
      assignments: { items: [], page: 0, size: 50, totalItems: 0, totalPages: 0 },
    }),
  };
});

function renderAssignHomework() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onBack = vi.fn();
  const onCreateAssignment = vi.fn();
  const onSelectClass = vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AssignHomeworkPage
        classes={classroomSnapshots}
        selectedClass={classroomSnapshots[0]}
        onBack={onBack}
        onCreateAssignment={onCreateAssignment}
        onSelectClass={onSelectClass}
      />
    </QueryClientProvider>,
  );

  return { ...result, onBack, onCreateAssignment, onSelectClass };
}

describe("AssignHomeworkPage user flow", () => {
  it("validates empty title before advancing to step 2", () => {
    renderAssignHomework();

    const nextBtn = screen.getByRole("button", { name: "Tiếp theo" });
    fireEvent.click(nextBtn);

    // Validation error should show
    expect(screen.getByText("Vui lòng nhập tên bài tập trước khi tiếp tục.")).toBeDefined();
  });

  it("advances to step 2 when title is provided and student rows can be clicked", async () => {
    const { onCreateAssignment } = renderAssignHomework();

    // Wait for students to load from mock
    await waitFor(() => {
      expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThan(0);
    });

    // Check that rows can be clicked to toggle student selection
    const desktopItem = screen.getAllByText("Nguyễn Văn A").find((el) => el.closest("tr"));
    const row = desktopItem?.closest("tr");
    expect(row).toBeDefined();
    fireEvent.click(row!);

    // Type title
    const titleInput = screen.getByPlaceholderText("Nhập tên bài tập...");
    fireEvent.change(titleInput, { target: { value: "Bài kiểm tra 15 phút" } });

    // Click next
    const nextBtn = screen.getByRole("button", { name: "Tiếp theo" });
    fireEvent.click(nextBtn);

    // Should move to step 2: Chọn tài nguyên / Chọn bài tập
    await waitFor(() => {
      expect(screen.getByText("Chọn bài tập")).toBeDefined();
    });

    // Click Giao bài
    const submitBtn = screen.getByRole("button", { name: "Giao bài" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreateAssignment).toHaveBeenCalledWith("Bài kiểm tra 15 phút", expect.any(String));
    });
  });

  it("displays server error message on step 2 when assignment creation fails", async () => {
    const { createLmsAssignment } = await import("@/features/lms/api/lms-assignment-command-api");
    vi.mocked(createLmsAssignment).mockRejectedValueOnce(new Error("Server database error 500"));

    const { onCreateAssignment } = renderAssignHomework();

    await waitFor(() => {
      expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThan(0);
    });

    const titleInput = screen.getByPlaceholderText("Nhập tên bài tập...");
    fireEvent.change(titleInput, { target: { value: "Bài lỗi server" } });

    const nextBtn = screen.getByRole("button", { name: "Tiếp theo" });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText("Chọn bài tập")).toBeDefined();
    });

    const submitBtn = screen.getByRole("button", { name: "Giao bài" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Lỗi khi lưu trên máy chủ: Server database error 500")).toBeDefined();
    });
    expect(onCreateAssignment).not.toHaveBeenCalled();
  });
});
