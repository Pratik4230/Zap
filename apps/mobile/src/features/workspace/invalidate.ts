import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/global/api/query-keys";

/** Invalidate workspace-scoped data without stalling the whole app. */
export function invalidateWorkspaceScoped(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
    queryClient.invalidateQueries({ queryKey: queryKeys.links.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
    queryClient.invalidateQueries({ queryKey: ["workspace", "members"] }),
    queryClient.invalidateQueries({ queryKey: ["workspace", "webhooks"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.billing }),
  ]);
}
