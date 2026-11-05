import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { AnswerArea } from "./answer-area";
import { MatchingAuthoring } from "./matching-authoring";
import { readSlideQuestion } from "./slide-question";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

let n = 0;
const slide = () => buildQuestionSlide("matching", createNewQuizProjectSettings(), (p) => `${p}-${++n}`);
const fresh = () => readSlideQuestion(slide(), ((key: string) => key) as never)!;

let latest: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  useEffect(() => { latest = q; });
  return <MatchingAuthoring onChange={setQ} onUpdate={(change) => setQ((current) => change(current))} question={q} />;
}

const withResponses = (q: Question): Question => ({ ...q, matching: q.matching!.map((p, i) => ({ ...p, response: `r${i + 1}` })) });
const rows = () => screen.getAllByRole("textbox", { name: /^Vế trái dòng/ }).length;

beforeEach(() => vi.clearAllMocks());

describe("MatchingAuthoring", () => {
  it("shows both sides of every row and locks delete at two pairs", () => {
    render(<Harness start={fresh()} />);
    for (const name of ["Vế trái dòng 1", "Vế phải dòng 1", "Vế trái dòng 2", "Vế phải dòng 2"]) {
      expect(screen.getByRole("textbox", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Xoá cặp 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xoá cặp 2" })).toBeDisabled();
  });

  it("writes the typed prompt into the pair", () => {
    render(<Harness start={fresh()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Vế trái dòng 1" }), { target: { value: "Thủ đô" } });
    expect(latest.matching![0].prompt).toBe("Thủ đô");
    expect(latest.matchingResponses).toBeUndefined();
  });

  it("adds a pair, focuses its left side, and deletes again down to two", () => {
    render(<Harness start={fresh()} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm cặp" }));
    expect(rows()).toBe(3);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Vế trái dòng 3" }));
    expect(screen.getByRole("button", { name: "Xoá cặp 1" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Xoá cặp 2" }));
    expect(rows()).toBe(2);
  });

  it("swaps the right sides of rows 1 and 2 with Alt+ArrowDown on the grip", () => {
    render(<Harness start={withResponses(fresh())} />);
    const prompts = latest.matching!.map((p) => p.id);
    fireEvent.keyDown(screen.getByRole("button", { name: /^Kéo vế phải hàng 1,/ }), { key: "ArrowDown", altKey: true });
    expect(latest.matching!.map((p) => p.response)).toEqual(["r2", "r1"]);
    expect(latest.matching!.map((p) => p.id)).toEqual(prompts);
  });

  it("adds a row on Enter in the last right side, but not while composing", () => {
    render(<Harness start={fresh()} />);
    const last = screen.getByRole("textbox", { name: "Vế phải dòng 2" });
    fireEvent.keyDown(last, { key: "Enter", isComposing: true });
    expect(rows()).toBe(2);
    fireEvent.keyDown(last, { key: "Enter" });
    expect(rows()).toBe(3);
  });

  it("puts a picked image on the left piece", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,AA", width: 1, height: 1 });
    render(<Harness start={fresh()} />);
    const file = new File(["x"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Ảnh vế trái dòng 1"), { target: { files: [file] } });
    await waitFor(() => expect(latest.matching![0].promptImage?.url).toBe("data:image/png;base64,AA"));
    expect(screen.getByRole("textbox", { name: "Mô tả ảnh vế trái dòng 1" })).toBeInTheDocument();
  });

  it("never writes on render, even for a keyless new-shape question", () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    const question = {
      ...fresh(),
      matching: [{ id: "p1", prompt: "A" }, { id: "p2", prompt: "B" }],
      matchingResponses: [{ id: "x", response: "one" }, { id: "y", response: "two" }],
    } as Question;
    render(<MatchingAuthoring onChange={onChange} onUpdate={onUpdate} question={question} />);
    expect(screen.getByRole("textbox", { name: "Vế phải dòng 2" })).toHaveValue("two");
    expect(onChange).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe("AnswerArea matching", () => {
  it("authors a matching slide on the puzzle", () => {
    const s = slide();
    function Area() {
      const [q, setQ] = useState(readSlideQuestion(s, ((key: string) => key) as never)!);
      return <AnswerArea onChange={setQ} onUpdate={(change) => setQ(change)} question={q} slide={s} />;
    }
    render(<Area />);
    expect(screen.getByRole("textbox", { name: "Vế trái dòng 1" })).toBeInTheDocument();
    expect(screen.queryByTestId("answer-fallback")).toBeNull();
  });
});
