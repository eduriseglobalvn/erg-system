import { getDefaultTenantId, graphQlRequest, type GraphQlPortal } from "@/lib/graphql-client";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";

import type {
  TeachingScheduleBatchDetail,
  TeachingScheduleBatchDetailInput,
  TeachingScheduleBatchListInput,
  TeachingScheduleBatchPage,
  TeachingScheduleBatchPayload,
} from "./teaching-calendar-command-types";

export async function publishTeachingScheduleBatch(batchId: string, tenantId = getDefaultTenantId(), portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ publishTeachingScheduleBatch: TeachingScheduleBatchPayload }, { batchId: string }>({
    operationName: "TeachingCalendarPublishScheduleBatch",
    portal,
    query: `mutation TeachingCalendarPublishScheduleBatch($batchId: String!) { publishTeachingScheduleBatch(batchId: $batchId) { batchId status affectedEventCount } }`,
    tenantId,
    variables: { batchId },
  });
  return data.publishTeachingScheduleBatch;
}

export async function cancelTeachingScheduleBatch(batchId: string, tenantId = getDefaultTenantId(), portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ cancelTeachingScheduleBatch: TeachingScheduleBatchPayload }, { batchId: string }>({
    operationName: "TeachingCalendarCancelScheduleBatch",
    portal,
    query: `mutation TeachingCalendarCancelScheduleBatch($batchId: String!) { cancelTeachingScheduleBatch(batchId: $batchId) { batchId status affectedEventCount } }`,
    tenantId,
    variables: { batchId },
  });
  return data.cancelTeachingScheduleBatch;
}

export async function loadTeachingScheduleBatches(input: TeachingScheduleBatchListInput, signal?: AbortSignal) {
  const data = await graphQlRequest<
    { lcms: { teachingScheduleBatches: TeachingScheduleBatchPage } },
    { input: TeachingScheduleBatchListInput }
  >({
    operationName: "TeachingCalendarScheduleBatches",
    portal: "lcms",
    query: `
      query TeachingCalendarScheduleBatches($input: TeachingScheduleBatchListInput) {
        lcms {
          teachingScheduleBatches(input: $input) {
            items { id schoolId applyFrom repeatWeeks status createdAt }
            page size totalItems totalPages hasNext hasPrevious
          }
        }
      }
    `,
    signal,
    tenantId: input.tenantId,
    variables: { input },
  });
  return validateResponse(data, isTeachingScheduleBatchesResponse, "teaching-calendar.batches").lcms.teachingScheduleBatches;
}

export async function loadTeachingScheduleBatchDetail(input: TeachingScheduleBatchDetailInput, signal?: AbortSignal) {
  const data = await graphQlRequest<
    { lcms: { teachingScheduleBatch: TeachingScheduleBatchDetail } },
    { input: TeachingScheduleBatchDetailInput }
  >({
    operationName: "TeachingCalendarScheduleBatchDetail",
    portal: "lcms",
    query: `
      query TeachingCalendarScheduleBatchDetail($input: TeachingScheduleBatchDetailInput!) {
        lcms {
          teachingScheduleBatch(input: $input) {
            id tenantId schoolId academicYear applyFrom repeatWeeks status source note
            createdBy publishedBy publishedAt createdAt eventCount
          }
        }
      }
    `,
    signal,
    tenantId: input.tenantId,
    variables: { input },
  });
  return validateResponse(data, isTeachingScheduleBatchDetailResponse, "teaching-calendar.batch-detail").lcms.teachingScheduleBatch;
}

function isTeachingScheduleBatchesResponse(value: unknown): value is { lcms: { teachingScheduleBatches: TeachingScheduleBatchPage } } {
  return isObject(value) && isObject(value.lcms) && isObject(value.lcms.teachingScheduleBatches)
    && Array.isArray(value.lcms.teachingScheduleBatches.items);
}

function isTeachingScheduleBatchDetailResponse(value: unknown): value is { lcms: { teachingScheduleBatch: TeachingScheduleBatchDetail } } {
  return isObject(value) && isObject(value.lcms) && isObject(value.lcms.teachingScheduleBatch)
    && isNonEmptyString(value.lcms.teachingScheduleBatch.id);
}
