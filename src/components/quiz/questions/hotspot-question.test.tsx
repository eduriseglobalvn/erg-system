import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { HotspotQuestion } from "@/components/quiz/questions/hotspot-question";
import type { Question } from "@/domain/quiz/types";

const device = vi.hoisted(() => ({ mobile: false }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => device.mobile }));
vi.mock("@/platform/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const question: Question = {
  id: "q-hotspot",
  kind: "hotspot",
  title: "Chọn vị trí",
  points: 1,
  feedback: { correct: "", incorrect: "", partial: "" },
  hotspotImage: { url: "data:image/png;base64,AAAA", width: 400, height: 200 },
  hotspotAreas: [],
};
const area = (id: string, correct: boolean) => ({ id, shape: "rect" as const, x: 0.1, y: 0.1, width: 0.2, height: 0.2, correct });
const withAreas: Question = { ...question, hotspotAreas: [area("right", true), area("decoy", false)] };
const drawnAreas = () => document.querySelectorAll(".border-dashed").length;

describe("HotspotQuestion desktop", () => {
  test("measures a click against the image box, not its frame", () => {
    const onChange = vi.fn();
    render(<HotspotQuestion question={question} value={{}} onChange={onChange} />);

    const box = screen.getByTestId("hotspot-image-box");
    box.getBoundingClientRect = () => ({ left: 100, top: 0, width: 400, height: 200 }) as DOMRect;
    fireEvent.click(box, { clientX: 300, clientY: 50 });

    expect(onChange).toHaveBeenCalledWith({ hotspotPoint: { x: 0.5, y: 0.25 } });
  });

  test("the review draws only the correct areas, never a distractor", () => {
    render(<HotspotQuestion question={withAreas} value={{}} onChange={vi.fn()} reviewMode />);
    expect(drawnAreas()).toBe(1);
  });
});

describe("HotspotQuestion mobile", () => {
  test("the review draws only the correct areas, never a distractor", () => {
    device.mobile = true;
    try {
      render(<HotspotQuestion question={withAreas} value={{}} onChange={vi.fn()} reviewMode />);
      fireEvent.click(screen.getByRole("button", { name: /Chọn vị trí/ }));
      expect(drawnAreas()).toBe(1);
    } finally {
      device.mobile = false;
    }
  });
});
