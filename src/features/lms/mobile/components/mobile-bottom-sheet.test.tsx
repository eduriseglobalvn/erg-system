import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MobileBottomSheet } from "./mobile-bottom-sheet";

describe("MobileBottomSheet", () => {
  it("uses a focus-managed MUI drawer without legacy styling", () => {
    const source = readFileSync(resolve("src/features/lms/mobile/components/mobile-bottom-sheet.tsx"), "utf8");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("className=");
  });

  it("renders an accessible dialog and closes from its command", () => {
    const onOpenChange = vi.fn();
    render(
      <MobileBottomSheet open title="Phạm vi giảng dạy" onOpenChange={onOpenChange}>
        Nội dung
      </MobileBottomSheet>,
    );

    expect(screen.getByRole("dialog", { name: "Phạm vi giảng dạy" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
