import { describe, expect, it } from "vitest";

import { screenKind } from "./learning-resource-authoring-utils";

describe("learning resource workspace routing", () => {
  it("keeps the canonical Admin resources route on the resource screen", () => {
    expect(screenKind("resources")).toBe("resources");
    expect(screenKind("structure")).toBe("structure");
  });

  it("keeps legacy aliases on their matching workspace", () => {
    expect(screenKind("admin-learning-resources")).toBe("resources");
    expect(screenKind("admin-learning-structure")).toBe("structure");
    expect(screenKind("admin-learning-resource-list")).toBe("resources");
  });
});
