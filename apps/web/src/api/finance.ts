import type { Account, Budget, Category, CreateAccountInput, CreateCategoryInput, CreateSubscriptionInput, CreateTransactionInput, Dashboard, EmergencyFund, FinanceData, ReorderCategoriesInput, SaveBudgetInput, SaveEmergencyFundInput, Subscription, Transaction, UpdateCategoryInput } from '@/types'
import { apiRequest } from './client'

export async function loadFinanceData(signal?: AbortSignal): Promise<FinanceData> {
  const [dashboard, categories, accounts, transactions, budgets, subscriptions] = await Promise.all([
    apiRequest<Dashboard>({ url: '/api/dashboard', signal }),
    apiRequest<Category[]>({ url: '/api/categories', signal }),
    apiRequest<Account[]>({ url: '/api/accounts', signal }),
    apiRequest<Transaction[]>({ url: '/api/transactions', signal }),
    apiRequest<Budget[]>({ url: '/api/budgets', params: { month: new Date().toISOString().slice(0, 7) }, signal }),
    apiRequest<Subscription[]>({ url: '/api/subscriptions', signal }),
  ])
  return { dashboard, categories, accounts, transactions, budgets, subscriptions }
}

export const createCategory = (input: CreateCategoryInput) =>
  apiRequest<Category>({ url: '/api/categories', method: 'POST', data: input })

export const updateCategory = (id: string, name: UpdateCategoryInput['name']) =>
  apiRequest<Category>({ url: `/api/categories/${id}`, method: 'PATCH', data: { name } satisfies UpdateCategoryInput })

export const deleteCategory = (id: string) =>
  apiRequest<void>({ url: `/api/categories/${id}`, method: 'DELETE' })

export const reorderCategories = (type: Category['type'], categoryIDs: string[]) =>
  apiRequest<Category[]>({ url: '/api/categories/order', method: 'PUT', data: { type, category_ids: categoryIDs } satisfies ReorderCategoriesInput })

export const createAccount = (input: CreateAccountInput) =>
  apiRequest<Account>({ url: '/api/accounts', method: 'POST', data: input })

export const createTransaction = (input: CreateTransactionInput) =>
  apiRequest<Transaction>({ url: '/api/transactions', method: 'POST', data: input })

export const saveBudget = (input: SaveBudgetInput) =>
  apiRequest<Budget>({ url: '/api/budgets', method: 'POST', data: input })

export const saveEmergencyFund = (input: SaveEmergencyFundInput) =>
  apiRequest<EmergencyFund>({ url: '/api/emergency-fund', method: 'PUT', data: input })

export const createSubscription = (input: CreateSubscriptionInput) =>
  apiRequest<Subscription>({ url: '/api/subscriptions', method: 'POST', data: input })
