import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { resolveCurrentPortal } from "@/platform/auth/api/auth-token-storage";

import type {
  AudienceBreakdown,
  CampaignAudience,
  CampaignBox,
  CampaignDraftRequest,
  CampaignPage,
  CampaignRecipientFilter,
  CampaignRecipientPage,
  CampaignResponse,
  CampaignSummary,
  RecipientCard,
  ResolvePeopleResult,
} from "./campaign-types";

// Admin screens run on the lcms/admin session, teacher screens on lms: follow the current shell.
const request = <T>(path: string, init: { body?: unknown; method?: string; signal?: AbortSignal } = {}) =>
  apiRequest<T>(path, {
    method: init.method ?? "GET",
    portal: resolveCurrentPortal(),
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    ...(init.signal ? { signal: init.signal } : {}),
  });

export function fetchCampaigns(input: { box: CampaignBox; mine: boolean; page?: number; size?: number }, signal?: AbortSignal) {
  const search = new URLSearchParams({
    box: input.box,
    mine: String(input.mine),
    page: String(input.page ?? 0),
    size: String(input.size ?? 20),
  });
  return request<CampaignPage>(`${API_ENDPOINTS.notificationCampaigns.root}?${search.toString()}`, { signal });
}

export const fetchCampaign = (id: string, signal?: AbortSignal) =>
  request<CampaignResponse>(API_ENDPOINTS.notificationCampaigns.detail(id), { signal });

export const fetchCampaignSummary = (signal?: AbortSignal) =>
  request<CampaignSummary>(API_ENDPOINTS.notificationCampaigns.summary, { signal });

export function fetchCampaignRecipients(
  id: string,
  input: { filter?: CampaignRecipientFilter; page?: number; size?: number } = {},
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({
    filter: input.filter ?? "ALL",
    page: String(input.page ?? 0),
    size: String(input.size ?? 20),
  });
  return request<CampaignRecipientPage>(`${API_ENDPOINTS.notificationCampaigns.recipients(id)}?${search.toString()}`, { signal });
}

export const createCampaign = (draft: CampaignDraftRequest) =>
  request<CampaignResponse>(API_ENDPOINTS.notificationCampaigns.root, { method: "POST", body: draft });

export const updateCampaign = (id: string, draft: CampaignDraftRequest) =>
  request<CampaignResponse>(API_ENDPOINTS.notificationCampaigns.detail(id), { method: "PUT", body: draft });

export const sendCampaign = (id: string) =>
  request<CampaignResponse>(API_ENDPOINTS.notificationCampaigns.send(id), { method: "POST" });

export const scheduleCampaign = (id: string, scheduledAt: string) =>
  request<CampaignResponse>(API_ENDPOINTS.notificationCampaigns.schedule(id), { method: "POST", body: { scheduledAt } });

export const cancelCampaign = (id: string) =>
  request<CampaignResponse>(API_ENDPOINTS.notificationCampaigns.cancel(id), { method: "POST" });

export const estimateAudience = (audience: CampaignAudience, signal?: AbortSignal) =>
  request<AudienceBreakdown>(API_ENDPOINTS.notificationCampaigns.estimate, { method: "POST", body: audience, signal });

export const searchPeople = (q: string, signal?: AbortSignal) =>
  request<RecipientCard[]>(`${API_ENDPOINTS.notificationCampaigns.people}?${new URLSearchParams({ q }).toString()}`, { signal });

export const resolvePeople = (lines: string[]) =>
  request<ResolvePeopleResult>(API_ENDPOINTS.notificationCampaigns.resolvePeople, { method: "POST", body: { lines } });
