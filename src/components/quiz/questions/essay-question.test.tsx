import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EssayQuestion } from "@/components/quiz/questions/text-response-question";
import type { Question } from "@/domain/quiz/types";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const question: Question = {
  id: "q", kind: "essay", title: "Bài luận", points: 1, feedback: { correct: "", incorrect: "", partial: "" },
  essayRubric: [{ id: "c", label: "Nêu đủ 3 loại", points: 2 }],
};

describe("EssayQuestion (learner)", () => {
  it("renders the textbox and never the marking guide", () => {
    render(<EssayQuestion onChange={vi.fn()} question={question} value={{}} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByText("Nêu đủ 3 loại")).toBeNull();
    expect(screen.queryByText("Rubric gợi ý")).toBeNull();
  });
});
