import { describe, expect, it } from "vitest";

import { likertPresetLabels, resizeLikertScale } from "./likert-presets";

const point = (n: number, label: string) => ({ id: `scale-${n}`, label, value: n });
const five = ["A", "B", "C", "D", "E"].map((l, i) => point(i + 1, l));

describe("likert presets", () => {
  it("agree/5 matches the table", () => {
    expect(likertPresetLabels("agree", 5)).toEqual(["Rất không đồng ý", "Không đồng ý", "Trung lập", "Đồng ý", "Rất đồng ý"]);
  });

  it("custom 5 -> 3 keeps the first labels and ids, values 1-3", () => {
    expect(resizeLikertScale(five, 3, "custom")).toEqual(five.slice(0, 3));
  });

  it("custom 3 -> 5 adds two empty labels and keeps ids", () => {
    const out = resizeLikertScale(five.slice(0, 3), 5, "custom");
    expect(out.map((p) => p.id)).toEqual(["scale-1", "scale-2", "scale-3", "scale-4", "scale-5"]);
    expect(out.map((p) => p.label)).toEqual(["A", "B", "C", "", ""]);
    expect(out.map((p) => p.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it("new ids skip ids already in use", () => {
    const out = resizeLikertScale([point(1, "A"), { id: "scale-3", label: "C", value: 2 }], 4, "custom");
    expect(out.map((p) => p.id)).toEqual(["scale-1", "scale-3", "scale-2", "scale-4"]);
  });

  it("clamps count to 2..7 for presets", () => {
    expect(resizeLikertScale([point(1, "A")], 1, "agree")).toHaveLength(2);
    const nine = Array.from({ length: 9 }, (_, i) => point(i + 1, "x"));
    expect(resizeLikertScale(nine, 9, "agree")).toHaveLength(7);
  });

  it("custom shrinks an old 9-level scale one level at a time", () => {
    const nine = Array.from({ length: 9 }, (_, i) => point(i + 1, `L${i + 1}`));
    expect(resizeLikertScale(nine, 8, "custom")).toEqual(nine.slice(0, 8));
  });

  it("a preset replaces labels but keeps ids", () => {
    const out = resizeLikertScale(five, 3, "satisfied");
    expect(out.map((p) => p.label)).toEqual(["Không hài lòng", "Bình thường", "Hài lòng"]);
    expect(out.map((p) => p.id)).toEqual(["scale-1", "scale-2", "scale-3"]);
  });
});
