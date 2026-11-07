import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MethodsPanel } from "./methods-panel";

describe("MethodsPanel", () => {
  it("lists the supported methods and hides QR and overtime", () => {
    const { container } = render(<MethodsPanel allowOutside={false} onChange={vi.fn()} requireFace />);
    for (const text of ["GPS trong bán kính", "Không ràng buộc mạng", "Khuôn mặt (selfie)", "Cho chấm ngoài vùng kèm lý do", "Điều kiện hợp lệ"]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/60 ngày rồi tự xoá · cần nhân sự đồng ý/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/QR|Làm thêm|\bOT\b/);
  });

  it("maps the switches and the condition choice to the two policy flags", () => {
    const onChange = vi.fn();
    render(<MethodsPanel allowOutside={false} onChange={onChange} requireFace />);
    fireEvent.click(screen.getByRole("switch", { name: "Cho chấm ngoài vùng kèm lý do" }));
    expect(onChange).toHaveBeenLastCalledWith({ allowOutside: true });
    fireEvent.click(screen.getByRole("radio", { name: "Chỉ GPS" }));
    expect(onChange).toHaveBeenLastCalledWith({ requireFace: false });
    fireEvent.click(screen.getByRole("switch", { name: "Khuôn mặt (selfie)" }));
    expect(onChange).toHaveBeenLastCalledWith({ requireFace: false });
  });

  it("derives the condition from requireFace", () => {
    render(<MethodsPanel allowOutside onChange={vi.fn()} requireFace={false} />);
    expect(screen.getByRole("radio", { name: "Chỉ GPS" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "GPS + khuôn mặt" })).toHaveAttribute("aria-checked", "false");
  });
});
