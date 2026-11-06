import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { MatchingQuestion } from "@/components/quiz/questions/matching-question";
import type { Question } from "@/domain/quiz/types";

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

describe("MatchingQuestion on a phone", () => {
  test("renders the same puzzle as the web, with no select", () => {
    render(<MatchingQuestion question={question} value={{}} onChange={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: /^Mảnh / })).toHaveLength(2);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Chọn đáp án")).not.toBeInTheDocument();
  });
});
