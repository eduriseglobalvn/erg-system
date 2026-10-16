import type { components } from "@/lib/api/generated/erg-openapi";
import { getBackOfficePortal } from "@/lib/api-client";
import { createApiClient } from "@/lib/api/create-api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { mapSeoCrmWorkspaceDto, mapSeoLeadDto } from "@/features/crm/seo/api/seo-crm-mapper";
import type { SeoCrmWorkspace, SeoLeadStatus, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });

export async function loadSeoCrmWorkspace(signal?: AbortSignal): Promise<SeoCrmWorkspace> {
  const response = await client().operation(API_ENDPOINTS.crm.workspace, "get", signal ? { signal } : {});
  return mapSeoCrmWorkspaceDto(response);
}

export type UpdateSeoLeadStatusInput = {
  leadId: string;
  status: SeoLeadStatus;
  expectedVersion: number;
};

export async function updateSeoLeadStatus(input: UpdateSeoLeadStatusInput): Promise<SeoSchoolLead> {
  const response = await client().operation(API_ENDPOINTS.crm.leadStatus(input.leadId), "patch", {
    body: { status: input.status, expectedVersion: input.expectedVersion },
  });
  return mapSeoLeadDto(response);
}

export function createSeoOpportunity(
  body: components["schemas"]["CreateOpportunityRequest"], idempotencyKey: string,
) {
  return client().operation(API_ENDPOINTS.crm.opportunities, "post", {
    body,
    headers: { "X-Idempotency-Key": idempotencyKey },
  });
}

export function updateSeoOpportunity(
  opportunityId: string, body: components["schemas"]["UpdateOpportunityRequest"],
) {
  return client().operation(API_ENDPOINTS.crm.opportunity(opportunityId), "patch", { body });
}

export function createSeoFollowUp(body: components["schemas"]["CreateFollowUpRequest"], idempotencyKey: string) {
  return client().operation(API_ENDPOINTS.crm.followUps, "post", {
    body,
    headers: { "X-Idempotency-Key": idempotencyKey },
  });
}

export function updateSeoFollowUpCompletion(
  followUpId: string, body: components["schemas"]["UpdateFollowUpCompletionRequest"],
) {
  return client().operation(API_ENDPOINTS.crm.followUpCompletion(followUpId), "patch", { body });
}

export function createSeoHandover(body: components["schemas"]["CreateHandoverRequest"], idempotencyKey: string) {
  return client().operation(API_ENDPOINTS.crm.handovers, "post", {
    body,
    headers: { "X-Idempotency-Key": idempotencyKey },
  });
}

export function approveSeoHandover(handoverId: string, expectedVersion: number) {
  return client().operation(API_ENDPOINTS.crm.handoverApproval(handoverId), "post", {
    body: { expectedVersion },
  });
}
