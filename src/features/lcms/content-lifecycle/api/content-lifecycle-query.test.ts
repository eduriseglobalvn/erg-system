import { describe, expect, it } from "vitest";
import { contentLifecycleQueryKeys } from "@/features/lcms/content-lifecycle/api/content-lifecycle-query";

describe("content lifecycle query scope", () => {
  it("includes tenant, account and workspace in every lifecycle key", () => {
    const scope = { tenantId: "tenant-a", accountId: "admin-a", workspace: "ADMIN" as const, portal: "lcms" as const };
    expect(contentLifecycleQueryKeys.transition(scope, "QUIZ", "quiz-1")).toEqual([
      "content-lifecycle", "tenant-a", "admin-a", "ADMIN", "transition", "QUIZ", "quiz-1",
    ]);
  });
});

