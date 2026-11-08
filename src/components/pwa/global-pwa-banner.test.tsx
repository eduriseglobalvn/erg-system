import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const applyUpdate = vi.fn();
vi.mock("@/hooks/use-service-worker-update", () => ({
  useServiceWorkerUpdate: () => ({ applyUpdate, updateAvailable: true }),
}));
vi.mock("@/components/pwa/outbox-quarantine-notice", () => ({ OutboxQuarantineNotice: () => null }));

import { GlobalPwaBanner } from "./global-pwa-banner";

it("announces the update politely and shows progress while it applies", () => {
  render(<GlobalPwaBanner />);

  const toast = screen.getByRole("status");
  expect(toast).toHaveAttribute("aria-live", "polite");
  expect(toast.textContent).toContain("Có phiên bản mới");
  expect(toast.textContent).toContain("Cập nhật để dùng tính năng mới nhất.");

  fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
  expect(applyUpdate).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: /Đang cập nhật/ })).toBeDisabled();
});
