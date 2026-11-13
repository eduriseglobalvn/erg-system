import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { studentDashboardQueryKeys } from "@/features/elearning/student-dashboard/api/student-dashboard-query";
import { useStudentPushRefresh } from "@/features/elearning/student-dashboard/hooks/use-student-push-refresh";

const serviceWorker = new EventTarget();
Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });

function push(payload: Record<string, unknown>, type = "erg:notification-push") {
  serviceWorker.dispatchEvent(new MessageEvent("message", { data: { type, payload } }));
}

function setup() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const view = renderHook(() => useStudentPushRefresh(), {
    wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children),
  });
  return { invalidate, view };
}

afterEach(() => vi.restoreAllMocks());

describe("useStudentPushRefresh", () => {
  it("reloads the student dashboard when a student push arrives (e.g. a new assignment)", () => {
    const { invalidate } = setup();
    push({ portal: "ELEARNING" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: studentDashboardQueryKeys.root });
  });

  it("ignores teacher pushes, other messages and stops after unmount", () => {
    const { invalidate, view } = setup();
    push({ portal: "lms" });
    push({}, "other");
    view.unmount();
    push({ portal: "elearning" });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
