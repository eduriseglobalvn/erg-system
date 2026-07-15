import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  createLmsStudentGroup,
  createLmsAssignment,
  loadLmsStudentGroups,
  updateLmsAssignmentRecipients,
} from "@/features/lms/api/lms-assignment-command-api";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { graphQlRequest } from "@/lib/graphql-client";

vi.mock("@/lib/api-client", () => ({
  apiRequest: vi.fn(),
  hasApiBase: vi.fn(() => true),
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "erg",
  graphQlRequest: vi.fn(),
}));

const apiRequestMock = vi.mocked(apiRequest);
const hasApiBaseMock = vi.mocked(hasApiBase);
const graphQlRequestMock = vi.mocked(graphQlRequest);

describe("lms assignment command API", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockReset();
  });

  test("creates assignment with BE idempotency and distribution payload", async () => {
    apiRequestMock.mockResolvedValueOnce({
      assignmentId: "assignment-a",
      recipientCount: 2,
      resources: [{ quizId: "quiz-a", quizVersionId: "version-a", quizVersionLabel: "v1" }],
    } as never);

    const result = await createLmsAssignment({
      attemptLimit: 2,
      classId: "class-a",
      dueAt: "2026-07-09T10:00:00.000Z",
      idempotencyKey: "assignment-create:key",
      maxDurationMinutes: 45,
      quizIds: ["quiz-a"],
      recipientMode: "class",
      startAt: "2026-07-09T09:00:00.000Z",
      studentIds: ["student-a", "student-b"],
      teacherNote: "Practice",
      title: "IC3 practice",
    });

    expect(result.assignmentId).toBe("assignment-a");
    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lms/assignments", {
      body: JSON.stringify({
        attemptLimit: 2,
        classId: "class-a",
        dueAt: "2026-07-09T10:00:00.000Z",
        groupId: undefined,
        maxDurationMinutes: 45,
        quizIds: ["quiz-a"],
        recipientMode: "class",
        startAt: "2026-07-09T09:00:00.000Z",
        studentIds: ["student-a", "student-b"],
        teacherNote: "Practice",
        title: "IC3 practice",
      }),
      headers: { "X-Idempotency-Key": "assignment-create:key" },
      method: "POST",
      portal: "lms",
    });
  });

  test("updates recipients through the normalized BE endpoint", async () => {
    apiRequestMock.mockResolvedValueOnce({
      assignmentId: "assignment-a",
      recipientCount: 1,
      resources: [],
    } as never);

    await updateLmsAssignmentRecipients({
      assignmentId: "assignment-a",
      recipientMode: "students",
      studentIds: ["student-a"],
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lms/assignments/assignment-a/recipients", {
      body: JSON.stringify({
        classId: undefined,
        groupId: undefined,
        recipientMode: "students",
        studentIds: ["student-a"],
      }),
      method: "PUT",
      portal: "lms",
    });
  });

  test("creates student group with UI metadata persisted by BE", async () => {
    apiRequestMock.mockResolvedValueOnce({
      classId: "class-a",
      color: "#0ea5e9",
      groupId: "group-a",
      name: "Group A",
      note: "Support group",
      studentCount: 1,
    } as never);

    await createLmsStudentGroup({
      classId: "class-a",
      color: "#0ea5e9",
      name: "Group A",
      note: "Support group",
      studentIds: ["student-a"],
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/lms/student-groups", {
      body: JSON.stringify({
        classId: "class-a",
        color: "#0ea5e9",
        name: "Group A",
        note: "Support group",
        studentIds: ["student-a"],
      }),
      method: "POST",
      portal: "lms",
    });
  });

  test("loads student groups through the LMS GraphQL read model", async () => {
    graphQlRequestMock.mockResolvedValueOnce({
      lms: {
        studentGroups: {
          groups: [{
            classId: "class-a",
            color: "#0ea5e9",
            createdAt: "2026-07-09T01:00:00Z",
            id: "group-a",
            name: "Group A",
            note: "Support group",
            ownerUserId: "teacher-a",
            studentCount: 2,
            studentIds: ["student-a", "student-b"],
            updatedAt: "2026-07-09T02:00:00Z",
          }],
          tenantId: "erg",
        },
      },
    });

    const result = await loadLmsStudentGroups({ classId: "class-a", tenantId: "erg" });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.note).toBe("Support group");
    expect(result.groups[0]?.color).toBe("#0ea5e9");
    expect(result.groups[0]?.studentIds).toEqual(["student-a", "student-b"]);
    expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "LmsStudentGroups",
      portal: "lms",
      tenantId: "erg",
      variables: {
        classId: "class-a",
        tenantId: "erg",
      },
    }));
  });

  test("returns empty student groups when no API base is configured", async () => {
    hasApiBaseMock.mockReturnValue(false);

    await expect(loadLmsStudentGroups({ tenantId: "erg" })).resolves.toEqual({
      groups: [],
      tenantId: "erg",
    });
    expect(graphQlRequestMock).not.toHaveBeenCalled();
  });
});
