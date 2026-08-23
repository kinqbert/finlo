import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api'

export const queryKeys = {
  session: ['session', 'finance'] as const,
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && (!(error instanceof ApiError) || error.status >= 500),
    },
    mutations: {
      retry: false,
    },
  },
})
