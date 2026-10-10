import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute default freshness
      gcTime: 1000 * 60 * 10, // 10 minutes cache retention
      retry: (failureCount, error) => {
        // Do not retry 4xx client errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Prevent wasteful automatic re-queries
      refetchOnReconnect: true,
    },
  },
});
