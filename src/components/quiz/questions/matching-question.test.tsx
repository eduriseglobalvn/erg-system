import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { MatchingQuestion } from "@/components/quiz/questions/matching-question";
import { MatchingImageControls } from "@/components/quiz/questions/matching-question/matching-media";
import type { Question } from "@/domain/quiz/types";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

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
    expect(screen.getByText("Chọn đáp án")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hộp địa chỉ/i }));

    expect(onChange).toHaveBeenCalledWith({
      matchingAssignments: {
        "m-1": "m-1",
      },
    });
  });
});

describe("MatchingImageControls", () => {
  test.each([
    ["image/heic", 1024, "Chỉ nhận ảnh PNG, JPG, GIF hoặc WebP."],
    ["image/png", 5 * 1024 * 1024 + 1, "Ảnh lớn hơn 5 MB."],
  ])("rejects %s of %i bytes with a toast and leaves the image alone", async (type, size, message) => {
    toastError.mockClear();
    const onChange = vi.fn();
    render(<MatchingImageControls label="Ảnh" onChange={onChange} />);
    const file = new File(["x"], "a.img", { type });
    Object.defineProperty(file, "size", { value: size });

    fireEvent.change(screen.getByLabelText("Ảnh"), { target: { files: [file] } });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    expect(onChange).not.toHaveBeenCalled();
  });
});
