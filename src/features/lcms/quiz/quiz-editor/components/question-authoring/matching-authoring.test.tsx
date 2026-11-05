import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { AnswerArea } from "./answer-area";
import { MatchingAuthoring } from "./matching-authoring";
import { assessQuestionReadiness } from "./question-readiness";
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

const withPairs = (count: number): Question => ({
  ...fresh(),
  matching: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, prompt: `P${i + 1}`, response: `r${i + 1}` })),
});
const keyless = (): Question => ({
  ...fresh(),
  matching: [{ id: "p1", prompt: "A" }, { id: "p2", prompt: "B" }],
  matchingResponses: [{ id: "x", response: "one" }, { id: "y", response: "two" }],
});
const rows = () => screen.getAllByRole("textbox", { name: /^Vế trái hàng/ }).length;
const codes = () => assessQuestionReadiness(latest, { hasQuestionImage: false }).issues.map((issue) => issue.code);
const png = () => new File(["x"], "a.png", { type: "image/png" });
const deferImage = () => {
  let resolve!: () => void;
  prepare.mockReturnValue(new Promise((done) => { resolve = () => done({ dataUrl: "data:image/png;base64,NEW", width: 1, height: 1 }); }));
  return () => act(async () => resolve());
};

beforeEach(() => vi.clearAllMocks());

describe("MatchingAuthoring", () => {
  it("shows both sides of every row and locks delete at two pairs", () => {
    render(<Harness start={fresh()} />);
    for (const name of ["Vế trái hàng 1", "Vế phải hàng 1", "Vế trái hàng 2", "Vế phải hàng 2"]) {
      expect(screen.getByRole("textbox", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Xoá cặp 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xoá cặp 2" })).toBeDisabled();
    // A short piece shrinks to its text instead of the default 20 columns.
    expect(screen.getByRole("textbox", { name: "Vế trái hàng 1" })).toHaveAttribute("cols", "1");
  });

  it("writes the typed prompt into the pair", () => {
    render(<Harness start={fresh()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Vế trái hàng 1" }), { target: { value: "Thủ đô" } });
    expect(latest.matching![0].prompt).toBe("Thủ đô");
    expect(latest.matchingResponses).toBeUndefined();
  });

  it("adds a pair, focuses its left side, and deletes again down to two", () => {
    render(<Harness start={fresh()} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm cặp" }));
    expect(rows()).toBe(3);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Vế trái hàng 3" }));
    expect(screen.getByRole("button", { name: "Xoá cặp 1" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Xoá cặp 2" }));
    expect(rows()).toBe(2);
  });

  it("moves focus to the next row after a delete, or the previous one for the last row", () => {
    render(<Harness start={withPairs(4)} />);
    fireEvent.click(screen.getByRole("button", { name: "Xoá cặp 2" }));
    expect(document.activeElement).toHaveValue("P3");
    fireEvent.click(screen.getByRole("button", { name: "Xoá cặp 3" }));
    expect(document.activeElement).toHaveValue("P3");
  });

  it("swaps the right sides of rows 1 and 2 with Alt+ArrowDown on the grip", () => {
    render(<Harness start={withPairs(2)} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /^Kéo vế phải hàng 1,/ }), { key: "ArrowDown", altKey: true });
    expect(latest.matching!.map((p) => [p.id, p.prompt, p.response])).toEqual([["p1", "P1", "r2"], ["p2", "P2", "r1"]]);
  });

  it("adds a row on Enter in the last right side, but not while composing", () => {
    render(<Harness start={fresh()} />);
    const last = screen.getByRole("textbox", { name: "Vế phải hàng 2" });
    fireEvent.keyDown(last, { key: "Enter", isComposing: true });
    fireEvent.keyDown(last, { key: "Enter", keyCode: 229 });
    expect(rows()).toBe(2);
    fireEvent.keyDown(last, { key: "Enter" });
    expect(rows()).toBe(3);
  });

  it("puts a picked image on the left piece", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,AA", width: 1, height: 1 });
    render(<Harness start={fresh()} />);
    fireEvent.change(screen.getByLabelText("Ảnh vế trái hàng 1"), { target: { files: [png()] } });
    await waitFor(() => expect(latest.matching![0].promptImage?.url).toBe("data:image/png;base64,AA"));
    expect(screen.getByRole("textbox", { name: "Mô tả ảnh vế trái hàng 1" })).toBeInTheDocument();
  });

  it("keeps the alt text typed while a new image loads", async () => {
    const finish = deferImage();
    const start = withPairs(2);
    start.matching![0].promptImage = { url: "old", alt: "" };
    render(<Harness start={start} />);
    fireEvent.change(screen.getByLabelText("Ảnh vế trái hàng 1"), { target: { files: [png()] } });
    fireEvent.change(screen.getByRole("textbox", { name: "Mô tả ảnh vế trái hàng 1" }), { target: { value: "Bản đồ" } });
    await finish();
    expect(latest.matching![0].promptImage).toEqual({ url: "data:image/png;base64,NEW", alt: "Bản đồ" });
  });

  it("lands a right image on its response even if the response moved rows while it loaded", async () => {
    const finish = deferImage();
    render(<Harness start={withPairs(2)} />);
    fireEvent.change(screen.getByLabelText("Ảnh vế phải hàng 1"), { target: { files: [png()] } });
    fireEvent.keyDown(screen.getByRole("button", { name: /^Kéo vế phải hàng 1,/ }), { key: "ArrowDown", altKey: true });
    await finish();
    expect(latest.matching!.map((p) => [p.response, p.responseImage?.url])).toEqual([["r2", undefined], ["r1", "data:image/png;base64,NEW"]]);
  });

  it("writes a keyed question back in the old shape, aligned by its key", () => {
    const start = { ...keyless(), matchingKey: { p1: "y", p2: "x" } };
    render(<Harness start={start} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Vế trái hàng 1" }), { target: { value: "A2" } });
    expect(latest.matching!.map((p) => [p.id, p.prompt, p.response])).toEqual([["p1", "A2", "two"], ["p2", "B", "one"]]);
    expect(latest.matchingResponses).toBeUndefined();
    expect(latest.matchingKey).toBeUndefined();
  });

  it("keeps a keyless question unconfirmed through edits and swaps until the teacher confirms", () => {
    render(<Harness start={keyless()} />);
    expect(screen.getByText("Chưa rõ cặp nào đúng. Kéo mảnh phải về đúng hàng.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Vế trái hàng 1" }), { target: { value: "A2" } });
    expect(codes()).toContain("pair-key");
    fireEvent.keyDown(screen.getByRole("button", { name: /^Kéo vế phải hàng 1,/ }), { key: "ArrowDown", altKey: true });
    expect(codes()).toContain("pair-key");
    expect(latest.matchingResponses!.map((r) => r.response)).toEqual(["two", "one"]);
    fireEvent.click(screen.getByRole("button", { name: "Các cặp đã đúng" }));
    expect(codes()).not.toContain("pair-key");
    expect(latest.matching!.map((p) => [p.prompt, p.response])).toEqual([["A2", "two"], ["B", "one"]]);
    expect(latest.matchingResponses).toBeUndefined();
    expect(latest.matchingKey).toBeUndefined();
    expect(screen.queryByRole("button", { name: "Các cặp đã đúng" })).toBeNull();
  });

  it("never writes on render, even for a keyless new-shape question", () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(<MatchingAuthoring onChange={onChange} onUpdate={onUpdate} question={keyless()} />);
    expect(screen.getByRole("textbox", { name: "Vế phải hàng 2" })).toHaveValue("two");
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
    expect(screen.getByRole("textbox", { name: "Vế trái hàng 1" })).toBeInTheDocument();
    expect(screen.queryByTestId("answer-fallback")).toBeNull();
  });
});
