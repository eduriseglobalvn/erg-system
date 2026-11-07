import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewLayout } from "@/components/quiz/review/review-layout";
import { buildReviewFixture } from "@/test/fixtures/quiz-review-fixture";

const { questions, attempt } = buildReviewFixture();

function setup(surface: "web" | "phone", current = 36) {
  const props = {
    onBack: vi.fn(),
    onSelect: vi.fn(),
    startLocalRetry: vi.fn(),
  };
  render(
    <ReviewLayout
      attempt={attempt} questions={questions} flagged={new Set([4])} current={current}
      elapsedSeconds={42 * 60 + 15} surface={surface} {...props}
    />,
  );
  return props;
}

describe("ReviewLayout", () => {
  it("web: question on the left, review grid in the right column", () => {
    setup("web");
    const main = screen.getByTestId("review-question");
    const aside = screen.getByTestId("review-aside");
    expect(main.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(main).getByText("Câu 37/90")).toBeTruthy();
    expect(within(aside).getByRole("group", { name: "Lưới câu hỏi" })).toBeTruthy();
    expect(within(aside).getByRole("button", { name: "Sai · 9" })).toBeTruthy();
    expect(within(aside).getByRole("button", { name: "Bỏ trống · 3" })).toBeTruthy();
  });

  it("header shows score out of 10, correct/total and time spent", () => {
    setup("web");
    expect(screen.getByText("8,67/10")).toBeTruthy();
    expect(screen.getByText("78/90 câu đúng")).toBeTruthy();
    expect(screen.getByText("Thời gian làm 42:15")).toBeTruthy();
  });

  it("Luyện lại 12 câu starts a local retry with the 12 wrong + skipped indices", () => {
    const { startLocalRetry } = setup("web");
    const retry = screen.getByRole("button", { name: "Luyện lại 12 câu" });
    fireEvent.click(retry);
    expect(startLocalRetry).toHaveBeenCalledWith([6, 11, 14, 22, 30, 36, 47, 53, 65, 76, 80, 87]);
    // The one filled button on the screen.
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(retry.className).toContain("MuiButton-contained");
  });

  it("selecting a cell moves to that question; back returns to the result", () => {
    const { onSelect, onBack } = setup("web");
    fireEvent.click(screen.getByRole("button", { name: "Câu 12, sai" }));
    expect(onSelect).toHaveBeenCalledWith(11);
    fireEvent.click(screen.getByRole("button", { name: "Về kết quả" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("has no XP, no ask-teacher and no common-mistakes line", () => {
    setup("web");
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/XP|Hỏi giáo viên|Lỗi hay gặp|câu sai trước/i);
  });

  it("phone: grid first, tapping a cell opens the detail", () => {
    const { onSelect } = setup("phone", 0);
    expect(screen.queryByTestId("review-question")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Câu 37, sai" }));
    expect(onSelect).toHaveBeenCalledWith(36);
    expect(screen.getByTestId("review-question")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Danh sách câu" }));
    expect(screen.queryByTestId("review-question")).toBeNull();
  });
});
