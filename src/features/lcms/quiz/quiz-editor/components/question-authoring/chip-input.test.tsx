import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChipInput, type ChipItem } from "./chip-input";

function setup(items: ChipItem[] = []) {
  const onAdd = vi.fn();
  render(<ChipInput inputLabel="Thêm đáp án" items={items} onAdd={onAdd} placeholder="Gõ rồi Enter" />);
  return { onAdd, input: screen.getByRole("textbox", { name: "Thêm đáp án" }) as HTMLInputElement };
}

describe("ChipInput", () => {
  it("adds typed text on Enter and clears the input", () => {
    const { onAdd, input } = setup();
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).toHaveBeenCalledWith("abc");
    expect(input).toHaveValue("");
  });

  it("ignores whitespace-only text", () => {
    const { onAdd, input } = setup();
    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("ignores a duplicate of a chip already shown", () => {
    const { onAdd, input } = setup([{ key: "a", label: "abc", tone: "plain" }]);
    fireEvent.change(input, { target: { value: " abc " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("ignores Enter while an IME is composing", () => {
    const { onAdd, input } = setup();
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("removes a chip from its delete icon", () => {
    const onRemove = vi.fn();
    setup([{ key: "x", label: "x", tone: "correct", onRemove }]);
    fireEvent.click(screen.getByRole("img", { name: "Xoá “x”" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("makes a toggle chip a pressed button", () => {
    const onToggle = vi.fn();
    setup([{ key: "y", label: "y", tone: "plain", pressed: true, onToggle }]);
    const chip = screen.getByRole("button", { name: "y" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
