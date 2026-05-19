import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { MatchingQuestion } from "@/components/quiz/questions/matching-question";
import type { Question } from "@/lib/types";

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
}));

const question: Question = {
  id: "q-1",
  kind: "matching",
  title: "Match the browser terms",
  instructions: "Choose the matching answer for each row.",
  points: 4,
  feedback: {
    correct: "Correct",
    incorrect: "Incorrect",
    partial: "Partial",
  },
  matching: [
    { id: "m-1", prompt: "Hiển thị URL của trang Web hiện tại", response: "Hộp địa chỉ" },
    { id: "m-2", prompt: "Tải lại trang Web hiện tại", response: "Nút làm mới" },
  ],
};

describe("MatchingQuestion mobile", () => {
  test("opens answer picker and returns matchingAssignments on selection", () => {
    const onChange = vi.fn();

    render(
      <MatchingQuestion
        question={question}
        value={{}}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /hiển thị url của trang web hiện tại/i }));
    expect(screen.getByText("Select an Answer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hộp địa chỉ/i }));

    expect(onChange).toHaveBeenCalledWith({
      matchingAssignments: {
        "m-1": "m-1",
      },
    });
  });
});
