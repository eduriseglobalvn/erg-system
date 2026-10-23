import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import {
  ErgDialog,
  ErgDrawer,
  ErgErrorState,
  ErgIconButton,
  ErgPageSurface,
  ErgSearchField,
  ErgSkeleton,
  ErgStatusChip,
} from "./index";

function renderWithTheme(ui: React.ReactNode) {
  return render(<ErgMuiProvider>{ui}</ErgMuiProvider>);
}

describe("ERG MUI operational primitives", () => {
  it("renders accessible actions, search, status, feedback, and surfaces", () => {
    const onAction = vi.fn();

    renderWithTheme(
      <ErgPageSurface>
        <ErgIconButton label="Mở bộ lọc" onClick={onAction} />
        <ErgSearchField label="Tìm kiếm" />
        <ErgStatusChip label="Đang hoạt động" status="success" />
        <ErgErrorState description="Không thể tải dữ liệu" title="Có lỗi xảy ra" />
        <ErgSkeleton aria-label="Đang tải dữ liệu" />
      </ErgPageSurface>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở bộ lọc" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", { name: "Tìm kiếm" })).toBeVisible();
    expect(screen.getByText("Đang hoạt động")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể tải dữ liệu");
    expect(screen.getByLabelText("Đang tải dữ liệu")).toBeVisible();
  });

  it("renders dialog and drawer titles with MUI focus-managed overlays", () => {
    const onClose = vi.fn();
    const { rerender } = renderWithTheme(
      <ErgDialog onClose={onClose} open title="Xác nhận giao lịch">
        Nội dung lịch dạy
      </ErgDialog>,
    );

    expect(screen.getByRole("dialog", { name: "Xác nhận giao lịch" })).toBeVisible();
    expect(screen.getByText("Nội dung lịch dạy")).toBeVisible();

    rerender(
      <ErgMuiProvider>
        <ErgDrawer onClose={onClose} open title="Chi tiết giáo viên">
          Thông tin giáo viên
        </ErgDrawer>
      </ErgMuiProvider>,
    );

    expect(screen.getByRole("dialog", { name: "Chi tiết giáo viên" })).toBeVisible();
    expect(screen.getByText("Thông tin giáo viên")).toBeVisible();
  });
});
