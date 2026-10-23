import { describe, expect, it } from "vitest";

import { learningStandardsQueryKeys } from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

describe("learning standards query boundary", () => {
  it("keeps package reads isolated by tenant, account and workspace", () => {
    expect(learningStandardsQueryKeys.packages("tenant-a", "admin-a", "ADMIN")).toEqual([
      "learning-standards", "tenant-a", "admin-a", "ADMIN", "packages", "",
    ]);
    expect(learningStandardsQueryKeys.packages("tenant-a", "student-a", "STUDENT", "ready")).not.toEqual(
      learningStandardsQueryKeys.packages("tenant-a", "teacher-a", "TEACHER", "ready"),
    );
  });

  it("does not persist standard metadata or learner protocol data offline", () => {
    expect(QUERY_POLICIES.transactional.persist).toBe(false);
    expect(QUERY_POLICIES.sensitive.persist).toBe(false);
  });
});
