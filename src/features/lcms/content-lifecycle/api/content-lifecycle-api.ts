import type { components } from "@/lib/api/generated/erg-openapi";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { ApiResponseData } from "@/lib/api/contract-types";
import { apiRequest } from "@/lib/api-client";
import {
  CONTENT_LIFECYCLE_RESOURCE_KINDS,
  normalizeContentLifecycleState,
  type ContentLifecycleResourceKind,
  type ContentLifecycleState,
  type ContentLifecycleTransitionResult,
} from "@/features/lcms/content-lifecycle/types/content-lifecycle-types";

type LifecycleResponseDto = ApiResponseData<"/api/v1/content/{resourceKind}/{resourceId}/lifecycle", "post">;
type LifecycleRequestDto = components["schemas"]["TransitionRequest"];

export type ContentLifecycleRequestContext = {
  portal?: "lcms";
  signal?: AbortSignal;
};

export type TransitionContentLifecycleInput = {
  resourceKind: ContentLifecycleResourceKind;
  resourceId: string;
  targetState: ContentLifecycleState;
  expectedVersion?: number;
  reason?: string;
  idempotencyKey: string;
  operationId?: string;
  sourceVersionId?: string;
};

export async function transitionContentLifecycle(
  input: TransitionContentLifecycleInput,
  context: ContentLifecycleRequestContext = {},
): Promise<ContentLifecycleTransitionResult> {
  const resourceId = requiredId(input.resourceId, "resourceId");
  const idempotencyKey = requiredId(input.idempotencyKey, "idempotencyKey");
  if (!CONTENT_LIFECYCLE_RESOURCE_KINDS.includes(input.resourceKind)) throw new Error("Unsupported lifecycle resource kind.");

  const body: LifecycleRequestDto = {
    targetState: input.targetState,
    idempotencyKey,
    ...(input.expectedVersion === undefined ? {} : { expectedVersion: input.expectedVersion }),
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    ...(input.operationId?.trim() ? { operationId: input.operationId.trim() } : {}),
    ...(input.sourceVersionId?.trim() ? { sourceVersionId: input.sourceVersionId.trim() } : {}),
  };

  const response = await apiRequest<LifecycleResponseDto>(API_ENDPOINTS.content.lifecycle(input.resourceKind, resourceId), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(body),
    headers: { "X-Idempotency-Key": idempotencyKey },
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return normalizeContentLifecycleResponse(response);
}

export function createContentLifecycleIdempotencyKey(resourceId: string, targetState: ContentLifecycleState) {
  const prefix = `content-lifecycle:${resourceId}:${targetState.toLowerCase()}`;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}:${crypto.randomUUID()}`;
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeContentLifecycleResponse(value: LifecycleResponseDto | undefined): ContentLifecycleTransitionResult {
  const resourceKind = value?.resourceKind;
  const resourceId = value?.resourceId?.trim();
  const previousState = normalizeContentLifecycleState(value?.previousState);
  const state = normalizeContentLifecycleState(value?.state);
  const version = Number(value?.version);
  if (!resourceKind || !CONTENT_LIFECYCLE_RESOURCE_KINDS.includes(resourceKind) || !resourceId || !previousState || !state || !Number.isFinite(version) || version < 0) {
    throw new Error("Invalid content lifecycle response.");
  }
  return {
    resourceKind,
    resourceId,
    tenantId: value?.tenantId?.trim() || undefined,
    previousState,
    state,
    version,
    actorId: value?.actorId?.trim() || undefined,
    reason: value?.reason?.trim() || undefined,
    replayed: value?.replayed === true,
    sourceVersionId: value?.sourceVersionId?.trim() || undefined,
    transitionedAt: value?.transitionedAt,
  };
}

function requiredId(value: string, name: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} is required.`);
  return normalized;
}
