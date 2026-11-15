import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { BatchRenamePopover } from "./batch-rename-popover";
import { renameErrorMessage } from "./use-rename-batch";

const onCancel = vi.fn();
const onSave = vi.fn();
const onChange = vi.fn();

function open(error: string | null = null) {
  const anchor = document.createElement("button");
  document.body.appendChild(anchor);
  render(<BatchRenamePopover anchorEl={anchor} error={error} label="Đợt 1" onCancel={onCancel} onChange={onChange} onSave={onSave} pending={false} />);
  return screen.getByLabelText("Tên đợt");
}

beforeEach(() => { onCancel.mockReset(); onSave.mockReset(); onChange.mockReset(); });

it("disables save while unchanged and when empty", () => {
  const input = open();
  expect(screen.getByRole("button", { name: "Lưu tên" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "   " } });
  expect(screen.getByRole("button", { name: "Lưu tên" })).toBeDisabled();
});

it("blocks names longer than 80 characters and shows the counter", () => {
  const input = open();
  fireEvent.change(input, { target: { value: "a".repeat(81) } });
  expect(screen.getByText("81/80")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Lưu tên" })).toBeDisabled();
});

it("Enter saves a valid new name and Esc cancels", () => {
  const input = open();
  fireEvent.change(input, { target: { value: "Đợt chính" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onSave).toHaveBeenCalledWith("Đợt chính");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(onCancel).toHaveBeenCalled();
});

it("shows the BATCH_LABEL_TAKEN message and blocks saving", () => {
  const message = "THCS Trương Công Định đã có đợt tên “Đợt 2”. Chọn tên khác.";
  expect(renameErrorMessage(new Error("x"), "THCS Trương Công Định", "Đợt 2")).not.toBe(message);
  const input = open(message);
  expect(screen.getByRole("alert")).toHaveTextContent(message);
  fireEvent.change(input, { target: { value: "Đợt 2" } });
  expect(screen.getByRole("button", { name: "Lưu tên" })).toBeDisabled();
});
