import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LmsBadge, LmsSelect } from "./lms-ui";

describe("LMS MUI primitives", () => {
  it("contains no Tailwind, lucide, or legacy class merger", () => {
    const source = readFileSync(resolve("src/features/lms/components/lms-ui.tsx"), "utf8");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("@/lib/utils");
  });

  it("renders native-compatible select options and status labels", () => {
    render(<><LmsSelect aria-label="Chọn lớp"><option value="10A">10A</option></LmsSelect><LmsBadge tone="green">Hoạt động</LmsBadge></>);
    expect(screen.getByRole("combobox", { name: "Chọn lớp" })).toBeVisible();
    expect(screen.getByText("Hoạt động")).toBeVisible();
  });
});
