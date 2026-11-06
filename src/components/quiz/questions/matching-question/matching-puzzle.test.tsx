import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MatchingPuzzle, type PuzzleRow } from "./matching-puzzle";
import { pathLeft, pathRight } from "./puzzle-geometry";

const rows: PuzzleRow[] = ["A", "B", "C"].map((name, index) => ({
  id: `m${index + 1}`,
  pieceId: `r${index + 1}`,
  left: `Trái ${name}`,
  right: `Phải ${name}`,
  rightName: `Phải ${name}`,
  connected: false,
  trailing: index === 0 ? "Ghép đúng" : undefined,
}));

function setup(props: { mode?: "learner" | "author"; locked?: boolean } = {}) {
  const onDrop = vi.fn();
  render(<MatchingPuzzle rows={rows} mode={props.mode ?? "learner"} locked={props.locked} onDrop={onDrop} />);
  return onDrop;
}

describe("MatchingPuzzle learner keys", () => {
  test("row numbers are hidden from screen readers, the piece already names its row", () => {
    setup();
    for (const n of ["1", "2", "3"]) expect(screen.getByText(n)).toHaveAttribute("aria-hidden", "true");
  });

  test("Enter connects the piece in its own row", () => {
    const onDrop = setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Mảnh Phải A, hàng 1, chưa ghép" }), { key: "Enter" });
    expect(onDrop).toHaveBeenCalledWith(0, 0);
  });

  test("arrows swap with the neighbouring row, nothing past the edge", () => {
    const onDrop = setup();
    const piece = screen.getByRole("button", { name: /Mảnh Phải A, hàng 1/ });
    fireEvent.keyDown(piece, { key: "ArrowDown" });
    expect(onDrop).toHaveBeenCalledWith(0, 1);
    onDrop.mockClear();
    fireEvent.keyDown(piece, { key: "ArrowUp" });
    expect(onDrop).not.toHaveBeenCalled();
  });

  test("locked ignores every key", () => {
    const onDrop = setup({ locked: true });
    const piece = screen.getByRole("button", { name: /Mảnh Phải A, hàng 1/ });
    for (const key of ["Enter", " ", "ArrowDown", "ArrowUp"]) fireEvent.keyDown(piece, { key });
    expect(onDrop).not.toHaveBeenCalled();
    expect(piece).toHaveAttribute("aria-disabled", "true");
  });

  test("renders the trailing column", () => {
    setup();
    expect(screen.getByText("Ghép đúng")).toBeInTheDocument();
  });
});

describe("MatchingPuzzle author keys", () => {
  test("Alt+ArrowDown on the grip moves the right side, a plain arrow does not", () => {
    const onDrop = setup({ mode: "author" });
    const grip = screen.getByRole("button", { name: "Kéo vế phải hàng 1, Alt+mũi tên để đổi hàng" });
    fireEvent.keyDown(grip, { key: "ArrowDown" });
    expect(onDrop).not.toHaveBeenCalled();
    fireEvent.keyDown(grip, { key: "ArrowDown", altKey: true });
    expect(onDrop).toHaveBeenCalledWith(0, 1);
  });
});

describe("MatchingPuzzle focus and measurement", () => {
  afterEach(() => vi.restoreAllMocks());

  const swapped = [{ ...rows[0], pieceId: "r2", right: "Phải B", rightName: "Phải B" }, { ...rows[1], pieceId: "r1", right: "Phải A", rightName: "Phải A" }, rows[2]];

  test("focus follows the moved piece to its new row", () => {
    const onDrop = vi.fn();
    const { rerender } = render(<MatchingPuzzle rows={rows} mode="learner" onDrop={onDrop} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /Mảnh Phải A, hàng 1/ }), { key: "ArrowDown" });
    rerender(<MatchingPuzzle rows={swapped} mode="learner" onDrop={onDrop} />);
    expect(screen.getByRole("button", { name: /Mảnh Phải A, hàng 2/ })).toHaveFocus();
  });

  test("a rejected move drops the pending focus", () => {
    const onDrop = vi.fn();
    const { rerender } = render(<MatchingPuzzle rows={rows} mode="learner" onDrop={onDrop} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /Mảnh Phải A, hàng 1/ }), { key: "ArrowDown" });
    rerender(<MatchingPuzzle rows={[...rows]} mode="learner" onDrop={onDrop} />);
    rerender(<MatchingPuzzle rows={swapped} mode="learner" onDrop={onDrop} />);
    expect(screen.getByRole("button", { name: /Mảnh Phải A, hàng 2/ })).not.toHaveFocus();
  });

  test("both pieces of a row are drawn from the measured row height", () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(80);
    const { container } = render(<MatchingPuzzle rows={rows.slice(0, 1)} mode="learner" onDrop={vi.fn()} />);
    const [left, right] = Array.from(container.querySelectorAll("path"), (path) => path.getAttribute("d"));
    expect(left).toBe(pathLeft(200, 80));
    expect(right).toBe(pathRight(200, 80));
  });
});

describe("MatchingPuzzle on a phone with a long answer", () => {
  afterEach(() => vi.restoreAllMocks());

  test("pieces stay within the phone width and the two pieces of a row share a minimum height", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(343);
    const long = "Đáp án rất dài ".repeat(8).slice(0, 120);
    const longRows: PuzzleRow[] = [{ ...rows[0], right: long, rightName: long }, rows[1]];
    const { container } = render(<MatchingPuzzle rows={longRows} mode="learner" onDrop={vi.fn()} />);
    const pieces = Array.from(container.querySelectorAll<HTMLElement>("[data-piece]"));
    expect(pieces).toHaveLength(4);
    for (const piece of pieces) expect(parseInt(getComputedStyle(piece).maxWidth, 10)).toBeLessThanOrEqual(138);
    const [left, right] = pieces;
    expect(getComputedStyle(right).minHeight).toBe(getComputedStyle(left).minHeight);
    expect(getComputedStyle(right).overflowWrap).toBe("anywhere");
  });

  test("without a measured width (no layout) pieces keep the web cap", () => {
    const { container } = render(<MatchingPuzzle rows={rows.slice(0, 1)} mode="learner" onDrop={vi.fn()} />);
    for (const piece of Array.from(container.querySelectorAll<HTMLElement>("[data-piece]"))) expect(getComputedStyle(piece).maxWidth).toBe("380px");
  });
});
