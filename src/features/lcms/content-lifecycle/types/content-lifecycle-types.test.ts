import { describe, expect, it } from "vitest";
import {
  canTransitionContentLifecycle,
  lifecycleResourceKindForTaxonomyKind,
  lifecycleStateFromStatus,
  lifecycleTransitionRequiresReason,
  lifecycleTransitionTargets,
} from "@/features/lcms/content-lifecycle/types/content-lifecycle-types";

describe("content lifecycle policy", () => {
  it("mirrors the BE transition graph, including quiz rollback only", () => {
    expect(lifecycleTransitionTargets("DRAFT", "CONTENT_ITEM")).toEqual(["IN_REVIEW", "ARCHIVED"]);
    expect(lifecycleTransitionTargets("PUBLISHED", "CONTENT_ITEM")).toEqual(["ARCHIVED"]);
    expect(lifecycleTransitionTargets("PUBLISHED", "QUIZ")).toEqual(["ARCHIVED", "DRAFT"]);
    expect(lifecycleTransitionTargets("ARCHIVED", "QUESTION")).toEqual(["DRAFT"]);
  });

  it("requires reasons for destructive and rollback transitions", () => {
    expect(lifecycleTransitionRequiresReason("DRAFT", "IN_REVIEW")).toBe(false);
    expect(lifecycleTransitionRequiresReason("IN_REVIEW", "DRAFT")).toBe(true);
    expect(lifecycleTransitionRequiresReason("PUBLISHED", "DRAFT")).toBe(true);
    expect(lifecycleTransitionRequiresReason("APPROVED", "ARCHIVED")).toBe(true);
  });

  it("never grants a transition without an explicit permission", () => {
    const target = { resourceKind: "CONTENT_ITEM" as const, currentState: "DRAFT" as const };
    expect(canTransitionContentLifecycle(target, "IN_REVIEW", { grantedPermissions: [] })).toBe(false);
    expect(canTransitionContentLifecycle(target, "IN_REVIEW", { grantedPermissions: ["content.lifecycle.submit"] })).toBe(true);
    expect(canTransitionContentLifecycle(target, "IN_REVIEW", {
      grantedPermissions: ["content.lifecycle.submit"],
      deniedPermissions: ["content.lifecycle.submit"],
    })).toBe(false);
  });

  it("maps only statuses that are compatible with the BE lifecycle migration", () => {
    expect(lifecycleStateFromStatus("reviewing")).toBe("IN_REVIEW");
    expect(lifecycleStateFromStatus("ready")).toBe("DRAFT");
    expect(lifecycleStateFromStatus("published")).toBe("PUBLISHED");
    expect(lifecycleStateFromStatus("unknown-status")).toBeNull();
  });

  it("maps curriculum taxonomy aliases to canonical lifecycle resources", () => {
    expect(lifecycleResourceKindForTaxonomyKind("subject")).toBe("CURRICULUM_SUBJECT");
    expect(lifecycleResourceKindForTaxonomyKind("category")).toBe("CURRICULUM_LEVEL");
    expect(lifecycleResourceKindForTaxonomyKind("section")).toBe("CURRICULUM_TOPIC");
    expect(lifecycleResourceKindForTaxonomyKind("asset")).toBeNull();
  });
});

