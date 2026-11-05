import { describe, expect, test } from "vitest";

import { pathLeft, pathRight, rowAtPoint } from "./puzzle-geometry";

describe("puzzle paths", () => {
  test("the left piece has its notch in the right edge", () => {
    expect(pathLeft(100, 54)).toContain("V22C93 22 96 17 90 17C84 17 81 21 81 27");
  });

  test("the right piece has its knob on the left edge", () => {
    expect(pathRight(100, 54)).toContain("V32C12 32 15 37 9 37C3 37 0 33 0 27");
  });

  test("both paths are closed", () => {
    for (const path of [pathLeft(100, 54), pathRight(100, 54)]) {
      expect(path.startsWith("M")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
    }
  });

  test("a wider piece keeps the notch 18 px deep", () => {
    expect(pathLeft(300, 54)).toContain(" 281 27");
  });
});

describe("rowAtPoint", () => {
  const rows = [
    { id: "a", top: 0, bottom: 50 },
    { id: "b", top: 64, bottom: 114 },
  ];
  const grid = { left: 0, right: 400, top: 0, bottom: 114 };

  test("picks the row within 7 px of the pointer", () => {
    expect(rowAtPoint({ x: 100, y: 55 }, rows, grid)).toBe("a");
    expect(rowAtPoint({ x: 100, y: 60 }, rows, grid)).toBe("b");
  });

  test("returns null outside the grid", () => {
    expect(rowAtPoint({ x: 450, y: 20 }, rows, grid)).toBeNull();
    expect(rowAtPoint({ x: 100, y: 130 }, rows, grid)).toBeNull();
  });
});
