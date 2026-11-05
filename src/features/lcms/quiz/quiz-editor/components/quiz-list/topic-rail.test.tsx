import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import { TopicRail } from "./topic-rail";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const row = (over: Partial<TopicRow>): TopicRow => ({ id: "t1", label: "Phân số", quizId: "q1", questionCount: 3, lifecycle: "draft", slides: [], ...over });
const rows = [
  row({ id: "t1", label: "Phân số", questionCount: 3, lifecycle: "changed" }),
  row({ id: "t2", label: "Hình học", quizId: null, questionCount: 0, lifecycle: "none" }),
];

describe("TopicRail", () => {
  it("lists Tất cả first, then each topic with its count and status label", () => {
    render(<TopicRail onSelect={vi.fn()} rows={rows} selectedTopicId="all" />);
    const items = screen.getAllByRole("button");
    expect(items.map((item) => item.textContent)).toEqual(["Tất cả3 câu", "Phân số3 câuCó sửa chưa xuất bản", "Hình học0 câuChưa có bài"]);
    expect(items[0]).toHaveAttribute("aria-current", "true");
  });

  it("marks the selected topic and passes the clicked row, or null for Tất cả", () => {
    const onSelect = vi.fn();
    render(<TopicRail onSelect={onSelect} rows={rows} selectedTopicId="t2" />);
    const hinh = screen.getByRole("button", { name: /Hình học/ });
    expect(hinh).toHaveAttribute("aria-current", "true");
    expect(within(hinh).getByText("Chưa có bài")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Phân số/ }));
    expect(onSelect).toHaveBeenLastCalledWith(rows[0]);
    fireEvent.click(screen.getByRole("button", { name: /Tất cả/ }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("guides to the question bank when the Level has no topics, with no add-topic button", () => {
    render(<TopicRail onSelect={vi.fn()} rows={[]} selectedTopicId="all" />);
    expect(screen.getByText(/Level này chưa có chủ đề\. Thêm chủ đề ở/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ngân hàng câu hỏi" })).toHaveAttribute("href", "/admin/content/questions");
    expect(screen.queryByRole("button", { name: /Thêm chủ đề/ })).toBeNull();
  });
});
