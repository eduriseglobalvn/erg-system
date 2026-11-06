import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssignQuizThemeSlot, AssignQuizThemeSlotProvider } from "@/features/lms/components/assign-quiz-theme-slot";

describe("AssignQuizThemeSlot", () => {
  it("renders nothing without a provider", () => {
    const { container } = render(<AssignQuizThemeSlot quizId="q1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders what the provider returns for the quiz", () => {
    render(
      <AssignQuizThemeSlotProvider value={(quizId) => <span>theme của {quizId}</span>}>
        <AssignQuizThemeSlot quizId="q1" />
      </AssignQuizThemeSlotProvider>,
    );
    expect(screen.getByText("theme của q1")).toBeInTheDocument();
  });
});
