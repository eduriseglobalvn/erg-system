import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { StatusSelectField } from "./learning-resource-authoring-fields";
import { getPublishStatusLabel, screenKind } from "./learning-resource-authoring-utils";

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

describe("taxonomy hidden status", () => {
  it("sends archived, which the backend accepts for subjects, levels and topics", () => {
    render(<StatusSelectField value="archived" onChange={() => {}} taxonomy />);
    expect(screen.getByRole("combobox").textContent).toBe("Đã ẩn");
  });

  it("keeps hidden for learning resources", () => {
    render(<StatusSelectField value="hidden" onChange={() => {}} />);
    expect(screen.getByRole("combobox").textContent).toBe("Đã ẩn");
  });

  it("labels archived items as hidden", () => {
    expect(getPublishStatusLabel("archived")).toBe("Đã ẩn");
  });
});
