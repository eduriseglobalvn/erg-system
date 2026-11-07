import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { QUERY_POLICIES } from "@/lib/query-policy";
import { timekeepingApi } from "./timekeeping-api";
import { timekeepingKeys } from "./timekeeping-query";
import type { RequestCommand, RequestView } from "./timekeeping-types";

export type LeavePreviewParams = { from: string; to: string; kind: string; part: string };

/** Newest first; one page of 50 is the backend cap, enough for a teacher's own requests. */
export function useMyRequests(status?: string) {
  return useQuery({
    queryKey: timekeepingKeys.myRequests(status),
    queryFn: ({ signal }) => timekeepingApi.myRequests({ status, size: 50 }, signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: timekeepingKeys.request(id ?? ""),
    queryFn: ({ signal }) => timekeepingApi.request(id as string, signal),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

/** Leave days and balance as the server computes them; a changed key drops the in-flight request of the old one. */
export function useLeavePreview(params: LeavePreviewParams | null) {
  return useQuery({
    queryKey: ["timekeeping", "requests", "preview-leave", params] as const,
    queryFn: ({ signal }) => timekeepingApi.previewLeave(params as LeavePreviewParams, signal),
    enabled: params !== null,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 0,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

export function useExplanationContext(date: string | undefined) {
  return useQuery({
    queryKey: ["timekeeping", "requests", "explanation-context", date ?? ""] as const,
    queryFn: ({ signal }) => timekeepingApi.explanationContext(date as string, signal),
    enabled: Boolean(date),
    retry: false,
    staleTime: 0,
    gcTime: QUERY_POLICIES.sensitive.gcTime,
  });
}

/**
 * Save a request and optionally send it. A draft that was saved but not sent (e.g. the send was refused for balance)
 * is updated, not duplicated, on the next try. Editing a pending request cancels it first: the backend only updates drafts.
 */
export function useSaveRequest(editing?: RequestView) {
  const queryClient = useQueryClient();
  const draftId = useRef(editing?.status === "DRAFT" ? editing.id : undefined);
  const cancelled = useRef(false);
  return useMutation({
    networkMode: "always",
    retry: false,
    meta: { silent: true }, // the form shows the failure inline
    mutationFn: async ({ command, send }: { command: RequestCommand; send: boolean }): Promise<RequestView> => {
      if (editing?.status === "PENDING" && editing.id && !cancelled.current) {
        await timekeepingApi.cancelRequest(editing.id);
        cancelled.current = true;
      }
      const saved = draftId.current ? await timekeepingApi.updateRequest(draftId.current, command) : await timekeepingApi.createRequest(command);
      draftId.current = saved.id;
      return send ? timekeepingApi.submitRequest(saved.id as string) : saved;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: timekeepingKeys.root }),
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (id: string) => timekeepingApi.cancelRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timekeepingKeys.root }),
  });
}

export function useRemindRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (id: string) => timekeepingApi.remindRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timekeepingKeys.root }),
  });
}
