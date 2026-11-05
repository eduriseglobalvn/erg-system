import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { LikertAuthoring } from "./likert-authoring";

const mk = (labels: string[], rows = ["r1"]): Question =>
  ({
    id: "q", kind: "likert_scale", prompt: "", title: "T", points: 1, feedback: { correct: "", incorrect: "", partial: "" },
    likertScale: labels.map((label, i) => ({ id: `scale-${i + 1}`, label, value: i + 1 })),
    likertRows: rows.map((id) => ({ id, label: id })),
  }) as Question;

function Harness({ start }: { start: Question }) {
  const [q, setQ] = useState(start);
  return <LikertAuthoring onChange={setQ} question={q} />;
}

describe("LikertAuthoring", () => {
  it("shows Tự đặt for non-preset labels and does not call onChange on render", () => {
    const onChange = vi.fn();
    render(<LikertAuthoring onChange={onChange} question={mk(["A", "B", "C"])} />);
    expect(screen.getByRole("combobox", { name: "Mẫu nhãn" })).toHaveTextContent("Tự đặt");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("recognises a preset", () => {
    render(<LikertAuthoring onChange={vi.fn()} question={mk(["Không đồng ý", "Đồng ý"])} />);
    expect(screen.getByRole("combobox", { name: "Mẫu nhãn" })).toHaveTextContent("Đồng ý");
  });

  it("disables the stepper at 2 and 7", () => {
    const { unmount } = render(<LikertAuthoring onChange={vi.fn()} question={mk(["a", "b"])} />);
    expect(screen.getByRole("button", { name: "Bớt một mức" })).toBeDisabled();
    unmount();
    render(<LikertAuthoring onChange={vi.fn()} question={mk(["1", "2", "3", "4", "5", "6", "7"])} />);
    expect(screen.getByRole("button", { name: "Thêm một mức" })).toBeDisabled();
  });

  it("steps an old 9-level scale down to 8, keeping the first 8 labels", () => {
    render(<Harness start={mk(["1", "2", "3", "4", "5", "6", "7", "8", "9"])} />);
    fireEvent.click(screen.getByRole("button", { name: "Bớt một mức" }));
    expect(screen.getAllByRole("textbox", { name: /^Nhãn mức/ }).map((el) => (el as HTMLInputElement).value)).toEqual(
      ["1", "2", "3", "4", "5", "6", "7", "8"],
    );
  });

  it("adds a level and a statement", () => {
    render(<Harness start={mk(["a", "b", "c"])} />);
    fireEvent.click(screen.getByRole("button", { name: "Thêm một mức" }));
    expect(screen.getByRole("textbox", { name: "Nhãn mức 4" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Thêm nhận định" }));
    expect(screen.getAllByPlaceholderText("Nhập nhận định")).toHaveLength(2);
  });

  it("Enter in the last statement appends a row; the only row cannot be deleted", () => {
    render(<Harness start={mk(["a", "b"])} />);
    expect(screen.getByRole("button", { name: "Xóa nhận định 1" })).toBeDisabled();
    const input = screen.getAllByPlaceholderText("Nhập nhận định")[0];
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByPlaceholderText("Nhập nhận định")).toHaveLength(2);
  });

  it("editing a header label switches the select to Tự đặt", () => {
    render(<Harness start={mk(["Không đồng ý", "Đồng ý"])} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Nhãn mức 1" }), { target: { value: "Xyz" } });
    expect(screen.getByRole("combobox", { name: "Mẫu nhãn" })).toHaveTextContent("Tự đặt");
  });

  it("follows outside writes: custom labels survive + after the select showed a preset", () => {
    const onChange = vi.fn();
    const { rerender } = render(<LikertAuthoring onChange={onChange} question={mk(["Không đồng ý", "Đồng ý"])} />);
    rerender(<LikertAuthoring onChange={onChange} question={mk(["X", "Y"])} />);
    expect(screen.getByRole("combobox", { name: "Mẫu nhãn" })).toHaveTextContent("Tự đặt");
    fireEvent.click(screen.getByRole("button", { name: "Thêm một mức" }));
    expect(onChange.mock.calls[0][0].likertScale.map((p: { label: string }) => p.label)).toEqual(["X", "Y", ""]);
  });

  it("Enter on an empty last statement does not append a row", () => {
    render(<Harness start={{ ...mk(["a", "b"]), likertRows: [{ id: "r1", label: "" }] } as Question} />);
    fireEvent.keyDown(screen.getAllByPlaceholderText("Nhập nhận định")[0], { key: "Enter" });
    expect(screen.getAllByPlaceholderText("Nhập nhận định")).toHaveLength(1);
  });

  it("picking a preset relabels the levels", () => {
    render(<Harness start={mk(["a", "b", "c"])} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Mẫu nhãn" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Hài lòng"));
    expect(screen.getByRole("textbox", { name: "Nhãn mức 2" })).toHaveValue("Bình thường");
  });
});
