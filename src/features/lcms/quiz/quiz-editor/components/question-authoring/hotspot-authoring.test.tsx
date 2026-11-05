import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotArea, Question } from "@/domain/quiz/types";
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
  return <HotspotAuthoring onChange={setQ} onUpdate={(change) => setQ((current) => change(current))} question={q} />;
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
