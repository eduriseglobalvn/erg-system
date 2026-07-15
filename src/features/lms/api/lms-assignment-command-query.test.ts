import { describe, expect, test } from "vitest";

import {
  LMS_STUDENT_GROUPS_GC_TIME_MS,
  LMS_STUDENT_GROUPS_STALE_TIME_MS,
  lmsAssignmentCommandMutationKeys,
  lmsAssignmentReadQueryKeys,
  lmsStudentGroupsQueryOptions,
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
    expect(lmsAssignmentReadQueryKeys.homeworkWorkspace("tenant-a")).toEqual(["lms-teacher-shell", "teacher-homework-workspace", "tenant-a"]);
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
    expect(lmsAssignmentReadQueryKeys.studentGroups("tenant-a")).toEqual(["lms", "student-groups", "tenant-a", "all"]);
    expect(lmsAssignmentReadQueryKeys.studentGroups("tenant-a", "class-a")).toEqual([
      "lms",
      "student-groups",
      "tenant-a",
      "class-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgressRoot).toEqual(["lms", "assignment-progress-workspace"]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgressTenantRoot("tenant-a")).toEqual([
      "lms",
      "assignment-progress-workspace",
      "tenant-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a")).toEqual([
      "lms",
      "assignment-progress-workspace",
      "tenant-a",
      "assignment-a",
    ]);
  });

  test("uses scoped query options for student groups", () => {
    const options = lmsStudentGroupsQueryOptions("tenant-a", "class-a");

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(["lms", "student-groups", "tenant-a", "class-a"]);
    expect(options.staleTime).toBe(LMS_STUDENT_GROUPS_STALE_TIME_MS);
    expect(options.gcTime).toBe(LMS_STUDENT_GROUPS_GC_TIME_MS);
  });

  test("can disable student group reads until the recipient mode needs them", () => {
    const options = lmsStudentGroupsQueryOptions("tenant-a", "class-a", { enabled: false });

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(["lms", "student-groups", "tenant-a", "class-a"]);
  });
});
