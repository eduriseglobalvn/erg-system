import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  CurriculumRoadmapView,
  type CurriculumRoadmapActions,
} from "./curriculum-roadmap-view";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

const mockActions: CurriculumRoadmapActions = {
  onCreateLevel: vi.fn(),
  onCreateTopic: vi.fn(),
  onCreateLesson: vi.fn(),
  onEditFolder: vi.fn(),
  onDeleteFolder: vi.fn(),
};

describe("CurriculumRoadmapView", () => {
  it("renders empty state with prominent create level button when there are no stages", () => {
    render(
      <CurriculumRoadmapView
        stages={[]}
        subjectTitle="Địa Lý"
        query=""
        selectedTarget={null}
        onOpenFolder={vi.fn()}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("Chưa có chặng học nào trong Địa Lý")).toBeInTheDocument();
    const createBtn = screen.getByRole("button", { name: /\+ Tạo Level đầu tiên cho Địa Lý/i });
    expect(createBtn).toBeInTheDocument();

    fireEvent.click(createBtn);
    expect(mockActions.onCreateLevel).toHaveBeenCalledTimes(1);
  });

  it("renders pure curriculum roadmap with Level, Topic, Lesson and structural action buttons", () => {
    const stages: CurriculumRoadmapStage[] = [
      {
        level: {
          id: "group-category-lvl1",
          title: "Level 1: Địa lý đại cương",
          description: "Nền tảng kiến thức tự nhiên",
          role: "level",
          status: "published",
          summary: { levels: 1, topics: 1, lectures: 0, documents: 0, exercises: 0, totalContent: 0 },
          pathLabels: ["Địa Lý", "Level 1: Địa lý đại cương"],
          target: { type: "node", id: "group-category-lvl1" },
        },
        topics: [
          {
            id: "topic-1",
            title: "Chủ đề 1: Vũ trụ và Trái Đất",
            lessons: [
              {
                folder: {
                  id: "lesson-sec-1",
                  title: "Bài 1: Khái niệm bản đồ",
                  role: "topic",
                  summary: { levels: 0, topics: 0, lectures: 0, documents: 0, exercises: 0, totalContent: 0 },
                  pathLabels: ["Địa Lý", "Level 1", "Chủ đề 1"],
                  target: { type: "node", id: "lesson-sec-1" },
                },
                content: [],
              },
            ],
          },
        ],
      },
    ];

    render(
      <CurriculumRoadmapView
        stages={stages}
        subjectTitle="Địa Lý"
        query=""
        selectedTarget={null}
        onOpenFolder={vi.fn()}
        actions={mockActions}
      />,
    );

    // Verify roadmap headers and structural hierarchy
    expect(screen.getByText("Bản đồ cấu trúc môn học")).toBeInTheDocument();
    expect(screen.getByText("Level 1: Địa lý đại cương")).toBeInTheDocument();
    expect(screen.getByText("Chủ đề 1: Vũ trụ và Trái Đất")).toBeInTheDocument();
    expect(screen.getByText("Bài 1: Khái niệm bản đồ")).toBeInTheDocument();

    // Verify pure structure buttons: + Chủ đề, + Bài học
    const addTopicButtons = screen.getAllByRole("button", { name: /Chủ đề/i });
    expect(addTopicButtons.length).toBeGreaterThan(0);
    const addLessonButtons = screen.getAllByRole("button", { name: /Bài học/i });
    expect(addLessonButtons.length).toBeGreaterThan(0);

    // Verify no lecture/file/quiz attachment buttons
    expect(screen.queryByRole("button", { name: /Bài giảng/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tài liệu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bài tập/i })).not.toBeInTheDocument();

    // Verify clicking add topic calls onCreateTopic with the level folder
    fireEvent.click(addTopicButtons[0]);
    expect(mockActions.onCreateTopic).toHaveBeenCalledWith(stages[0].level);
  });
});
