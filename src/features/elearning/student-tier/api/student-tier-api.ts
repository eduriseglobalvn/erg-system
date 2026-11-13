import type {
  ElearningAcknowledgeTierPromotionMutation,
  ElearningAcknowledgeTierPromotionMutationVariables,
  ElearningMyFramesQuery,
  ElearningMyFramesQueryVariables,
  ElearningMyTierQuery,
  ElearningMyTierQueryVariables,
  ElearningSelectFrameMutation,
  ElearningSelectFrameMutationVariables,
  ElearningTierTableQuery,
  ElearningTierTableQueryVariables,
} from "@/lib/api/generated/graphql";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import TierDocument from "./student-tier.graphql?raw";

export type MyTier = ElearningMyTierQuery["elearning"]["myTier"];
export type TierTableRow = ElearningTierTableQuery["elearning"]["tierTable"][number];
export type MyFrames = ElearningMyFramesQuery["elearning"]["myFrames"];

export const studentTierKeys = {
  mine: (accountId: string) => ["student-tier", accountId, "mine"] as const,
  table: (accountId: string, weekStart: string | null) => ["student-tier", accountId, "table", weekStart] as const,
  frames: (accountId: string) => ["student-tier", accountId, "frames"] as const,
};

const base = () => ({ portal: "elearning" as const, query: TierDocument, tenantId: getDefaultTenantId() });

export async function loadMyTier(signal?: AbortSignal): Promise<MyTier> {
  const { tenantId, ...rest } = base();
  const response = await graphQlRequest<ElearningMyTierQuery, ElearningMyTierQueryVariables & Record<string, unknown>>({ ...rest, tenantId, operationName: "ElearningMyTier", signal, variables: { tenantId } });
  return validateResponse(response, (v): v is ElearningMyTierQuery => isObject(v) && isObject(v.elearning) && isObject(v.elearning.myTier), "elearning.my-tier").elearning.myTier;
}

export async function loadTierTable(weekStart: string | null, signal?: AbortSignal): Promise<TierTableRow[]> {
  const { tenantId, ...rest } = base();
  const response = await graphQlRequest<ElearningTierTableQuery, ElearningTierTableQueryVariables & Record<string, unknown>>({
    ...rest, tenantId, operationName: "ElearningTierTable", signal, variables: { tenantId, weekStart },
  });
  return [...validateResponse(response, (v): v is ElearningTierTableQuery => isObject(v) && isObject(v.elearning) && Array.isArray(v.elearning.tierTable), "elearning.tier-table").elearning.tierTable];
}

export async function loadMyFrames(signal?: AbortSignal): Promise<MyFrames> {
  const { tenantId, ...rest } = base();
  const response = await graphQlRequest<ElearningMyFramesQuery, ElearningMyFramesQueryVariables & Record<string, unknown>>({ ...rest, tenantId, operationName: "ElearningMyFrames", signal, variables: { tenantId } });
  return validateResponse(response, (v): v is ElearningMyFramesQuery => isObject(v) && isObject(v.elearning) && isObject(v.elearning.myFrames), "elearning.my-frames").elearning.myFrames;
}

/** `tierKey: null` = "Không dùng khung". The backend rejects a locked frame. */
export async function selectFrame(tierKey: string | null) {
  const { tenantId, ...rest } = base();
  return graphQlRequest<ElearningSelectFrameMutation, ElearningSelectFrameMutationVariables & Record<string, unknown>>({
    ...rest, tenantId, operationName: "ElearningSelectFrame", variables: { tenantId, tierKey },
  });
}

export async function acknowledgeTierPromotion(weekStart: string) {
  const { tenantId, ...rest } = base();
  return graphQlRequest<ElearningAcknowledgeTierPromotionMutation, ElearningAcknowledgeTierPromotionMutationVariables & Record<string, unknown>>({
    ...rest, tenantId, operationName: "ElearningAcknowledgeTierPromotion", variables: { tenantId, weekStart },
  });
}
