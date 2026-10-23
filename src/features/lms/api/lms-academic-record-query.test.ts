import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { loadAttendanceWorkspace, loadGradebookWorkspace, upsertAttendance } from "@/features/lms/api/lms-academic-record-api";
import {
  attendanceQueryOptions,
  gradebookQueryOptions,
  lmsAcademicRecordQueryKeys,
  useUpsertAttendanceMutation,
} from "@/features/lms/api/lms-academic-record-query";
import { isPersistableQuery } from "@/lib/query-persistence";
import { MemoryOfflineOutboxStore } from "@/platform/offline";

vi.mock("@/features/lms/api/lms-academic-record-api", () => ({
  loadAttendanceWorkspace: vi.fn(),
  loadGradebookWorkspace: vi.fn(),
  upsertAttendance: vi.fn(),
  upsertGradebookScore: vi.fn(),
}));

describe("LMS academic-record query/cache boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("isolates attendance by tenant, account, class, subject and date range", () => {
    const base = { accountId: "teacher-a", classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" };
    expect(lmsAcademicRecordQueryKeys.attendance(base)).toEqual(["lms", "attendance", "tenant-a", "teacher-a", "class-a", "math", "2026-07-20", "2026-07-23"]);
    expect(lmsAcademicRecordQueryKeys.attendance(base)).not.toEqual(lmsAcademicRecordQueryKeys.attendance({ ...base, accountId: "teacher-b" }));
    expect(lmsAcademicRecordQueryKeys.attendance(base)).not.toEqual(lmsAcademicRecordQueryKeys.attendance({ ...base, from: "2026-07-21" }));
  });

  it("isolates gradebook by authenticated identity and class/subject", () => {
    const base = { accountId: "teacher-a", classId: "class-a", subjectId: "math", tenantId: "tenant-a" };
    expect(lmsAcademicRecordQueryKeys.gradebook(base)).toEqual(["lms", "scores", "tenant-a", "teacher-a", "class-a", "math"]);
    expect(lmsAcademicRecordQueryKeys.gradebook(base)).not.toEqual(lmsAcademicRecordQueryKeys.gradebook({ ...base, subjectId: "science" }));
  });

  it("forwards independent cancellation signals", async () => {
    const attendanceSignal = new AbortController().signal;
    const scoreSignal = new AbortController().signal;
    const scope = { accountId: "teacher-a", classId: "class-a", subjectId: "math", tenantId: "tenant-a" };
    await attendanceQueryOptions({ ...scope, from: "2026-07-20", to: "2026-07-23" }).queryFn({ signal: attendanceSignal });
    await gradebookQueryOptions(scope).queryFn({ signal: scoreSignal });
    expect(loadAttendanceWorkspace).toHaveBeenCalledWith(expect.objectContaining({ classId: "class-a", subjectId: "math" }), attendanceSignal);
    expect(loadGradebookWorkspace).toHaveBeenCalledWith(expect.objectContaining({ classId: "class-a", subjectId: "math" }), scoreSignal);
  });

  it("persists only concrete authenticated academic-record scopes", () => {
    const attendance = lmsAcademicRecordQueryKeys.attendance({ accountId: "teacher-a", classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" });
    const anonymous = lmsAcademicRecordQueryKeys.attendance({ accountId: "anonymous", classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" });
    expect(isPersistableQuery({ queryKey: attendance })).toBe(true);
    expect(isPersistableQuery({ queryKey: anonymous })).toBe(false);
  });

  it("rolls an optimistic attendance edit back when the server rejects it", async () => {
    const scope = { accountId: "teacher-a", classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" };
    const key = lmsAcademicRecordQueryKeys.attendance(scope);
    const previous = { classId: "class-a", from: scope.from, records: [], subjectId: "math", tenantId: "tenant-a", to: scope.to };
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    client.setQueryData(key, previous);
    vi.mocked(upsertAttendance).mockRejectedValueOnce(new Error("conflict"));
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useUpsertAttendanceMutation(scope), { wrapper });

    result.current.mutate({ attendanceDate: "2026-07-20", classId: "class-a", lessonIndex: 1, status: "PRESENT", studentId: "student-a", subjectId: "math", tenantId: "tenant-a" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(key)).toEqual(previous);
  });

  it("keeps an explicitly allowed offline attendance edit pending instead of refetching old server data", async () => {
    const scope = { accountId: "teacher-a", classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" };
    const key = lmsAcademicRecordQueryKeys.attendance(scope);
    const previous = { classId: "class-a", from: scope.from, records: [], subjectId: "math", tenantId: "tenant-a", to: scope.to };
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    client.setQueryData(key, previous);
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useUpsertAttendanceMutation(scope, {
      offline: {
        capability: {
          accountId: "teacher-a",
          capabilityId: "cap-a",
          expiresAt: "2099-01-01T00:00:00.000Z",
          offlineAllowed: true,
          operations: ["attendance.upsert"],
          tenantId: "tenant-a",
          workspace: "TEACHER",
        },
        isOnline: () => false,
        store: new MemoryOfflineOutboxStore(),
      },
    }), { wrapper });

    result.current.mutate({ attendanceDate: "2026-07-20", classId: "class-a", lessonIndex: 1, status: "PRESENT", studentId: "student-a", subjectId: "math", tenantId: "tenant-a" });
    await waitFor(() => expect(result.current.data).toMatchObject({ status: "pending" }));
    expect(client.getQueryData<Awaited<ReturnType<typeof loadAttendanceWorkspace>>>(key)?.records).toHaveLength(1);
    expect(upsertAttendance).not.toHaveBeenCalled();
  });
});
