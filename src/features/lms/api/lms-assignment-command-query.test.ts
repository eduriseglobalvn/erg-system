import { describe, expect, test, vi } from "vitest";

import { loadLmsStudentGroups } from "@/features/lms/api/lms-assignment-command-api";

vi.mock("@/features/lms/api/lms-assignment-command-api", () => ({
  loadLmsStudentGroups: vi.fn(),
}));

import {
  LMS_STUDENT_GROUPS_GC_TIME_MS,
  LMS_STUDENT_GROUPS_STALE_TIME_MS,
  lmsAssignmentCommandMutationKeys,
  assignmentMutationInvalidationKeys,
  lmsAssignmentReadQueryKeys,
  lmsStudentGroupsQueryOptions,
  studentGroupMutationInvalidationKeys,
} from "@/features/lms/api/lms-assignment-command-query";

describe("lms assignment command query keys", () => {
  test("uses stable mutation keys for Tauri/offline instrumentation", () => {
    expect(lmsAssignmentCommandMutationKeys.createAssignment).toEqual(["lms", "mutation", "assignment-create"]);
    expect(lmsAssignmentCommandMutationKeys.updateAssignment).toEqual(["lms", "mutation", "assignment-update"]);
    expect(lmsAssignmentCommandMutationKeys.updateRecipients).toEqual(["lms", "mutation", "assignment-recipients"]);
    expect(lmsAssignmentCommandMutationKeys.deleteAssignment).toEqual(["lms", "mutation", "assignment-delete"]);
    expect(lmsAssignmentCommandMutationKeys.createGroup).toEqual(["lms", "mutation", "student-group-create"]);
    expect(lmsAssignmentCommandMutationKeys.updateGroup).toEqual(["lms", "mutation", "student-group-update"]);
    expect(lmsAssignmentCommandMutationKeys.deleteGroup).toEqual(["lms", "mutation", "student-group-delete"]);
  });

  test("names read roots that assignment mutations invalidate", () => {
    expect(lmsAssignmentReadQueryKeys.homeworkRoot).toEqual(["lms-teacher-shell", "teacher-homework-workspace"]);
    expect(lmsAssignmentReadQueryKeys.homeworkTenantRoot("tenant-a")).toEqual([
      "lms-teacher-shell",
      "teacher-homework-workspace",
      "tenant-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.homeworkWorkspace("tenant-a", "teacher-a")).toEqual([
      "lms-teacher-shell",
      "teacher-homework-workspace",
      "tenant-a",
      "teacher-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.classWorkspaceTenantRoot("tenant-a")).toEqual(["lms", "class-workspace", "tenant-a"]);
    expect(lmsAssignmentReadQueryKeys.classWorkspace({
      accountId: "teacher-a",
      classId: "class-a",
      schoolId: "school-a",
      tenantId: "tenant-a",
      usage: "assign-homework",
    })).toEqual(["lms", "class-workspace", "tenant-a", "teacher-a", "assign-homework", "school-a", "class-a"]);
    expect(lmsAssignmentReadQueryKeys.studentGroupsRoot).toEqual(["lms", "student-groups"]);
    expect(lmsAssignmentReadQueryKeys.studentGroupsTenantRoot("tenant-a")).toEqual(["lms", "student-groups", "tenant-a"]);
    expect(lmsAssignmentReadQueryKeys.studentGroups("tenant-a", "teacher-a")).toEqual([
      "lms",
      "student-groups",
      "tenant-a",
      "teacher-a",
      "all",
    ]);
    expect(lmsAssignmentReadQueryKeys.studentGroups("tenant-a", "teacher-a", "class-a")).toEqual([
      "lms",
      "student-groups",
      "tenant-a",
      "teacher-a",
      "class-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgressRoot).toEqual(["lms", "assignment-progress-workspace"]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgressTenantRoot("tenant-a")).toEqual([
      "lms",
      "assignment-progress-workspace",
      "tenant-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a", "teacher-a")).toEqual([
      "lms",
      "assignment-progress-workspace",
      "tenant-a",
      "teacher-a",
      "assignment-a",
    ]);
  });

  test("uses scoped query options for student groups", () => {
    const options = lmsStudentGroupsQueryOptions("tenant-a", "class-a", { accountId: "teacher-a" });

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(["lms", "student-groups", "tenant-a", "teacher-a", "class-a"]);
    expect(options.staleTime).toBe(LMS_STUDENT_GROUPS_STALE_TIME_MS);
    expect(options.gcTime).toBe(LMS_STUDENT_GROUPS_GC_TIME_MS);
  });

  test("can disable student group reads until the recipient mode needs them", () => {
    const options = lmsStudentGroupsQueryOptions("tenant-a", "class-a", { accountId: "teacher-a", enabled: false });

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(["lms", "student-groups", "tenant-a", "teacher-a", "class-a"]);
  });

  test("forwards TanStack Query cancellation to the student-group transport", async () => {
    const signal = new AbortController().signal;
    const options = lmsStudentGroupsQueryOptions("tenant-a", "class-a", { accountId: "teacher-a" });

    await options.queryFn({ signal } as never);

    expect(loadLmsStudentGroups).toHaveBeenCalledWith(
      { classId: "class-a", tenantId: "tenant-a" },
      signal,
    );
  });

  test("isolates account switches even when tenant and entity are unchanged", () => {
    expect(lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a", "teacher-a"))
      .not.toEqual(lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a", "teacher-b"));
    expect(lmsAssignmentReadQueryKeys.studentGroups("tenant-a", "teacher-a", "class-a"))
      .not.toEqual(lmsAssignmentReadQueryKeys.studentGroups("tenant-a", "teacher-b", "class-a"));
  });

  test("assignment mutations target one progress/report record while retaining affected workspaces", () => {
    expect(assignmentMutationInvalidationKeys("tenant-a", "assignment-a", "teacher-a")).toEqual([
      ["lms-teacher-shell", "teacher-homework-workspace", "tenant-a", "teacher-a"],
      ["lms", "class-workspace", "tenant-a", "teacher-a"],
      ["lms", "assignment-progress-workspace", "tenant-a", "teacher-a", "assignment-a"],
      ["quiz-reports", "tenant-a", "assignment-report", "assignment-a"],
    ]);
  });

  test("student-group mutations do not refetch unrelated quiz reports", () => {
    expect(studentGroupMutationInvalidationKeys("tenant-a", "teacher-a")).toEqual([
      ["lms", "student-groups", "tenant-a", "teacher-a"],
      ["lms-teacher-shell", "teacher-homework-workspace", "tenant-a", "teacher-a"],
      ["lms", "class-workspace", "tenant-a", "teacher-a"],
    ]);
  });
});
