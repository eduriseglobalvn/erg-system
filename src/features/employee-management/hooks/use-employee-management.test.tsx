import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listEmployeeSecurityEvents: vi.fn(),
  listEmployeeSecurityFeed: vi.fn(),
}));

vi.mock("@/features/employee-management/api/employee-management-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/employee-management/api/employee-management-api")>()),
  listEmployeeSecurityEvents: mocks.listEmployeeSecurityEvents,
  listEmployeeSecurityFeed: mocks.listEmployeeSecurityFeed,
}));

beforeEach(() => {
  mocks.listEmployeeSecurityEvents.mockReset();
  mocks.listEmployeeSecurityFeed.mockReset();
  mocks.listEmployeeSecurityFeed.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
});

test("employee timeline reads the unified feed for the selected user", async () => {
  const { useEmployeeSecurityEvents } = await import("@/features/employee-management/hooks/use-employee-management");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

  const { result } = renderHook(() => useEmployeeSecurityEvents("tenant-a", "user-1", 1, 20), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mocks.listEmployeeSecurityFeed).toHaveBeenCalledWith(
    { userId: "user-1", page: 1, limit: 20 },
    expect.any(AbortSignal),
  );
  expect(mocks.listEmployeeSecurityEvents).not.toHaveBeenCalled();
});
