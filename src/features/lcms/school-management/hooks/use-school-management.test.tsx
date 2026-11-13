import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSchoolManagement } from "@/features/lcms/school-management/hooks/use-school-management";
import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";

vi.mock("@/features/lcms/school-management/api/school-management-api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getSchoolDirectory: vi.fn().mockResolvedValue({ items: [{ id: "a" }, { id: "b" }] }),
  getSchoolOperations: vi.fn().mockResolvedValue(null),
  bulkEnrollSchoolStudents: vi.fn().mockResolvedValue({ items: [] }),
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

describe("useSchoolManagement roster changes", () => {
  it("drops the teacher class workspace cache so the class list shows the new roster at once", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useSchoolManagement("a"), {
      wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });

    await act(() => result.current.enrollStudentsInClass(["s1"], "c1"));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: lmsAssignmentReadQueryKeys.classWorkspaceRoot });
  });
});
