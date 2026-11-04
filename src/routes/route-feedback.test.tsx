import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AppErrorBoundary, isChunkLoadError, pageReload, pendingBarOffsetMs, releasePendingBar, RouteErrorBoundary, RoutePendingSkeleton } from "@/routes/route-feedback";

const routerMocks = vi.hoisted(() => ({ invalidate: vi.fn() }));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useRouter: () => ({ invalidate: routerMocks.invalidate }),
}));

describe("route feedback", () => {
  beforeEach(() => {
    routerMocks.invalidate.mockReset();
    sessionStorage.clear();
  });

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

  test.each([
    [Object.assign(new Error("x"), { name: "ChunkLoadError" }), true],
    [new TypeError("Failed to fetch dynamically imported module: https://a/b.js"), true],
    [new TypeError("Importing a module script failed."), true],
    [new Error("boom"), false],
  ])("detects chunk load errors: %s", (error, expected) => {
    expect(isChunkLoadError(error)).toBe(expected);
  });

  test("chunk error reloads once automatically, then only via the button", () => {
    const reload = vi.spyOn(pageReload, "run").mockImplementation(() => undefined);
    const error = new TypeError("Failed to fetch dynamically imported module");
    const { unmount } = render(<RouteErrorBoundary error={error} info={{ componentStack: "" }} reset={vi.fn()} />);
    expect(reload).toHaveBeenCalledTimes(1);
    unmount();

    render(<RouteErrorBoundary error={error} info={{ componentStack: "" }} reset={vi.fn()} />);
    expect(reload).toHaveBeenCalledTimes(1); // guard blocks the loop
    fireEvent.click(screen.getByRole("button", { name: "Tải lại trang" }));
    expect(reload).toHaveBeenCalledTimes(2);
    expect(routerMocks.invalidate).not.toHaveBeenCalled();
    reload.mockRestore();
  });

  test("top-level boundary shows a Vietnamese fallback for render errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Boom(): never {
      throw new Error("boom");
    }
    render(<AppErrorBoundary><Boom /></AppErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Ứng dụng gặp sự cố");
    expect(screen.getByRole("button", { name: "Tải lại trang" })).toBeInTheDocument();
    spy.mockRestore();
  });
});
