import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { pendingBarOffsetMs, releasePendingBar, RouteErrorBoundary, RoutePendingSkeleton } from "@/routes/route-feedback";

const routerMocks = vi.hoisted(() => ({ invalidate: vi.fn() }));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useRouter: () => ({ invalidate: routerMocks.invalidate }),
}));

describe("route feedback", () => {
  beforeEach(() => routerMocks.invalidate.mockReset());

  test("exposes an accessible non-blocking pending skeleton", () => {
    render(<RoutePendingSkeleton />);

    expect(screen.getByRole("status", { name: "Đang tải trang" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  test("pending bar continues across back-to-back fallbacks and restarts for a new load", () => {
    const clock = { start: 0, hiddenAt: null as number | null, mounted: 0 };

    expect(pendingBarOffsetMs(1200, clock)).toBe(1200); // continues the index.html boot bar
    clock.mounted += 1;
    releasePendingBar(1500, clock);
    expect(pendingBarOffsetMs(1550, clock)).toBe(1550); // next fallback within 300ms: no jump back
    clock.mounted += 1;
    releasePendingBar(2000, clock);
    expect(pendingBarOffsetMs(9000, clock)).toBe(0); // later navigation starts fresh
  });

  test("invalidates route loaders when the user retries", () => {
    render(<RouteErrorBoundary error={new Error("private transport detail")} info={{ componentStack: "" }} reset={vi.fn()} />);

    expect(screen.queryByText("private transport detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(routerMocks.invalidate).toHaveBeenCalledOnce();
  });
});
