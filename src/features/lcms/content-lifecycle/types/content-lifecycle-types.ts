import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

export const CONTENT_LIFECYCLE_STATES = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type ContentLifecycleState = (typeof CONTENT_LIFECYCLE_STATES)[number];

export const CONTENT_LIFECYCLE_RESOURCE_KINDS = [
  "CURRICULUM_SUBJECT",
  "CURRICULUM_LEVEL",
  "CURRICULUM_TOPIC",
  "CONTENT_ITEM",
  "QUESTION",
  "QUIZ",
] as const;

export type ContentLifecycleResourceKind = (typeof CONTENT_LIFECYCLE_RESOURCE_KINDS)[number];

export type ContentLifecycleWorkspace = "ADMIN";

export type ContentLifecycleScope = {
  tenantId: string;
  accountId: string;
  workspace: ContentLifecycleWorkspace;
  portal: "lcms";
};

export type ContentLifecycleTarget = {
  resourceKind: ContentLifecycleResourceKind;
  resourceId: string;
  currentState: ContentLifecycleState | null;
  currentVersion?: number;
  label?: string;
  sourceVersionId?: string;
};

export type ContentLifecycleTransitionResult = {
  resourceKind: ContentLifecycleResourceKind;
  resourceId: string;
  tenantId?: string;
  previousState: ContentLifecycleState;
  state: ContentLifecycleState;
  version: number;
  actorId?: string;
  reason?: string;
  replayed: boolean;
  sourceVersionId?: string;
  transitionedAt?: string;
};

export type ContentLifecyclePermissionContext = {
  grantedPermissions: readonly string[];
  deniedPermissions?: readonly string[];
};

export function normalizeContentLifecycleState(value: unknown): ContentLifecycleState | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[- ]/g, "_");
  return (CONTENT_LIFECYCLE_STATES as readonly string[]).includes(normalized)
    ? normalized as ContentLifecycleState
    : null;
}

/**
 * Legacy authoring APIs expose status rather than lifecycle_state. Only map values
 * that the BE migration explicitly understands; unknown values stay unavailable so
 * the UI never claims a server state it cannot prove.
 */
export function lifecycleStateFromStatus(value: unknown): ContentLifecycleState | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[- ]/g, "_");
  switch (normalized) {
    case "draft":
    case "ready":
    case "pilot":
      return "DRAFT";
    case "review":
    case "reviewing":
    case "in_review":
      return "IN_REVIEW";
    case "approved":
      return "APPROVED";
    case "published":
    case "active":
      return "PUBLISHED";
    case "archived":
    case "deleted":
    case "removed":
      return "ARCHIVED";
    default:
      return null;
  }
}

export function lifecycleResourceKindForTaxonomyKind(kind: string): ContentLifecycleResourceKind | null {
  const normalized = kind.trim().toLowerCase();
  if (normalized === "subject" || normalized === "subjects") return "CURRICULUM_SUBJECT";
  if (["level", "levels", "group", "groups", "category", "categories"].includes(normalized)) return "CURRICULUM_LEVEL";
  if (["topic", "topics", "lesson", "lessons", "section", "sections"].includes(normalized)) return "CURRICULUM_TOPIC";
  return null;
}

export function lifecycleTransitionTargets(
  from: ContentLifecycleState,
  resourceKind: ContentLifecycleResourceKind,
): readonly ContentLifecycleState[] {
  switch (from) {
    case "DRAFT":
      return ["IN_REVIEW", "ARCHIVED"];
    case "IN_REVIEW":
      return ["APPROVED", "DRAFT", "ARCHIVED"];
    case "APPROVED":
      return ["PUBLISHED", "DRAFT", "ARCHIVED"];
    case "PUBLISHED":
      return resourceKind === "QUIZ" ? ["ARCHIVED", "DRAFT"] : ["ARCHIVED"];
    case "ARCHIVED":
      return ["DRAFT"];
  }
}

export function lifecycleTransitionRequiresReason(
  from: ContentLifecycleState,
  to: ContentLifecycleState,
): boolean {
  return to === "ARCHIVED"
    || (from === "IN_REVIEW" && to === "DRAFT")
    || (from === "PUBLISHED" && to === "DRAFT");
}

export function lifecyclePermissionCandidates(
  resourceKind: ContentLifecycleResourceKind,
  targetState: ContentLifecycleState,
): readonly string[] {
  const specific = targetState === "IN_REVIEW"
    ? "content.lifecycle.submit"
    : targetState === "APPROVED"
      ? "content.lifecycle.approve"
      : targetState === "PUBLISHED" && resourceKind === "QUIZ"
        ? "lms.quiz.publish"
        : targetState === "PUBLISHED"
          ? "content.lifecycle.publish"
          : targetState === "ARCHIVED"
            ? "content.lifecycle.archive"
            : "content.lifecycle.rollback";

  return [specific, "content.manage", "curriculum.manage"];
}

export function canTransitionContentLifecycle(
  target: Pick<ContentLifecycleTarget, "resourceKind" | "currentState">,
  targetState: ContentLifecycleState,
  permissions: ContentLifecyclePermissionContext,
): boolean {
  if (!target.currentState || !lifecycleTransitionTargets(target.currentState, target.resourceKind).includes(targetState)) return false;
  return lifecyclePermissionCandidates(target.resourceKind, targetState).some((permission) => evaluatePermission({
    permission,
    grantedPermissions: permissions.grantedPermissions,
    deniedPermissions: permissions.deniedPermissions,
  }));
}

export function lifecycleStateLabel(state: ContentLifecycleState | null): string {
  switch (state) {
    case "DRAFT": return "Bản nháp";
    case "IN_REVIEW": return "Đang duyệt";
    case "APPROVED": return "Đã duyệt";
    case "PUBLISHED": return "Đã xuất bản";
    case "ARCHIVED": return "Đã lưu trữ";
    default: return "Chưa đồng bộ";
  }
}

