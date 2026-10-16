import { getDefaultTenantId } from "@/lib/graphql-client";
import type { GraphQlPage } from "@/lib/graphql-client";
import { isNonEmptyString, isObject } from "@/lib/validate-response";

export type LmsStudent = {
  id: string;
  schoolId?: string | null;
  academicClassId?: string | null;
  studentCode?: string | null;
  fullName?: string | null;
  username?: string | null;
  authUserId?: string | null;
  email?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

export type LmsAssignmentResource = {
  quizId: string;
  quizVersionId?: string | null;
  quizVersionLabel?: string | null;
  orderIndex?: number | null;
};

export type LmsAssignment = {
  id: string;
  academicClassId?: string | null;
  quizId?: string | null;
  resources?: LmsAssignmentResource[] | null;
  subjectId?: string | null;
  dueAt?: string | null;
  status?: string | null;
  assignedBy?: string | null;
  recipientMode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function withTenant<TInput extends { tenantId?: string }>(input: TInput): TInput {
  return {
    ...input,
    tenantId: input.tenantId ?? getDefaultTenantId(),
  };
}

export function isLmsEntity(value: unknown): value is { id: string } {
  return isObject(value) && isNonEmptyString(value.id);
}

export function isLmsGraphQlPage(
  value: unknown,
  itemGuard: (item: unknown) => boolean = () => true,
): value is GraphQlPage<unknown> {
  return isObject(value) &&
    Array.isArray(value.items) && value.items.every(itemGuard) &&
    typeof value.page === "number" &&
    typeof value.size === "number" &&
    typeof value.totalItems === "number" &&
    typeof value.totalPages === "number" &&
    typeof value.hasNext === "boolean" &&
    typeof value.hasPrevious === "boolean";
}
