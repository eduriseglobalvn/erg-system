import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileQuestionSheet } from "@/components/quiz/mobile-player-question-sheet";
import { buildTakingCells } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";

const cells = buildTakingCells(90, new Set([0, 1, 2]), new Set([5]), 60);

afterEach(() => {
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});

function setup(overrides: Partial<Parameters<typeof MobileQuestionSheet>[0]> = {}) {
  const props = { cells, onJumpToQuestion: vi.fn(), onRequestSubmit: vi.fn(), ...overrides };
  render(<MobileQuestionSheet {...props} />);
  return props;
}

describe("MobileQuestionSheet", () => {
  it("the trigger reads Câu n/N", () => {
    setup();
    expect(screen.getByRole("button", { name: "Câu 61/90" })).toBeInTheDocument();
  });

  it("opens a bottom sheet and centres the current cell", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Câu 61/90" }));

    const current = screen.getByRole("button", { name: /^Câu 61, đang làm/ });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    expect(scrollIntoView.mock.contexts[0]).toBe(current);
    const paper = document.querySelector(".MuiDrawer-paper") as HTMLElement;
    expect(getComputedStyle(paper).maxHeight).toBe("80vh");
    expect(getComputedStyle(paper).bottom).toBe("0px");
  });

  it("lists the questions with the phone grid and jumps then closes", () => {
    const { onJumpToQuestion } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Câu 61/90" }));
    expect(within(screen.getByRole("navigation", { name: "Danh sách câu hỏi" })).getByRole("button", { name: "Tất cả · 90" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Câu 10,/ }));
    expect(onJumpToQuestion).toHaveBeenCalledWith(9);
  });

  it("Nộp bài asks to submit", () => {
    const { onRequestSubmit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Câu 61/90" }));
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(onRequestSubmit).toHaveBeenCalledTimes(1);
  });

  it("has no Nộp bài when submitting is not offered (practice mode)", () => {
    setup({ onRequestSubmit: undefined });
    fireEvent.click(screen.getByRole("button", { name: "Câu 61/90" }));
    expect(screen.queryByRole("button", { name: "Nộp bài" })).toBeNull();
    expect(screen.getByRole("button", { name: "Làm tiếp" })).toBeInTheDocument();
  });
});
