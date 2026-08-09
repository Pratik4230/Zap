import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/global/api/client";
import { queryKeys } from "@/global/api/query-keys";

export function useStreakStatus() {
  return useQuery({
    queryKey: queryKeys.streak,
    queryFn: () => apiClient.streak.status(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useClaimStreakReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.streak.claim(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
    },
  });
}
