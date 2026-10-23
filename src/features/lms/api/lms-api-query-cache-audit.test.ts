import { describe, expect, it } from "vitest";

import {
  assignmentMutationInvalidationKeys,
  lmsAssignmentReadQueryKeys,
  studentGroupMutationInvalidationKeys,
} from "@/features/lms/api/lms-assignment-command-query";
import { learningResourceLibraryQueryKeys } from "@/features/lms/learning-resources/api/learning-resource-query";
import { isPersistableQuery } from "@/lib/query-persistence";

describe("LMS API/query/cache audit characterization", () => {
  it("isolates class and assignment progress reads by their full runtime scope", () => {
    expect(lmsAssignmentReadQueryKeys.classWorkspace({
      accountId: "account-a",
      classId: "class-a",
      schoolId: "school-a",
      tenantId: "tenant-a",
      usage: "class-management",
    })).toEqual([
      "lms",
      "class-workspace",
      "tenant-a",
      "account-a",
      "class-management",
      "school-a",
      "class-a",
    ]);
    expect(lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a", "account-a")).toEqual([
      "lms",
      "assignment-progress-workspace",
      "tenant-a",
      "account-a",
      "assignment-a",
    ]);
  });

  it("isolates learning-resource progress by tenant, account, school and academic year", () => {
    expect(learningResourceLibraryQueryKeys.progress({
      accountId: "account-a",
      academicYear: "2026-2027",
      schoolId: "school-a",
      tenantId: "tenant-a",
    })).toEqual([
      "learning-resources",
      "library-progress",
      "tenant-a",
      "account-a",
      "school-a",
      "2026-2027",
    ]);
  });

  it("invalidates tenant/entity owners without touching the global LMS root", () => {
    const assignmentTargets = assignmentMutationInvalidationKeys("tenant-a", "assignment-a", "account-a");
    const groupTargets = studentGroupMutationInvalidationKeys("tenant-a", "account-a");

    expect(assignmentTargets).toContainEqual(
      lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a", "account-a"),
    );
    expect(groupTargets).toContainEqual(
      lmsAssignmentReadQueryKeys.studentGroupsAccountRoot("tenant-a", "account-a"),
    );
    for (const key of [...assignmentTargets, ...groupTargets]) {
      expect(key).not.toEqual(lmsAssignmentReadQueryKeys.root);
      expect(key.join(":")).toContain("tenant-a");
    }
  });

  it("persists only approved LMS offline-core families", () => {
    expect(isPersistableQuery({
      queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
        accountId: "account-a",
        classId: "class-a",
        schoolId: "school-a",
        tenantId: "tenant-a",
        usage: "offline-class",
      }),
    })).toBe(true);
    expect(isPersistableQuery({
      queryKey: lmsAssignmentReadQueryKeys.assignmentProgress("assignment-a", "tenant-a", "account-a"),
    })).toBe(true);
    expect(isPersistableQuery({
      queryKey: lmsAssignmentReadQueryKeys.homeworkWorkspace("tenant-a", "account-a"),
    })).toBe(true);
    expect(isPersistableQuery({
      queryKey: ["notifications", "lms", "tenant-a", "account-a"],
    })).toBe(false);
    expect(isPersistableQuery({
      queryKey: ["lms", "session", "tenant-a", "account-a"],
    })).toBe(false);
  });
});
