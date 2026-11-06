import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { AnswerArea } from "./answer-area";
import { assessQuestionReadiness } from "./question-readiness";
import { readSlideQuestion } from "./slide-question";

let n = 0;
const build = (kind: QuestionType) => buildQuestionSlide(kind, createNewQuizProjectSettings(), (p) => `${p}-${++n}`);
const t = ((key: string) => key) as never;

function Harness({ question, kind }: { question: Question; kind: QuestionType }) {
  const [q, setQ] = useState(question);
  return <AnswerArea onChange={setQ} onUpdate={(change) => setQ(change)} question={q} slide={build(kind)} />;
}

describe("AnswerArea", () => {
  window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;

  it("lets two options be marked correct on multiple-response", () => {
    const question = readSlideQuestion(build("multiple-response"), t)!;
    render(<Harness kind="multiple-response" question={question} />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu A là đáp án đúng" }));
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu B là đáp án đúng" }));
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu A là đáp án đúng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu B là đáp án đúng" })).toBeInTheDocument();
  });

  it.each(["fill-in-the-blanks", "select-from-lists", "drag-the-words"] as const)("authors a %s slide in a sentence", (kind) => {
    const question = readSlideQuestion(build(kind), t)!;
    render(<Harness kind={kind} question={question} />);
    expect(screen.getByRole("textbox", { name: "Câu có ô trống" })).toBeInTheDocument();
    expect(screen.queryByTestId("answer-fallback")).toBeNull();
  });

  it("authors a hotspot slide on its own surface", () => {
    const question = readSlideQuestion(build("hotspot"), t)!;
    render(<Harness kind="hotspot" question={question} />);
    expect(screen.getByText("Thêm ảnh cho câu hỏi điểm nóng · kéo thả hoặc bấm")).toBeInTheDocument();
  });

  it("an essay slide renders the marking guide", () => {
    const question = readSlideQuestion(build("essay"), t)!;
    render(<Harness kind="essay" question={question} />);
    expect(screen.getByText("Gợi ý chấm cho giáo viên (học viên không thấy)")).toBeInTheDocument();
    expect(screen.queryByTestId("answer-fallback")).toBeNull();
  });
});

describe.each([
  "multiple-response",
  "true-false",
  "likert-scale",
  "sequence",
  "fill-in-the-blanks",
  "select-from-lists",
  "drag-the-words",
  "short-answer",
  "numeric",
  "matching",
  "drag-and-drop",
  "hotspot",
] as const)("new %s slide", (kind) => {
  it("is not ready and has an answers issue beyond the title", () => {
    const slide = build(kind);
    expect(slide.runtimeQuestion).toBeDefined();
    const readiness = assessQuestionReadiness(readSlideQuestion(slide, t), { hasQuestionImage: false });
    expect(readiness.ready).toBe(false);
    expect(readiness.issues.some((issue) => issue.code !== "title")).toBe(true);
  });
});

it("starts a Likert slide with the 5-level agree preset", () => {
  expect(build("likert-scale").runtimeQuestion!.likertScale!.map((s) => s.label)).toEqual(
    ["Rất không đồng ý", "Không đồng ý", "Trung lập", "Đồng ý", "Rất đồng ý"],
  );
});
