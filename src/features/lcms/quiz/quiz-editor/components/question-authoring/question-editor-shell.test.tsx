import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import type { QuizEditorGroup, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuestionEditorShell } from "./question-editor-shell";

const choice = (id: string, label: string, correct = false) => ({ id, label, correct });
const ready: QuizEditorSlide = {
  id: "s1",
  title: "2 + 2 = ?",
  kind: "multiple-choice",
  status: "published",
  choices: [choice("a", "4", true), choice("b", "5")],
};
const blank: QuizEditorSlide = {
  id: "s2",
  title: "",
  kind: "multiple-choice",
  options: { shuffleAnswers: true },
  choices: [choice("c", ""), choice("d", ""), choice("e", "")],
};
const third: QuizEditorSlide = { ...ready, id: "s3", title: "3 + 3 = ?" };
const groups: QuizEditorGroup[] = [
  { id: "g1", title: "Phân số", rule: "all", randomCount: 0, slides: [ready, blank] },
  { id: "g2", title: "Số thập phân", rule: "all", randomCount: 0, slides: [third] },
];

function renderShell(overrides: Partial<Parameters<typeof QuestionEditorShell>[0]> = {}) {
  const props = {
    groups,
    selectedSlide: blank,
    onSelectSlide: vi.fn(),
    onReplaceSlide: vi.fn(),
    onAddQuestion: vi.fn(),
    onChangeType: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
    syncChip: <span>sync-chip</span>,
    ...overrides,
  };
  render(
    <I18nProvider>
      <QuestionEditorShell {...props} />
    </I18nProvider>,
  );
  return props;
}

describe("QuestionEditorShell", () => {
  it("counts question slides across all groups in the title bar", () => {
    renderShell();
    expect(screen.getByText("Câu 2 / 3")).toBeInTheDocument();
  });

  it("shows the readiness chip and a missing rail dot for a blank multiple-choice slide", () => {
    renderShell();
    expect(screen.getByText("Chưa có đề bài · còn 2 chỗ khác")).toBeInTheDocument();
    const rail = screen.getByRole("navigation", { name: "Danh sách câu hỏi" });
    const row = within(rail).getByRole("button", { name: /\(Chưa có đề bài\)/ });
    expect(row.querySelector("[data-status]")?.getAttribute("data-status")).toBe("missing");
  });

  it("writes a typed title through onReplaceSlide and leaves options alone", () => {
    const onReplaceSlide = vi.fn();
    renderShell({ onReplaceSlide });
    fireEvent.change(screen.getByPlaceholderText("Nhập đề bài"), { target: { value: "1/2 + 1/2 = ?" } });
    const next = onReplaceSlide.mock.calls.at(-1)![0] as QuizEditorSlide;
    expect(next.title).toBe("1/2 + 1/2 = ?");
    expect(next.options).toBe(blank.options);
  });

  it("hides the rail and runs the quiz in learner view", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Học viên làm" }));
    expect(screen.queryByRole("navigation", { name: "Danh sách câu hỏi" })).toBeNull();
    expect(screen.getByText("Luyện tập")).toBeInTheDocument();
  });

  it("reveals the correct-answer message box", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "+ Khi đúng" }));
    expect(screen.getByRole("textbox", { name: "Lời nhắn khi đúng" })).toBeInTheDocument();
  });

  it("offers exactly three actions in the more menu", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Thêm thao tác" }));
    const menu = screen.getByRole("menu", { name: "Thao tác câu hỏi" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
  });

  it("has exactly one contained button in author mode", () => {
    renderShell();
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });
});
