import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { MatchingPuzzle, type PuzzleRow } from "./matching-puzzle";

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
  test("Enter connects the piece in its own row", () => {
    const onDrop = setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Mảnh Phải A, dòng 1, chưa ghép" }), { key: "Enter" });
    expect(onDrop).toHaveBeenCalledWith(0, 0);
  });

  test("arrows swap with the neighbouring row, nothing past the edge", () => {
    const onDrop = setup();
    const piece = screen.getByRole("button", { name: /Mảnh Phải A, dòng 1/ });
    fireEvent.keyDown(piece, { key: "ArrowDown" });
    expect(onDrop).toHaveBeenCalledWith(0, 1);
    onDrop.mockClear();
    fireEvent.keyDown(piece, { key: "ArrowUp" });
    expect(onDrop).not.toHaveBeenCalled();
  });

  test("locked ignores every key", () => {
    const onDrop = setup({ locked: true });
    const piece = screen.getByRole("button", { name: /Mảnh Phải A, dòng 1/ });
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
    const grip = screen.getByRole("button", { name: "Kéo vế phải dòng 1, Alt+mũi tên để đổi dòng" });
    fireEvent.keyDown(grip, { key: "ArrowDown" });
    expect(onDrop).not.toHaveBeenCalled();
    fireEvent.keyDown(grip, { key: "ArrowDown", altKey: true });
    expect(onDrop).toHaveBeenCalledWith(0, 1);
  });
});
