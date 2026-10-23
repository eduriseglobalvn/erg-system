import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ReportsPanel } from "./reports-panel";

describe("ReportsPanel", () => {
  it("uses MUI instead of Tailwind", () => {
    const source = readFileSync(resolve("src/features/lms/components/reports-panel.tsx"), "utf8");
    expect(source).not.toContain("className=");
  });

  it("renders the current school metrics", () => {
    render(<ReportsPanel selectedSchoolName="ERG School" />);
    expect(screen.getByText("ERG School")).toBeVisible();
    expect(screen.getByText("Trường")).toBeVisible();
  });
});
