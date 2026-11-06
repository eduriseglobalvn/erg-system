import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateExerciseDialog } from "./create-exercise-dialog";
import type { Exercise } from "./exercise-bank-model";
import { questionBankQueryKeys } from "@/features/question-bank/api/question-bank-query";
import { mockQuestionBankData } from "@/test/fixtures/mock-question-bank";

function seededQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(questionBankQueryKeys.workspace(undefined, { includeQuestions: true, size: 100 }), mockQuestionBankData());
  return queryClient;
}

describe("CreateExerciseDialog", () => {
  it("transitions to step 2 when clicking continue and submits correctly", async () => {
    const queryClient = seededQueryClient();
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateExerciseDialog
          open={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      </QueryClientProvider>
    );

    // Click select all
    const selectAllBtn = screen.getByText(/Chọn tất cả/i);
    fireEvent.click(selectAllBtn);

    // Find Continue button and click
    const continueBtn = screen.getByText(/Tiếp tục/i);
    expect(continueBtn).toBeDefined();
    fireEvent.click(continueBtn);

    // Expect step 2 to be rendered
    expect(screen.getByText(/Thông tin cấu hình bài tập/i)).toBeDefined();
    expect(handleClose).not.toHaveBeenCalled();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Now click submit button in step 2
    const submitBtn = screen.getByRole("button", { name: /Tạo bài tập/i });
    fireEvent.click(submitBtn);

    // Form should submit with chosen questions and details
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        questionCount: expect.any(Number),
        title: expect.any(String),
      })
    );
  });

  it("picks exact number of random questions via custom count input", () => {
    const queryClient = seededQueryClient();
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateExerciseDialog
          open={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      </QueryClientProvider>
    );

    // Find custom count input
    const input = screen.getByPlaceholderText(/Nhập số câu.../i);
    fireEvent.change(input, { target: { value: "3" } });

    // Click Bốc button
    const bocBtn = screen.getByTitle("Bốc đúng số lượng random câu");
    fireEvent.click(bocBtn);

    // Verify footer displays 3 questions selected
    expect(screen.getByText(/Đã chọn 3 câu/i)).toBeDefined();
    expect(screen.getByText(/Tiếp tục \(3 câu\) →/i)).toBeDefined();
  });

  it("loads existing exercise data when in edit mode and updates properly", () => {
    const queryClient = seededQueryClient();
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();
    const handleUpdate = vi.fn();

    const existingExercise: Exercise = {
      id: "ex-edit-01",
      title: "Bài tập cần sửa đổi",
      subject: "IC3 GS6",
      level: "Level 1",
      classTargets: ["Lớp 9A1"],
      type: "quiz",
      difficulty: "medium",
      status: "published",
      questionCount: 4,
      durationMinutes: 20,
      updatedAt: "2026-11-01",
      assignedCount: 0,
      tags: ["IC3"],
      questionIds: ["q-01", "q-02"],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <CreateExerciseDialog
          open={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          initialExercise={existingExercise}
          onUpdate={handleUpdate}
        />
      </QueryClientProvider>
    );

    // Should show "Chỉnh sửa bài tập"
    expect(screen.getByText("Chỉnh sửa bài tập")).toBeDefined();
    expect(screen.getByDisplayValue("Bài tập cần sửa đổi")).toBeDefined();

    // Modify title
    const titleInput = screen.getByDisplayValue("Bài tập cần sửa đổi");
    fireEvent.change(titleInput, { target: { value: "Bài tập đã sửa đổi hoàn chỉnh" } });

    // Click save changes
    const saveBtn = screen.getByRole("button", { name: /Lưu thay đổi bài tập/i });
    fireEvent.click(saveBtn);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ex-edit-01",
        title: "Bài tập đã sửa đổi hoàn chỉnh",
      })
    );
  });
});
