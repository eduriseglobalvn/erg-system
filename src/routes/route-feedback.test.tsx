import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { RouteErrorBoundary, RoutePendingSkeleton } from "@/routes/route-feedback";

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

  test("invalidates route loaders when the user retries", () => {
    render(<RouteErrorBoundary error={new Error("private transport detail")} info={{ componentStack: "" }} reset={vi.fn()} />);

    expect(screen.queryByText("private transport detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(routerMocks.invalidate).toHaveBeenCalledOnce();
  });
});
