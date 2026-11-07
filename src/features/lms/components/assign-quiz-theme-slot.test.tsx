import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssignQuizThemeSlot, AssignQuizThemeSlotProvider } from "@/features/lms/components/assign-quiz-theme-slot";

describe("AssignQuizThemeSlot", () => {
  it("renders nothing without a provider", () => {
    const { container } = render(<AssignQuizThemeSlot selectedQuizIds={new Set(["q1"])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders what the provider returns for the quiz", () => {
    render(
      <AssignQuizThemeSlotProvider value={(quizId) => <span>theme của {quizId}</span>}>
        <AssignQuizThemeSlot selectedQuizIds={new Set(["q1"])} />
      </AssignQuizThemeSlotProvider>,
    );
    expect(screen.getByText("theme của q1")).toBeInTheDocument();
  });

  it("asks for a single quiz when several are selected, and shows nothing for none", () => {
    const provide = (ids: string[]) => (
      <AssignQuizThemeSlotProvider value={(quizId) => <span>theme của {quizId}</span>}>
        <AssignQuizThemeSlot selectedQuizIds={new Set(ids)} />
      </AssignQuizThemeSlotProvider>
    );
    const { container, rerender } = render(provide(["q1", "q2"]));
    expect(screen.getByText("Chọn một bài để xem theme")).toBeInTheDocument();
    rerender(provide([]));
    expect(container).toBeEmptyDOMElement();
  });
});
