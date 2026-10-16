import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadLmsAssignmentProgressWorkspace } from "@/features/lms/api/lms-assignment-progress-api";
import { loadLmsClassWorkspace } from "@/features/lms/api/lms-classroom-api";
import { loadLmsLearningResourceLibrary } from "@/features/lms/api/lms-graphql-api";
import { loadLmsTeacherHomeworkWorkspace } from "@/features/lms/api/lms-teacher-homework-api";
import { loadAttendanceWorkspace, loadGradebookWorkspace } from "@/features/lms/api/lms-academic-record-api";
import { graphQlRequest } from "@/lib/graphql-client";

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-default",
  graphQlRequest: vi.fn(),
}));

const graphQlRequestMock = vi.mocked(graphQlRequest);

describe("LMS critical GraphQL runtime boundary", () => {
  beforeEach(() => {
    graphQlRequestMock.mockReset();
  });

  it.each([
    {
      load: () => loadLmsLearningResourceLibrary({ tenantId: "tenant-a" }),
      response: { lms: { learningResourceLibrary: { resources: { items: [] } } } },
    },
    {
      load: () => loadLmsClassWorkspace({ classId: "class-a", tenantId: "tenant-a" }),
      response: { lms: { classWorkspace: { classInfo: { id: "class-a" } } } },
    },
    {
      load: () => loadLmsTeacherHomeworkWorkspace({ tenantId: "tenant-a" }),
      response: { lms: { teacherHomeworkWorkspace: { assignments: { items: [] } } } },
    },
    {
      load: () => loadLmsAssignmentProgressWorkspace({ assignmentId: "assignment-a", tenantId: "tenant-a" }),
      response: { lms: { assignmentProgressWorkspace: { assignment: { id: "assignment-a" } } } },
    },
    {
      load: () => loadAttendanceWorkspace({ classId: "class-a", subjectId: "math", tenantId: "tenant-a" }),
      response: { lms: { attendanceWorkspace: { records: [] } } },
    },
    {
      load: () => loadGradebookWorkspace({ classId: "class-a", subjectId: "math", tenantId: "tenant-a" }),
      response: { lms: { gradebookWorkspace: { columns: [], scores: [] } } },
    },
  ])("rejects a malformed nested workspace payload", async ({ load, response }) => {
    graphQlRequestMock.mockResolvedValueOnce(response);

    await expect(load()).rejects.toMatchObject({
      code: "INVALID_RESPONSE_SHAPE",
      status: 502,
    });
  });
});
