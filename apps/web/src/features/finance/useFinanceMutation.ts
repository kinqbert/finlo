import { useMutation, useQueryClient, type MutationFunction } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'

export function useFinanceMutation<TData, TVariables>(mutationFn: MutationFunction<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
    },
  })
}
