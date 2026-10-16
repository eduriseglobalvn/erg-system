import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("@/features/lcms/integrations/learning-standards/api/learning-standards-query", () => ({
  useLearningStandardsScope: () => ({ tenantId: "tenant-a", accountId: "student-a", workspace: "STUDENT", portal: "elearning" }),
  useLaunchLearningStandardPackage: () => ({ isPending: false, mutateAsync }),
}));

import { LearningStandardPlayerPanel } from "@/features/elearning/content-player/learning-standard-player-panel";

beforeEach(() => vi.clearAllMocks());

test("launches only after the server confirms the package and exposes its relative path", async () => {
  mutateAsync.mockResolvedValueOnce({ id: "pkg-1", status: "READY", launchPath: "index.html" });
  const onLaunchResolved = vi.fn();

  render(<LearningStandardPlayerPanel onLaunchResolved={onLaunchResolved} packageId="pkg-1" title="SCORM lesson" />);
  fireEvent.click(screen.getByRole("button", { name: /mở nội dung/i }));

  expect(await screen.findByText(/Backend đã xác nhận package/)).toBeInTheDocument();
  expect(screen.getByText("index.html")).toBeInTheDocument();
  expect(onLaunchResolved).toHaveBeenCalledWith(expect.objectContaining({ id: "pkg-1", status: "READY" }));
  expect(mutateAsync).toHaveBeenCalledWith({ packageId: "pkg-1" });
});

test("does not persist or place launch material in a URL", () => {
  render(<LearningStandardPlayerPanel packageId="pkg-1" />);
  expect(window.location.search).toBe("");
  expect(screen.queryByRole("iframe")).not.toBeInTheDocument();
});
