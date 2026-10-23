import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPermissions: vi.fn(),
}));

vi.mock("@/features/access-management/api/access-management-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/access-management/api/access-management-api")>()),
  listPermissions: mocks.listPermissions,
}));

beforeEach(() => {
  mocks.listPermissions.mockReset();
  mocks.listPermissions.mockResolvedValue({ items: [], page: 0, limit: 25, total: 0, totalPages: 0 });
});

test("permission catalog forwards the TanStack Query cancellation signal", async () => {
  const { usePermissionCatalog } = await import("@/features/access-management/hooks/use-access-management");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

  const { result } = renderHook(
    () => usePermissionCatalog("tenant-a", { page: 0, limit: 25 }),
    { wrapper },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mocks.listPermissions).toHaveBeenCalledWith(
    { page: 0, limit: 25 },
    expect.any(AbortSignal),
  );
  client.clear();
});
