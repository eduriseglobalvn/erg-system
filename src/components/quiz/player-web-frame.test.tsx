import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KeyHintRow, PlayerWebPage, questionKindLabel } from "@/components/quiz/player-web-frame";

describe("KeyHintRow", () => {
  it("draws leading key tokens as key caps and keeps the full hint as its accessible name", () => {
    const { container } = render(<KeyHintRow hint="1–4 chọn · ← → đổi câu · F đánh dấu" />);
    expect(screen.getByRole("note", { name: "1–4 chọn · ← → đổi câu · F đánh dấu" })).toBeInTheDocument();
    expect([...container.querySelectorAll("kbd")].map((el) => el.textContent)).toEqual(["1", "4", "←", "→", "F"]);
    expect(container.textContent).toContain("đổi câu");
  });
});

describe("PlayerWebPage", () => {
  it("renders the back button, title, meta and a progress line only when asked", () => {
    const onBack = vi.fn();
    const { container, rerender } = render(<PlayerWebPage backLabel="Thoát" meta="Toán 7 · Kiểm tra" title="Bài 1" onBack={onBack}>x</PlayerWebPage>);
    screen.getByRole("button", { name: "Thoát" }).click();
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByText("Toán 7 · Kiểm tra")).toBeInTheDocument();
    expect(container.querySelector("header + [aria-hidden]")).toBeNull();
    rerender(<PlayerWebPage backLabel="Thoát" progress={0.15} title="Bài 1" onBack={onBack}>x</PlayerWebPage>);
    expect(container.querySelector("header + [aria-hidden]")).not.toBeNull();
  });

  it("labels every question kind", () => {
    expect(questionKindLabel("single_choice")).toBe("Một đáp án");
    expect(questionKindLabel("multiple_response")).toBe("Nhiều đáp án");
  });
});
