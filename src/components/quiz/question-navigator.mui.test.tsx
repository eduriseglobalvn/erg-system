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
    expect(legend.textContent).not.toContain("Đúng");
    expect(legend.textContent).not.toContain("Bỏ trống");
  });

  it("an explicit legend lists exactly the given states", () => {
    setup(["done", "todo"]);
    const legend = screen.getByRole("list", { name: "Chú thích" });
    expect(legend.textContent).toContain("Đã làm");
    expect(legend.textContent).not.toContain("Sai");
  });

  it("auto legend ignores the filter: hidden cells still count", () => {
    render(<QuestionNavigator cells={[{ index: 0, state: "done", flagged: true, hidden: true }, { index: 1, state: "todo", flagged: false }]} legend="auto" onSelect={vi.fn()} surface="web" />);
    const legend = screen.getByRole("list", { name: "Chú thích" }).textContent;
    expect(legend).toContain("Đã làm");
    expect(legend).toContain("Đánh dấu");
  });

  it("state styles survive the border shorthand (dashed skipped, distinct colours)", () => {
    render(
      <QuestionNavigator
        cells={[
          { index: 0, state: "skipped", flagged: false },
          { index: 1, state: "todo", flagged: false },
          { index: 2, state: "current", flagged: false },
          { index: 3, state: "done", flagged: false },
        ]}
        legend="auto"
        onSelect={vi.fn()}
        surface="web"
      />,
    );
    const style = (n: number) => getComputedStyle(screen.getByRole("button", { name: new RegExp(`^Câu ${n},`) }));
    expect(style(1).borderStyle).toBe("dashed");
    expect(style(2).borderStyle).toBe("solid");
    expect(style(2).borderColor).not.toBe(style(3).borderColor);
    // The current number is ink on white whatever the accent: a light accent must not make it unreadable.
    expect(style(3).color).toBe("rgb(29, 29, 31)");
    // jsdom cannot resolve var(); the done fill is the template accent over the ERG primary.
    expect(style(4).backgroundColor).toBe("var(--quiz-accent, #0071E3)");
  });

  it("flag dot is 10px outer", () => {
    render(<QuestionNavigator cells={[{ index: 0, state: "todo", flagged: true }]} legend="auto" onSelect={vi.fn()} surface="web" />);
    // jsdom ignores pseudo-element styles in getComputedStyle, so read emotion's emitted rule.
    const css = Array.from(document.querySelectorAll("style")).map((el) => el.textContent ?? "").join("");
    const rule = /::after{([^}]*)}/.exec(css)?.[1] ?? "";
    expect(rule).toContain("box-sizing:border-box");
    expect(rule).toContain("width:10px");
    expect(rule).toContain("height:10px");
  });

  it("has no hard-coded legacy navy", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/quiz/question-navigator.tsx"), "utf8");
    expect(source).not.toContain("#000088");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
