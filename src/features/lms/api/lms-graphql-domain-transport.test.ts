import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadLmsAssignmentProgressWorkspace } from "@/features/lms/api/lms-assignment-progress-api";
import { loadLmsClassWorkspace } from "@/features/lms/api/lms-classroom-api";
import { loadLmsLearningResourceLibrary } from "@/features/lms/api/lms-graphql-api";
import { loadLmsTeacherHomeworkWorkspace } from "@/features/lms/api/lms-teacher-homework-api";
import { graphQlRequest } from "@/lib/graphql-client";

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-default",
  graphQlRequest: vi.fn(),
}));

const graphQlRequestMock = vi.mocked(graphQlRequest);

const emptyPage = {
  hasNext: false,
  hasPrevious: false,
  items: [],
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
};

describe("LMS GraphQL domain transport", () => {
  beforeEach(() => {
    graphQlRequestMock.mockReset();
  });

  it("sends resource-library input through the LMS operation with tenant scope", async () => {
    const signal = new AbortController().signal;
    graphQlRequestMock.mockResolvedValueOnce({
      lms: {
        learningResourceLibrary: {
          progress: [],
          recentOpened: [],
          resources: emptyPage,
          taxonomyTree: [],
        },
      },
    });

    await loadLmsLearningResourceLibrary({ subjectId: "math", tenantId: "tenant-a" }, signal);

    expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "LmsLearningResourceLibrary",
      portal: "lms",
      signal,
      tenantId: "tenant-a",
      variables: { input: { subjectId: "math", tenantId: "tenant-a" } },
    }));
  });

  it("sends class-workspace input through its own LMS operation", async () => {
    const signal = new AbortController().signal;
    graphQlRequestMock.mockResolvedValueOnce({
      lms: {
        classWorkspace: {
          assignments: emptyPage,
          classInfo: { id: "class-1" },
          students: emptyPage,
        },
      },
    });

    await loadLmsClassWorkspace({ classId: "class-1", tenantId: "tenant-b" }, signal);

    expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "LmsClassWorkspace",
      portal: "lms",
      signal,
      tenantId: "tenant-b",
      variables: { input: { classId: "class-1", tenantId: "tenant-b" } },
    }));
  });

  it("uses the default tenant for teacher-homework input", async () => {
    const signal = new AbortController().signal;
    graphQlRequestMock.mockResolvedValueOnce({
      lms: {
        teacherHomeworkWorkspace: {
          assignments: emptyPage,
          classOptions: [],
          overdueStudents: emptyPage,
          pendingReviews: emptyPage,
          summary: {},
        },
      },
    });

    await loadLmsTeacherHomeworkWorkspace({ status: "active" }, signal);

    expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "LmsTeacherHomeworkWorkspace",
      portal: "lms",
      signal,
      tenantId: "tenant-default",
      variables: { input: { status: "active", tenantId: "tenant-default" } },
    }));
  });

  it("sends assignment progress through the assignment operation", async () => {
    const signal = new AbortController().signal;
    graphQlRequestMock.mockResolvedValueOnce({
      lms: {
        assignmentProgressWorkspace: {
          assignment: { id: "asg-1" },
          attempts: emptyPage,
          missingLateStudents: emptyPage,
          recipients: emptyPage,
          summary: {},
        },
      },
    });

    await loadLmsAssignmentProgressWorkspace({ assignmentId: "asg-1", tenantId: "tenant-c" }, signal);

    expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "LmsAssignmentProgressWorkspace",
      portal: "lms",
      signal,
      tenantId: "tenant-c",
      variables: { input: { assignmentId: "asg-1", tenantId: "tenant-c" } },
    }));
  });
});
