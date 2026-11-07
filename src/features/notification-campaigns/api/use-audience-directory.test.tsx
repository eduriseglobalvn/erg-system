import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { useAudienceDirectory } from "./use-audience-directory";

const api = vi.hoisted(() => ({
  directory: vi.fn(),
  operations: vi.fn(),
  homework: vi.fn(),
  groups: vi.fn(),
}));
vi.mock("@/features/lcms/school-management/api/school-management-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lcms/school-management/api/school-management-api")>()),
  getSchoolDirectory: api.directory,
  getSchoolOperations: api.operations,
}));
vi.mock("@/features/lms/api/lms-teacher-homework-api", () => ({ loadLmsTeacherHomeworkWorkspace: api.homework }));
vi.mock("@/features/lms/api/lms-assignment-command-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/lms/api/lms-assignment-command-api")>()),
  loadLmsStudentGroups: api.groups,
}));
vi.mock("@/platform/auth/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ account: { id: "t1" }, session: { tenantId: "erg" } }),
}));

const schools = Array.from({ length: 25 }, (_, i) => ({ id: `s${i}`, name: `Trường ${i}` }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.directory.mockResolvedValue({ items: schools });
  api.operations.mockImplementation(async (id: string) => ({
    id,
    name: `Trường ${id}`,
    grades: id === "s0" ? ["7", "10"] : ["6"],
    classes: id === "s1" ? [{ id: "c1", name: "8A", grade: "8" }, { id: "c2", name: "6A", grade: "6" }] : [],
  }));
  api.homework.mockResolvedValue({ classOptions: [{ id: "k7b", name: "7B" }, { id: "k7a", name: "7A" }] });
  api.groups.mockResolvedValue({
    groups: [
      { id: "g1", name: "Nhóm Toán", classId: "k7a", studentIds: [], studentCount: 0 },
      { id: "g2", name: "Nhóm Văn", classId: "other", studentIds: [], studentCount: 0 },
    ],
  });
});

test("admin grades are grade codes: union of school grades and class grades, de-duplicated and sorted", async () => {
  const { result } = renderHook(() => useAudienceDirectory("admin", "GRADE"), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.grades).toEqual([
    { id: "6", label: "Khối 6" },
    { id: "7", label: "Khối 7" },
    { id: "8", label: "Khối 8" },
    { id: "10", label: "Khối 10" },
  ]);
  expect(result.current.classes.map((c) => c.id)).toEqual(["c2", "c1"]);
});

test("admin reads operations for at most 20 schools", async () => {
  const { result } = renderHook(() => useAudienceDirectory("admin", "CLASS"), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(api.operations).toHaveBeenCalledTimes(20);
});

test("admin groups load on the lcms session", async () => {
  const { result } = renderHook(() => useAudienceDirectory("admin", "GROUP"), { wrapper });
  await waitFor(() => expect(result.current.groups).toHaveLength(2));
  expect(api.groups).toHaveBeenCalledWith(expect.objectContaining({ portal: "lcms" }), expect.anything());
});

test("teacher classes are the classes they teach; groups only from those classes", async () => {
  const { result } = renderHook(() => useAudienceDirectory("teacher", "GROUP"), { wrapper });
  await waitFor(() => expect(result.current.groups).toHaveLength(1));
  expect(result.current.classes).toEqual([{ id: "k7a", label: "7A" }, { id: "k7b", label: "7B" }]);
  expect(result.current.groups).toEqual([{ id: "g1", label: "Nhóm Toán" }]);
  expect(api.directory).not.toHaveBeenCalled();
  expect(api.groups).toHaveBeenCalledWith(expect.objectContaining({ portal: undefined }), expect.anything());
});
