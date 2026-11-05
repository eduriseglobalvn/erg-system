import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { HotspotQuestion } from "@/components/quiz/questions/hotspot-question";
import type { Question } from "@/domain/quiz/types";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/platform/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const question: Question = {
  id: "q-hotspot",
  kind: "hotspot",
  title: "Chọn vị trí",
  points: 1,
  feedback: { correct: "", incorrect: "", partial: "" },
  hotspotImage: { url: "data:image/png;base64,AAAA" },
  hotspotAreas: [],
};

describe("HotspotQuestion desktop", () => {
  test("measures a click against the image box, not its frame", () => {
    const onChange = vi.fn();
    render(<HotspotQuestion question={question} value={{}} onChange={onChange} />);

    const box = screen.getByTestId("hotspot-image-box");
    box.getBoundingClientRect = () => ({ left: 100, top: 0, width: 400, height: 200 }) as DOMRect;
    fireEvent.click(box, { clientX: 300, clientY: 50 });

    expect(onChange).toHaveBeenCalledWith({ hotspotPoint: { x: 0.5, y: 0.25 } });
  });
});
