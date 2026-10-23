import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadAttendanceWorkspace,
  loadGradebookWorkspace,
  upsertAttendance,
  upsertGradebookScore,
} from "@/features/lms/api/lms-academic-record-api";
import { graphQlRequest } from "@/lib/graphql-client";

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-default",
  graphQlRequest: vi.fn(),
}));

const request = vi.mocked(graphQlRequest);

describe("LMS academic-record GraphQL boundary", () => {
  beforeEach(() => request.mockReset());

  it("forwards attendance scope and AbortSignal", async () => {
    const signal = new AbortController().signal;
    request.mockResolvedValueOnce({
      lms: { attendanceWorkspace: { classId: "class-a", from: "2026-07-20", records: [], subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" } },
    });

    await loadAttendanceWorkspace({ classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" }, signal);

    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "LmsAttendanceWorkspace",
      signal,
      tenantId: "tenant-a",
      variables: { input: { classId: "class-a", from: "2026-07-20", subjectId: "math", tenantId: "tenant-a", to: "2026-07-23" } },
    }));
  });

  it("rejects malformed nested attendance and gradebook payloads", async () => {
    request.mockResolvedValueOnce({ lms: { attendanceWorkspace: { records: [] } } });
    await expect(loadAttendanceWorkspace({ classId: "class-a", subjectId: "math" })).rejects.toMatchObject({ code: "INVALID_RESPONSE_SHAPE" });

    request.mockResolvedValueOnce({ lms: { gradebookWorkspace: { columns: [], scores: [] } } });
    await expect(loadGradebookWorkspace({ classId: "class-a", subjectId: "math" })).rejects.toMatchObject({ code: "INVALID_RESPONSE_SHAPE" });
  });

  it("validates both mutation payloads at the transport boundary", async () => {
    request.mockResolvedValueOnce({ upsertAttendance: { id: "attendance-a" } });
    await expect(upsertAttendance({ attendanceDate: "2026-07-20", classId: "class-a", lessonIndex: 1, status: "PRESENT", studentId: "student-a", subjectId: "math" }))
      .rejects.toMatchObject({ code: "INVALID_RESPONSE_SHAPE" });

    request.mockResolvedValueOnce({ upsertGradebookScore: { studentId: "student-a" } });
    await expect(upsertGradebookScore({ classId: "class-a", columnId: "quiz-a", kind: "QUIZ", label: "Quiz", maxScore: 10, score: 8, studentId: "student-a", subjectId: "math" }))
      .rejects.toMatchObject({ code: "INVALID_RESPONSE_SHAPE" });
  });
});
