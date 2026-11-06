import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { ackNotification, notificationQueryKeys, type NotificationPortal } from "@/features/notifications/api/notification-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { QUERY_POLICIES } from "@/lib/query-policy";

import {
  cancelCampaign,
  createCampaign,
  estimateAudience,
  fetchCampaign,
  fetchCampaignRecipients,
  fetchCampaigns,
  fetchCampaignSummary,
  resolvePeople,
  scheduleCampaign,
  searchPeople,
  sendCampaign,
  updateCampaign,
} from "./campaign-api";
import type { CampaignAudience, CampaignBox, CampaignDraftRequest, CampaignRecipientFilter } from "./campaign-types";

export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (box: CampaignBox, mine: boolean) => [...campaignKeys.lists(), box, mine] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
  recipients: (id: string, filter: CampaignRecipientFilter, page: number) => [...campaignKeys.detail(id), "recipients", filter, page] as const,
  summary: () => [...campaignKeys.all, "summary"] as const,
  estimate: (audience: CampaignAudience) => [...campaignKeys.all, "estimate", audience] as const,
  people: (q: string) => [...campaignKeys.all, "people", q] as const,
};

const PEOPLE_MIN_CHARS = 2;
const PEOPLE_DEBOUNCE_MS = 250;
const ESTIMATE_DEBOUNCE_MS = 300;
const realtime = { staleTime: QUERY_POLICIES.realtime.staleTime, gcTime: QUERY_POLICIES.realtime.gcTime };

/** Same rule as the backend: nothing selected and not the whole tenant. */
export function isAudienceEmpty(audience: CampaignAudience) {
  return (
    !audience.wholeTenant &&
    [audience.classIds, audience.groupIds, audience.gradeIds, audience.schoolIds, audience.userIds, audience.roles].every((list) => !list?.length)
  );
}

export function useCampaigns(box: CampaignBox, mine: boolean, page = 0) {
  return useQuery({
    queryKey: [...campaignKeys.list(box, mine), page],
    queryFn: ({ signal }) => fetchCampaigns({ box, mine, page }, signal),
    placeholderData: keepPreviousData,
    ...realtime,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: campaignKeys.detail(id ?? ""),
    queryFn: ({ signal }) => fetchCampaign(id as string, signal),
    enabled: Boolean(id),
    ...realtime,
  });
}

export function useCampaignSummary() {
  return useQuery({
    queryKey: campaignKeys.summary(),
    queryFn: ({ signal }) => fetchCampaignSummary(signal),
    ...realtime,
  });
}

export function useCampaignRecipients(id: string | undefined, filter: CampaignRecipientFilter = "ALL", page = 0) {
  return useQuery({
    queryKey: campaignKeys.recipients(id ?? "", filter, page),
    queryFn: ({ signal }) => fetchCampaignRecipients(id as string, { filter, page }, signal),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    ...realtime,
  });
}

/** Debounced (300 ms) and disabled while the audience is empty. */
export function useCampaignEstimate(audience: CampaignAudience) {
  // Debounce a string: a fresh object each render would re-arm the debouncer forever.
  const debouncedKey = useDebouncedValue(JSON.stringify(audience), ESTIMATE_DEBOUNCE_MS);
  const debounced = JSON.parse(debouncedKey) as CampaignAudience;
  return useQuery({
    queryKey: campaignKeys.estimate(debounced),
    queryFn: ({ signal }) => estimateAudience(debounced, signal),
    enabled: !isAudienceEmpty(audience) && !isAudienceEmpty(debounced),
    placeholderData: keepPreviousData,
    ...realtime,
  });
}

/** No network call until the (debounced) query has at least 2 characters. */
export function usePeopleSearch(q: string) {
  const query = useDebouncedValue(q.trim(), PEOPLE_DEBOUNCE_MS);
  return useQuery({
    queryKey: campaignKeys.people(query),
    queryFn: ({ signal }) => searchPeople(query, signal),
    enabled: q.trim().length >= PEOPLE_MIN_CHARS && query.length >= PEOPLE_MIN_CHARS,
    placeholderData: keepPreviousData,
    ...realtime,
  });
}

export function useResolvePeople() {
  return useMutation({ mutationFn: resolvePeople });
}

/** Every box list, the summary and (when known) the detail depend on the status of a campaign. */
function invalidateCampaigns(queryClient: QueryClient, id?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: campaignKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: campaignKeys.summary() }),
    ...(id ? [queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) })] : []),
  ]);
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: CampaignDraftRequest) => createCampaign(draft),
    onSuccess: () => invalidateCampaigns(queryClient),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: CampaignDraftRequest }) => updateCampaign(id, draft),
    onSuccess: (_data, { id }) => invalidateCampaigns(queryClient, id),
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendCampaign(id),
    onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
  });
}

export function useScheduleCampaign(scheduledAt: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleCampaign(id, scheduledAt),
    onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
  });
}

/** Read-ack from the inbox; refreshes that portal's inbox, detail and unread badge. */
export function useAckNotification(portal: NotificationPortal = "lms") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ackNotification(id, portal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(portal) }),
  });
}
