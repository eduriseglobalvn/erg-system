import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import { ErgConfirmDialog } from "./erg-confirm-dialog";

function setup(props: Partial<ComponentProps<typeof ErgConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ErgMuiProvider>
      <ErgConfirmDialog
        confirmLabel="Xoá"
        impact="Ảnh hưởng 6 nhóm quyền / 12 người"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Xoá vai trò?"
        {...props}
      />
    </ErgMuiProvider>,
  );
  return { onConfirm, onCancel };
}

it("shows impact and calls confirm / cancel", () => {
  const { onConfirm, onCancel } = setup();
  expect(screen.getByText("Ảnh hưởng 6 nhóm quyền / 12 người")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
  fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
  expect(onConfirm).toHaveBeenCalledOnce();
  expect(onCancel).toHaveBeenCalledOnce();
});

it("disables both buttons while loading", () => {
  setup({ loading: true, destructive: true });
  expect(screen.getByRole("button", { name: "Xoá" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Huỷ" })).toBeDisabled();
});
