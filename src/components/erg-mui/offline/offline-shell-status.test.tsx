import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OfflineShellStatus,
  resolveOfflineShellStatusCopy,
} from "@/components/erg-mui/offline/offline-shell-status";
import type { NetworkStateSnapshot } from "@/lib/network-quality";

const offlineSnapshot: NetworkStateSnapshot = {
  effectiveType: "4g",
  online: false,
  policy: {
    mode: "minimal",
    preferReducedMedia: true,
    prefetchNonEssential: false,
    preloadRoutes: false,
  },
  quality: "offline",
  saveData: false,
};

describe("OfflineShellStatus", () => {
  it("distinguishes offline, pending and conflict states in accessible copy", () => {
    expect(resolveOfflineShellStatusCopy(offlineSnapshot, { conflictCount: 1, pendingCount: 2 })).toMatchObject({
      description: expect.stringContaining("chưa đồng bộ"),
      severity: "warning",
      title: expect.stringContaining("offline"),
    });
  });

  it("renders a non-blocking live status region", () => {
    render(<OfflineShellStatus conflictCount={1} network={offlineSnapshot} pendingCount={2} />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(/chưa đồng bộ/i)).toBeInTheDocument();
    expect(screen.getByText(/xung đột/i)).toBeInTheDocument();
  });
});
