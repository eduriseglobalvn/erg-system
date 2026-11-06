import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DragWordsQuestion } from "@/components/quiz/questions/drag-words-question";
import { InlineChoiceQuestion } from "@/components/quiz/questions/inline-choice-question";
import type { Question } from "@/domain/quiz/types";
import { I18nProvider } from "@/platform/i18n/i18n-provider";

const base = { id: "q", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" } };
const wrap = (node: ReactElement) => render(<I18nProvider>{node}</I18nProvider>);
// React useId values differ per render; they are not part of the layout.
const html = (node: ReactElement) => {
  const view = wrap(node);
  const out = view.container.innerHTML.replace(/id="[^"]*"/g, "");
  view.unmount();
  return out;
};
const props = { value: {}, onChange: vi.fn() };

describe("text after the last blank", () => {
  window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;

  const inline = (suffix?: string): Question => ({
    ...base,
    kind: "inline_choice",
    inlineBlanks: [{ id: "b", statement: "Đây là", options: ["a", "b"], correctOptionId: "a", selectPosition: "after", suffix }],
  });
  const drag = (suffix?: string): Question => ({
    ...base,
    kind: "drag_words",
    wordBank: [{ id: "w", label: "từ" }],
    wordSlots: [{ id: "s", label: "Đây là", correctWordId: "w", suffix }],
  });

  it("shows the suffix on select-from-lists", () => {
    const { container } = wrap(<InlineChoiceQuestion {...props} question={inline(" để đếm.")} />);
    expect(container.textContent).toContain("để đếm.");
  });

  it("shows the suffix on drag-the-words", () => {
    const { container } = wrap(<DragWordsQuestion {...props} question={drag("để đếm.")} />);
    expect(container.textContent).toContain("để đếm.");
  });

  it("renders the same DOM without a suffix as with an empty one", () => {
    expect(html(<InlineChoiceQuestion {...props} question={inline()} />)).toBe(html(<InlineChoiceQuestion {...props} question={inline("")} />));
    expect(html(<DragWordsQuestion {...props} question={drag()} />)).toBe(html(<DragWordsQuestion {...props} question={drag("")} />));
  });
});
