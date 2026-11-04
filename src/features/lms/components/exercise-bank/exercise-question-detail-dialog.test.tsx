import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExerciseQuestionDetailDialog } from "./exercise-question-detail-dialog";
import type { Exercise } from "./exercise-bank-model";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

describe("ExerciseQuestionDetailDialog", () => {
  const mockExercise: Exercise = {
    id: "ex-test-01",
    title: "IC3 GS6 - Kiểm tra kiến thức máy tính",
    subject: "IC3 GS6",
    level: "Level 1",
    classTargets: ["Lớp 9A3"],
    type: "quiz",
    difficulty: "easy",
    status: "published",
    questionCount: 2,
    durationMinutes: 15,
    updatedAt: "2026-11-02",
    assignedCount: 1,
    tags: ["IC3", "Level 1"],
  };

  const mockQuestions: QuestionBankQuestion[] = [
    {
      id: "q-001",
      scope: { type: "global" },
      subjectId: "ic3-gs6",
      subjectLabel: "IC3 GS6",
      levelId: "ic3-l1",
      levelLabel: "Level 1",
      categoryId: "hardware",
      categoryLabel: "Phần cứng",
      gradeLabel: "Khối 6",
      type: "multiple-choice",
      difficulty: "core",
      status: "ready",
      stem: "Thiết bị nào sau đây dùng để nhập dữ liệu chữ và số vào máy tính?",
      objective: "Nhận biết bàn phím",
      tags: ["hardware"],
      masteryRate: 0.9,
      usageCount: 12,
      schoolsUsing: 3,
      lastUsedAt: "2026-11-01",
      recommendedCluster: "basics",
      answer: "Bàn phím (Keyboard)",
      choices: [
        { id: "c1", label: "Bàn phím (Keyboard)", correct: true },
        { id: "c2", label: "Màn hình", correct: false },
      ],
    },
    {
      id: "q-002",
      scope: { type: "global" },
      subjectId: "ic3-gs6",
      subjectLabel: "IC3 GS6",
      levelId: "ic3-l1",
      levelLabel: "Level 1",
      categoryId: "network",
      categoryLabel: "Mạng máy tính",
      gradeLabel: "Khối 6",
      type: "multiple-choice",
      difficulty: "stretch",
      status: "ready",
      stem: "Cổng kết nối nào truyền tải đồng thời cả tín hiệu hình ảnh và âm thanh?",
      objective: "Nhận biết cổng HDMI",
      tags: ["ports"],
      masteryRate: 0.8,
      usageCount: 8,
      schoolsUsing: 2,
      lastUsedAt: "2026-11-01",
      recommendedCluster: "hardware",
      answer: "Cổng HDMI",
      choices: [
        { id: "c21", label: "Cổng HDMI", correct: true },
        { id: "c22", label: "Cổng VGA", correct: false },
      ],
    },
  ];

  it("renders questions cleanly without revealing answers and allows searching and editing", () => {
    const handleClose = vi.fn();
    const handleAssign = vi.fn();
    const handleEdit = vi.fn();

    render(
      <ExerciseQuestionDetailDialog
        open={true}
        onClose={handleClose}
        exercise={mockExercise}
        questions={mockQuestions}
        onAssign={handleAssign}
        onEdit={handleEdit}
      />
    );

    // Shows exercise title and subject
    expect(screen.getByText("IC3 GS6 - Kiểm tra kiến thức máy tính")).toBeDefined();
    expect(screen.getAllByText(/2 câu hỏi/).length).toBeGreaterThan(0);

    // Shows question stems
    expect(
      screen.getByText(/Thiết bị nào sau đây dùng để nhập dữ liệu chữ và số/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Cổng kết nối nào truyền tải đồng thời cả tín hiệu hình ảnh/i)
    ).toBeDefined();

    // Does NOT render answer choices or reveal answers
    expect(screen.queryByText("Màn hình")).toBeNull();
    expect(screen.queryByText(/Đáp án chuẩn:/i)).toBeNull();

    // Search filter works
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm câu hỏi theo nội dung/i);
    fireEvent.change(searchInput, { target: { value: "HDMI" } });

    // Should only show the HDMI question now
    expect(
      screen.queryByText(/Thiết bị nào sau đây dùng để nhập dữ liệu chữ và số/i)
    ).toBeNull();
    expect(
      screen.getByText(/Cổng kết nối nào truyền tải đồng thời cả tín hiệu hình ảnh/i)
    ).toBeDefined();

    // Clicking edit button triggers onEdit
    const editBtn = screen.getByRole("button", { name: /Chỉnh sửa bài này/i });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockExercise);
    expect(handleClose).toHaveBeenCalled();

    // Clicking assign button triggers onAssign
    const assignBtn = screen.getByRole("button", { name: /Giao bài tập này/i });
    fireEvent.click(assignBtn);
    expect(handleAssign).toHaveBeenCalledWith("IC3 GS6 - Kiểm tra kiến thức máy tính");
  });
});
