import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isRetryableApiError } from "@/global/api/errors";
import { setupQueryConnectivity } from "@/global/query/connectivity";

setupQueryConnectivity();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // Pause fetches while offline; resume when `onlineManager` flips back.
        networkMode: "online",
        refetchOnReconnect: true,
        retry: (failureCount, error) =>
          failureCount < 2 && isRetryableApiError(error),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        networkMode: "online",
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
