import { describe, expect, it } from "vitest";

import { areaFromDrag, areaToolbarPlacement, toFraction } from "./hotspot-geometry";

describe("hotspot geometry", () => {
  it("clamps a point to the image box", () => {
    expect(toFraction(-10, 500, { left: 0, top: 0, width: 200, height: 100 })).toEqual({ x: 0, y: 1 });
  });

  it("reads a drag in any direction as the box between its ends", () => {
    const area = areaFromDrag({ x: 0.6, y: 0.5 }, { x: 0.2, y: 0.1 })!;
    expect(area.x).toBeCloseTo(0.2);
    expect(area.y).toBeCloseTo(0.1);
    expect(area.width).toBeCloseTo(0.4);
    expect(area.height).toBeCloseTo(0.4);
  });

  it("ignores a drag thinner than the minimum area", () => {
    expect(areaFromDrag({ x: 0.2, y: 0.2 }, { x: 0.21, y: 0.6 })).toBeNull();
  });

  describe("area toolbar placement", () => {
    const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

    it("sits under the area, shifted sideways by its own share so it stays on the image", () => {
      expect(areaToolbarPlacement(box(0, 0.25, 0.5, 0.5))).toEqual({ left: "25%", top: "calc(75% + 4px)", transform: "translateX(-25%)" });
    });

    it("flips above an area near the bottom edge", () => {
      expect(areaToolbarPlacement(box(0.5, 0.5, 0.5, 0.5))).toEqual({ left: "75%", top: "calc(50% - 4px)", transform: "translateX(-75%) translateY(-100%)" });
    });

    it("stays inside an area with no room above or below", () => {
      expect(areaToolbarPlacement(box(0, 0, 1, 1))).toEqual({ left: "50%", top: "calc(100% - 4px)", transform: "translateX(-50%) translateY(-100%)" });
    });
  });
});
