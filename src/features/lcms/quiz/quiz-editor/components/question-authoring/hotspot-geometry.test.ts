import { describe, expect, it } from "vitest";

import { areaFromDrag, toFraction } from "./hotspot-geometry";

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
});
