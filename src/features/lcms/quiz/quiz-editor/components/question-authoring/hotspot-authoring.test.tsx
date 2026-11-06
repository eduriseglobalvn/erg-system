import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotArea, Question } from "@/domain/quiz/types";
import { QuizImageRejectedError } from "@/lib/media/quiz-image";
import { createNewQuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { buildQuestionSlide } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import { I18nProvider } from "@/platform/i18n";
import { HotspotAuthoring } from "./hotspot-authoring";
import { QuestionCard } from "./question-card";
import { assessQuestionReadiness } from "./question-readiness";
import { readSlideQuestion, readSlideReadiness, writeSlideQuestion } from "./slide-question";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
// The card test is about the card itself; the answer area has its own tests.
vi.mock("./answer-area", () => ({ AnswerArea: () => null }));

const t = ((key: string) => key) as never;
let n = 0;
const slide = () => buildQuestionSlide("hotspot", createNewQuizProjectSettings(), (p) => `${p}-${++n}`);
const fresh = () => readSlideQuestion(slide(), t)!;
const withImage = (areas: HotspotArea[] = []): Question => ({ ...fresh(), title: "Bản đồ", hotspotImage: { url: "map.png", width: 200, height: 100 }, hotspotAreas: areas });
const area = (id: string): HotspotArea => ({ id, shape: "rect", x: 0.1, y: 0.1, width: 0.2, height: 0.2, correct: true });

let latest: Question;
function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  useEffect(() => { latest = q; });
  return <HotspotAuthoring onUpdate={(change) => setQ((current) => change(current))} question={q} />;
}

const canvas = () => screen.getByTestId("hotspot-draw-layer");
const drag = (from: [number, number], to: [number, number]) => {
  fireEvent.pointerDown(canvas(), { clientX: from[0], clientY: from[1], pointerId: 1 });
  fireEvent.pointerMove(canvas(), { clientX: to[0], clientY: to[1], pointerId: 1 });
  fireEvent.pointerUp(canvas(), { clientX: to[0], clientY: to[1], pointerId: 1 });
};
const areas = () => latest.hotspotAreas ?? [];
const png = () => new File(["x"], "a.png", { type: "image/png" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLImageElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect);
});

describe("HotspotAuthoring", () => {
  it("draws a correct rectangle from a drag and selects it", () => {
    render(<Harness start={withImage()} />);
    drag([20, 10], [120, 60]);
    expect(areas()).toHaveLength(1);
    expect(areas()[0]).toMatchObject({ shape: "rect", correct: true });
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(areas()[0][key]).toBeCloseTo({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 }[key]);
    }
    expect(screen.getByRole("button", { name: "Vùng 1 · Đúng" })).toHaveAttribute("aria-pressed", "true");
  });

  it("clamps a drag that leaves the image", () => {
    render(<Harness start={withImage()} />);
    drag([20, 10], [300, 200]);
    expect(areas()[0].width).toBeCloseTo(0.9);
    expect(areas()[0].height).toBeCloseTo(0.9);
  });

  it("adds no area for a tiny drag", () => {
    render(<Harness start={withImage()} />);
    drag([20, 10], [22, 12]);
    expect(areas()).toEqual([]);
  });

  it("draws an ellipse once Elip is chosen", () => {
    render(<Harness start={withImage()} />);
    fireEvent.click(screen.getByRole("button", { name: "Elip" }));
    drag([20, 10], [120, 60]);
    expect(areas()[0].shape).toBe("ellipse");
  });

  it("marks the selected area as a distractor", () => {
    render(<Harness start={withImage()} />);
    drag([20, 10], [120, 60]);
    fireEvent.click(screen.getByRole("button", { name: "Nhiễu" }));
    expect(areas()[0].correct).toBe(false);
    expect(screen.getByRole("button", { name: "Vùng 1 · Nhiễu" })).toBeInTheDocument();
    expect(assessQuestionReadiness(latest, { hasQuestionImage: true }).issues.map((issue) => issue.code)).toContain("no-correct-area");
  });

  it("removes the selected area with Delete", () => {
    render(<Harness start={withImage()} />);
    drag([20, 10], [120, 60]);
    fireEvent.keyDown(screen.getByRole("button", { name: "Vùng 1 · Đúng" }), { key: "Delete" });
    expect(areas()).toEqual([]);
  });

  it("removes the selected area with Xoá vùng", () => {
    render(<Harness start={withImage()} />);
    drag([20, 10], [120, 60]);
    fireEvent.click(screen.getByRole("button", { name: "Xoá vùng" }));
    expect(areas()).toEqual([]);
    expect(screen.queryByRole("toolbar", { name: "Vùng 1" })).not.toBeInTheDocument();
  });

  it("adds an area from the keyboard and focuses its mark", () => {
    render(<Harness start={withImage()} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm vùng" }));
    expect(areas()).toEqual([expect.objectContaining({ shape: "rect", x: 0.35, y: 0.4, width: 0.3, height: 0.2, correct: true })]);
    expect(screen.getByRole("button", { name: "Vùng 1 · Đúng" })).toHaveFocus();
  });

  it("replaces the image with a dropped file and keeps the areas", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,BB", width: 800, height: 400 });
    render(<Harness start={withImage([area("a1"), area("a2")])} />);
    fireEvent.drop(canvas(), { dataTransfer: { files: [png()] } });
    await waitFor(() => expect(latest.hotspotImage).toEqual({ url: "data:image/png;base64,BB", width: 800, height: 400 }));
    expect(areas().map((a) => a.id)).toEqual(["a1", "a2"]);
  });

  it("offers an image slot until the question has an image", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,AA", width: 640, height: 480 });
    const { container } = render(<Harness start={fresh()} />);
    expect(screen.getByRole("button", { name: "Thêm ảnh cho câu hỏi điểm nóng · kéo thả hoặc bấm" })).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(container.querySelector("input[type=file]")!, { target: { files: [png()] } });
    });
    expect(latest.hotspotImage).toEqual({ url: "data:image/png;base64,AA", width: 640, height: 480 });
  });
});

describe("HotspotAuthoring keyboard and pointer edges", () => {
  const mark = (name: string) => screen.getByRole("button", { name });

  it("moves focus to the next mark after Delete, else to the previous one", () => {
    render(<Harness start={withImage([area("a1"), area("a2")])} />);
    fireEvent.click(mark("Vùng 1 · Đúng"));
    fireEvent.keyDown(mark("Vùng 1 · Đúng"), { key: "Delete" });
    expect(areas().map((a) => a.id)).toEqual(["a2"]);
    expect(mark("Vùng 1 · Đúng")).toHaveFocus();
  });

  it("moves focus to the previous mark after Xoá vùng on the last one", () => {
    render(<Harness start={withImage([area("a1"), area("a2")])} />);
    fireEvent.click(mark("Vùng 2 · Đúng"));
    fireEvent.click(screen.getByRole("button", { name: "Xoá vùng" }));
    expect(areas().map((a) => a.id)).toEqual(["a1"]);
    expect(mark("Vùng 1 · Đúng")).toHaveFocus();
  });

  it("moves focus to Thêm vùng when Backspace removes the only area", () => {
    render(<Harness start={withImage([area("a1")])} />);
    fireEvent.click(mark("Vùng 1 · Đúng"));
    fireEvent.keyDown(mark("Vùng 1 · Đúng"), { key: "Backspace" });
    expect(areas()).toEqual([]);
    expect(screen.getByRole("button", { name: "Thêm vùng" })).toHaveFocus();
  });

  it("clears the selection with Escape", () => {
    render(<Harness start={withImage([area("a1")])} />);
    fireEvent.click(mark("Vùng 1 · Đúng"));
    fireEvent.keyDown(mark("Vùng 1 · Đúng"), { key: "Escape" });
    expect(mark("Vùng 1 · Đúng")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("toolbar", { name: "Vùng 1" })).not.toBeInTheDocument();
  });

  it("clears the selection with a click on the empty canvas", () => {
    render(<Harness start={withImage([area("a1")])} />);
    fireEvent.click(mark("Vùng 1 · Đúng"));
    drag([180, 90], [180, 90]);
    expect(mark("Vùng 1 · Đúng")).toHaveAttribute("aria-pressed", "false");
    expect(areas()).toHaveLength(1);
  });

  it("draws nothing with a right-button drag", () => {
    render(<Harness start={withImage()} />);
    fireEvent.pointerDown(canvas(), { button: 2, clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas(), { button: 2, clientX: 120, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(canvas(), { button: 2, clientX: 120, clientY: 60, pointerId: 1 });
    expect(areas()).toEqual([]);
  });

  it("ignores a second pointer while one is drawing", () => {
    render(<Harness start={withImage()} />);
    fireEvent.pointerDown(canvas(), { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerDown(canvas(), { clientX: 100, clientY: 50, pointerId: 2 });
    fireEvent.pointerUp(canvas(), { clientX: 160, clientY: 90, pointerId: 2 });
    expect(areas()).toEqual([]);
    fireEvent.pointerUp(canvas(), { clientX: 120, clientY: 60, pointerId: 1 });
    expect(areas()[0].x).toBeCloseTo(0.1);
    expect(areas()[0].width).toBeCloseTo(0.5);
  });

  it("drops the draft when the pointer capture is lost", () => {
    render(<Harness start={withImage()} />);
    fireEvent.pointerDown(canvas(), { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent(canvas(), new Event("lostpointercapture", { bubbles: true }));
    fireEvent.pointerUp(canvas(), { clientX: 120, clientY: 60, pointerId: 1 });
    expect(areas()).toEqual([]);
  });

  it("replaces the image from Đổi ảnh and keeps the areas", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,CC", width: 300, height: 150 });
    render(<Harness start={withImage([area("a1")])} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Ảnh điểm nóng"), { target: { files: [png()] } });
    });
    expect(latest.hotspotImage).toEqual({ url: "data:image/png;base64,CC", width: 300, height: 150 });
    expect(areas().map((a) => a.id)).toEqual(["a1"]);
  });

  it("says why a rejected file was refused and keeps the image", async () => {
    prepare.mockRejectedValue(new QuizImageRejectedError("type"));
    render(<Harness start={withImage([area("a1")])} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Ảnh điểm nóng"), { target: { files: [png()] } });
    });
    expect(toast.error).toHaveBeenCalledWith(new QuizImageRejectedError("type").message);
    expect(latest.hotspotImage).toEqual({ url: "map.png", width: 200, height: 100 });
  });
});

describe("hotspot card and slide", () => {
  it("has no question image slot on a hotspot card", () => {
    const s = slide();
    render(
      <I18nProvider>
        <QuestionCard meta="" onReplaceSlide={vi.fn()} question={readSlideQuestion(s, t)} readiness={readSlideReadiness(s, t)} slide={s} />
      </I18nProvider>,
    );
    expect(screen.queryByRole("button", { name: /^(Thêm ảnh cho câu hỏi|Ảnh của câu hỏi điểm nóng) · / })).not.toBeInTheDocument();
  });

  it("copies the hotspot image to the slide, which readiness reads", () => {
    const s = slide();
    const next = writeSlideQuestion(s, { ...readSlideQuestion(s, t)!, hotspotImage: { url: "x.png", width: 1, height: 1 } });
    expect(next.media?.src).toBe("x.png");
    expect(readSlideReadiness(next, t).issues.map((issue) => issue.code)).not.toContain("no-image");
  });
});

describe("HotspotAuthoring keyboard", () => {
  const box = (id: string) => areas().find((a) => a.id === id)!;
  const start = () => render(<Harness start={withImage([area("a1")])} />);
  const mark = () => screen.getByRole("button", { name: /^Vùng 1/ });

  it("moves the focused area by 1% and by 5% with Shift", () => {
    start();
    fireEvent.keyDown(mark(), { key: "ArrowRight" });
    expect(box("a1").x).toBeCloseTo(0.11);
    fireEvent.keyDown(mark(), { key: "ArrowDown", shiftKey: true });
    expect(box("a1").y).toBeCloseTo(0.15);
    expect(box("a1").width).toBeCloseTo(0.2);
  });

  it("resizes with Alt+arrows, 1% or 5% with Shift, and never below the drawing minimum", () => {
    start();
    fireEvent.keyDown(mark(), { key: "ArrowRight", altKey: true });
    expect(box("a1").width).toBeCloseTo(0.21);
    fireEvent.keyDown(mark(), { key: "ArrowUp", altKey: true, shiftKey: true });
    expect(box("a1").height).toBeCloseTo(0.15);
    for (let i = 0; i < 6; i++) fireEvent.keyDown(mark(), { key: "ArrowLeft", altKey: true, shiftKey: true });
    expect(box("a1").width).toBeCloseTo(0.02);
  });

  it("keeps the area inside the image", () => {
    start();
    for (let i = 0; i < 4; i++) fireEvent.keyDown(mark(), { key: "ArrowLeft", shiftKey: true });
    expect(box("a1").x).toBe(0);
    for (let i = 0; i < 30; i++) fireEvent.keyDown(mark(), { key: "ArrowRight", shiftKey: true });
    expect(box("a1").x).toBeCloseTo(0.8);
    for (let i = 0; i < 30; i++) fireEvent.keyDown(mark(), { key: "ArrowRight", altKey: true, shiftKey: true });
    expect(box("a1").x + box("a1").width).toBeCloseTo(1);
  });

  it("ignores arrows during IME composition and describes the shortcuts", () => {
    start();
    fireEvent.keyDown(mark(), { key: "ArrowRight", isComposing: true });
    fireEvent.keyDown(mark(), { key: "ArrowRight", keyCode: 229 });
    expect(box("a1").x).toBeCloseTo(0.1);
    expect(mark()).toHaveAccessibleDescription(/mũi tên để di chuyển, Alt \+ mũi tên để đổi cỡ/i);
  });
});
