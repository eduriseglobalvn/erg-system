import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const hook = vi.hoisted(() => ({ discard: vi.fn(async () => {}), retry: vi.fn(async () => {}) }));
vi.mock("@/platform/offline", () => ({
  useOutboxQuarantine: () => ({ count: 2, busy: false, retry: hook.retry, discard: hook.discard }),
}));

import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import { OutboxQuarantineNotice } from "./outbox-quarantine-notice";

it("shows the count, retries directly, and deletes only after confirmation", async () => {
  render(
    <ErgMuiProvider>
      <OutboxQuarantineNotice />
    </ErgMuiProvider>,
  );
  expect(screen.getByText("Có 2 thao tác chưa đồng bộ bị lỗi")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(hook.retry).toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
  expect(hook.discard).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }));
  await waitFor(() => expect(hook.discard).toHaveBeenCalled());
});
