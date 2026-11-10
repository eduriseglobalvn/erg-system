import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DragDropQuestion } from "@/components/quiz/questions/drag-drop-question";
import type { Question } from "@/domain/quiz/types";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const question: Question = {
  id: "q", kind: "drag_drop", title: "Phân loại", points: 1, feedback: { correct: "", incorrect: "", partial: "" },
  dropTargets: [{ id: "t1", label: "Động vật" }, { id: "t2", label: "Thực vật" }],
  dragDropItems: [
    { id: "i1", label: "", correctTargetId: "t1", image: { url: "https://cdn.example/meo.png", alt: "Con mèo" } },
    { id: "i2", label: "Cây lúa", correctTargetId: "t2", image: { url: "https://cdn.example/lua.png", alt: "" } },
  ],
} as unknown as Question;

describe("DragDropQuestion (learner)", () => {
  it("shows each item's image; an image-only item is named by its alt, not an empty chip", () => {
    render(<DragDropQuestion onChange={vi.fn()} question={question} value={{ dragDropPlacements: { i1: "t1" } }} />);
    // Placed in "Động vật", and in the item list.
    expect(screen.getAllByRole("img", { name: "Con mèo" })).toHaveLength(2);
    const lua = screen.getByText("Cây lúa").parentElement!;
    // Next to its label the image is decorative.
    expect(within(lua).getByRole("presentation")).toHaveAttribute("src", "https://cdn.example/lua.png");
  });

  it("review colours the group chips like choices: the right group green, a wrong pick red, no extra label", () => {
    render(<DragDropQuestion onChange={vi.fn()} question={question} reviewMode submitted value={{ dragDropPlacements: { i1: "t1", i2: "t1" } }} />);
    expect(screen.getAllByRole("button", { name: "Động vật, đáp án đúng" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Động vật, bạn chọn sai" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thực vật, đáp án đúng" })).toBeInTheDocument();
    expect(screen.queryByText(/^Đúng:/)).toBeNull();
  });
});
