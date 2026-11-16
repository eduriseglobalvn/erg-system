import { getDefaultTenantId, graphQlRequest, type GraphQlPortal } from "@/lib/graphql-client";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";

import { cancelTeachingScheduleBatchV2, loadTeachingScheduleDraft, publishTeachingScheduleBatchV2 } from "./teaching-calendar-schedule-api";
import type {
  TeachingScheduleBatchDetail,
  TeachingScheduleBatchDetailInput,
  TeachingScheduleBatchListInput,
  TeachingScheduleBatchPage,
  TeachingScheduleBatchPayload,
} from "./teaching-calendar-command-types";

/** The BE (LD B0) needs expectedVersion; the list rows carry none, so read it first. */
async function currentBatchVersion(batchId: string) {
  return (await loadTeachingScheduleDraft(batchId)).version;
}

export async function publishTeachingScheduleBatch(batchId: string, _tenantId = getDefaultTenantId(), _portal: GraphQlPortal = "lcms"): Promise<TeachingScheduleBatchPayload> {
  const batch = await publishTeachingScheduleBatchV2(batchId, await currentBatchVersion(batchId));
  return { affectedEventCount: batch.affectedEventCount, batchId: batch.id, status: batch.status };
}

export async function cancelTeachingScheduleBatch(batchId: string, _tenantId = getDefaultTenantId(), _portal: GraphQlPortal = "lcms"): Promise<TeachingScheduleBatchPayload> {
  const batch = await cancelTeachingScheduleBatchV2(batchId, await currentBatchVersion(batchId));
  return { affectedEventCount: batch.affectedEventCount, batchId: batch.id, status: batch.status };
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
