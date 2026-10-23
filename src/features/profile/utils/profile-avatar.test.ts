import { describe, expect, test } from "vitest";

import { clampAvatarOffset, getAvatarGeometry } from "@/features/profile/utils/profile-avatar";

describe("profile avatar geometry", () => {
  test("clamps drag offsets inside the crop boundary", () => {
    expect(clampAvatarOffset({ x: 999, y: -999 }, { width: 640, height: 320 }, 1, 320)).toEqual({ x: 160, y: 0 });
  });

  test("keeps the existing cover-scale geometry", () => {
    expect(getAvatarGeometry({ width: 640, height: 320 }, 1, { x: 0, y: 0 }, 320)).toEqual({
      width: 640,
      height: 320,
      offset: { x: 0, y: 0 },
    });
  });
});
