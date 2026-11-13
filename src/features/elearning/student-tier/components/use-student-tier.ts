import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { acknowledgeTierPromotion, loadMyFrames, loadMyTier, loadTierTable, selectFrame, studentTierKeys } from "@/features/elearning/student-tier/api/student-tier-api";

export const useMyTier = (accountId: string) => useQuery({ queryKey: studentTierKeys.mine(accountId), queryFn: ({ signal }) => loadMyTier(signal) });

export const useTierTable = (accountId: string, weekStart: string | null) =>
  useQuery({ queryKey: studentTierKeys.table(accountId, weekStart), queryFn: ({ signal }) => loadTierTable(weekStart, signal) });

export const useMyFrames = (accountId: string) => useQuery({ queryKey: studentTierKeys.frames(accountId), queryFn: ({ signal }) => loadMyFrames(signal) });

/** Select a frame (`null` = none) and refresh the frame list and the student's tier. */
export function useSelectFrame(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tierKey: string | null) => selectFrame(tierKey),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: studentTierKeys.frames(accountId) }),
      queryClient.invalidateQueries({ queryKey: ["class-leaderboard", "student", accountId] }),
    ]),
  });
}

export function useAcknowledgePromotion(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekStart: string) => acknowledgeTierPromotion(weekStart),
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentTierKeys.mine(accountId) }),
  });
}
