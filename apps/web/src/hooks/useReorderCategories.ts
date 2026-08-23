import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reorderCategories } from '@/api'
import { queryKeys } from '@/lib/query'
import type { Category, FinanceData, User } from '@/types'

type ReorderVariables = {
  type: Category['type']
  categoryIDs: string[]
}

type SessionCache = {
  user: User
  data: FinanceData
} | null

export function useReorderCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ type, categoryIDs }: ReorderVariables) => reorderCategories(type, categoryIDs),
    onMutate: async ({ type, categoryIDs }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session })
      const previousSession = queryClient.getQueryData<SessionCache>(queryKeys.session)
      const sortOrderByID = new Map(categoryIDs.map((id, sortOrder) => [id, sortOrder]))

      queryClient.setQueryData<SessionCache>(queryKeys.session, (session) => updateCategories(session, (categories) => categories.map((category) => {
        const sortOrder = category.type === type ? sortOrderByID.get(category.id) : undefined
        return sortOrder === undefined ? category : { ...category, sort_order: sortOrder }
      })))

      return { previousSession }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSession !== undefined) queryClient.setQueryData(queryKeys.session, context.previousSession)
    },
    onSuccess: (savedCategories, { type }) => {
      const savedByID = new Map(savedCategories.map((category) => [category.id, category]))
      queryClient.setQueryData<SessionCache>(queryKeys.session, (session) => updateCategories(session, (categories) => categories.map((category) => (
        category.type === type ? savedByID.get(category.id) ?? category : category
      ))))
    },
  })
}

function updateCategories(session: SessionCache | undefined, update: (categories: Category[]) => Category[]) {
  if (!session) return session
  return {
    ...session,
    data: {
      ...session.data,
      categories: update(session.data.categories),
    },
  }
}
