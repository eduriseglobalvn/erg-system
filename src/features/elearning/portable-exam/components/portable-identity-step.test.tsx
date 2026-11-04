import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { PortableIdentityStep } from "./portable-identity-step";

const roster = { classes: [{ code: "10A1", students: [{ code: "HS001" }] }] };

function fill(classCode: string, studentCode: string) {
  fireEvent.change(screen.getByLabelText("Mã lớp"), { target: { value: classCode } });
  fireEvent.change(screen.getByLabelText("Mã học sinh"), { target: { value: studentCode } });
  fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
}

it("blocks the exam until class and student code are valid", () => {
  const onConfirm = vi.fn();
  render(<PortableIdentityStep onConfirm={onConfirm} title="Đề 1" />);
  fill("", "");
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.getByText("Nhập mã lớp.")).toBeTruthy();
  expect(screen.getByText("Nhập mã học sinh.")).toBeTruthy();
});

it("confirms a free-text identity when the package has no roster", () => {
  const onConfirm = vi.fn();
  render(<PortableIdentityStep onConfirm={onConfirm} title="Đề 1" />);
  fill("10A1", "HS001");
  expect(onConfirm).toHaveBeenCalledWith({ classCode: "10A1", studentCode: "HS001" });
});

it("validates against the roster when present", () => {
  const onConfirm = vi.fn();
  render(<PortableIdentityStep onConfirm={onConfirm} roster={roster} title="Đề 1" />);
  fill("10A1", "HS999");
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.getByText("Mã học sinh không có trong lớp này.")).toBeTruthy();
  fill("10a1", "hs001");
  expect(onConfirm).toHaveBeenCalledWith({ classCode: "10A1", studentCode: "HS001" });
});
