import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import { ErgPageHeader } from "./erg-page-header";

it("shows title, description, primary action and menu for secondary actions", () => {
  const onExport = vi.fn();
  render(
    <ErgMuiProvider>
      <ErgPageHeader
        description="Mô tả"
        primaryAction={<button type="button">Thêm mới</button>}
        secondaryActions={[{ label: "Xuất Excel", onClick: onExport }]}
        title="Học sinh"
      />
    </ErgMuiProvider>,
  );
  expect(screen.getByRole("heading", { name: "Học sinh" })).toBeInTheDocument();
  expect(screen.getByText("Mô tả")).toBeInTheDocument();
  expect(screen.getByText("Thêm mới")).toBeInTheDocument();
  expect(screen.queryByText("Xuất Excel")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Thao tác khác" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Xuất Excel" }));
  expect(onExport).toHaveBeenCalledOnce();
});

it("hides the menu when there are no secondary actions", () => {
  render(
    <ErgMuiProvider>
      <ErgPageHeader title="Trang" />
    </ErgMuiProvider>,
  );
  expect(screen.queryByRole("button", { name: "Thao tác khác" })).toBeNull();
});
