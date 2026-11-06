import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { QuestionNavigator, type QuestionCell } from "@/components/quiz/question-navigator";

const cells: QuestionCell[] = [
  { index: 2, state: "current", flagged: true },
  { index: 6, state: "todo", flagged: false },
  { index: 11, state: "wrong", flagged: false },
  { index: 12, state: "done", flagged: false, hidden: true },
];

const setup = (legend: "auto" | QuestionCell["state"][] = "auto", onSelect = vi.fn()) => {
  render(<QuestionNavigator cells={cells} legend={legend} onSelect={onSelect} surface="web" />);
  return onSelect;
};

describe("QuestionNavigator grid", () => {
  it("labels each cell with number, state and flag", () => {
    setup();
    expect(screen.getByRole("button", { name: "Câu 3, đang làm, đã đánh dấu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Câu 7, chưa làm" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Câu 12, sai" })).toBeTruthy();
  });

  it("marks only the current cell with aria-current and skips hidden cells", () => {
    setup();
    expect(screen.getByRole("button", { name: /^Câu 3/ }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: /^Câu 7/ }).getAttribute("aria-current")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Câu 13/ })).toBeNull();
  });

  it("calls onSelect with the question index", () => {
    const onSelect = setup();
    fireEvent.click(screen.getByRole("button", { name: /^Câu 7/ }));
    expect(onSelect).toHaveBeenCalledWith(6);
  });

  it("auto legend lists only the states that appear", () => {
    setup();
    const legend = screen.getByRole("list", { name: "Chú thích" });
    expect(legend.textContent).toContain("Đang làm");
    expect(legend.textContent).toContain("Chưa làm");
    expect(legend.textContent).toContain("Sai");
    expect(legend.textContent).toContain("Đánh dấu");
    expect(legend.textContent).not.toContain("Đã làm");
    expect(legend.textContent).not.toContain("Bỏ trống");
  });

  it("an explicit legend lists exactly the given states", () => {
    setup(["done", "todo"]);
    const legend = screen.getByRole("list", { name: "Chú thích" });
    expect(legend.textContent).toContain("Đã làm");
    expect(legend.textContent).not.toContain("Sai");
  });

  it("has no hard-coded legacy navy", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/quiz/question-navigator.tsx"), "utf8");
    expect(source).not.toContain("#000088");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
