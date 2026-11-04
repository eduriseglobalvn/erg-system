import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSchoolManagement } from "@/features/lcms/school-management/hooks/use-school-management";

vi.mock("@/features/lcms/school-management/api/school-management-api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getSchoolDirectory: vi.fn().mockResolvedValue({ items: [{ id: "a" }, { id: "b" }] }),
  getSchoolOperations: vi.fn().mockResolvedValue(null),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSchoolManagement selection", () => {
  it("keeps a manual selection until the URL school actually changes", async () => {
    const { result, rerender } = renderHook(({ id }) => useSchoolManagement(id), { initialProps: { id: "a" }, wrapper });
    expect(result.current.selectedSchoolId).toBe("a");

    act(() => result.current.setSelectedSchoolId("b"));
    rerender({ id: "a" });
    await waitFor(() => expect(result.current.selectedSchoolId).toBe("b"));

    rerender({ id: "c" });
    await waitFor(() => expect(result.current.selectedSchoolId).toBe("c"));
  });
});
