import type { Account, AssignTransactionCategoryInput, Budget, Category, CompleteMonobankInput, CreateAccountInput, CreateCategoryInput, CreateGoalInput, CreateSubscriptionInput, CreateTransactionInput, Dashboard, EmergencyFund, FinanceData, Goal, MCCCategoryRule, MonobankConnection, MonobankPreview, ReorderCategoriesInput, SaveBudgetInput, SaveEmergencyFundInput, SaveMCCRuleInput, Subscription, Transaction, UpdateAccountInput, UpdateCategoryInput } from '@/types'
import { apiRequest } from './client'

export async function loadFinanceData(signal?: AbortSignal): Promise<FinanceData> {
  const [dashboard, categories, accounts, transactions, budgets, subscriptions, goals, mccRules, monobankConnection] = await Promise.all([
    apiRequest<Dashboard>({ url: '/api/dashboard', signal }),
    apiRequest<Category[]>({ url: '/api/categories', signal }),
    apiRequest<Account[]>({ url: '/api/accounts', signal }),
    apiRequest<Transaction[]>({ url: '/api/transactions', signal }),
    apiRequest<Budget[]>({ url: '/api/budgets', params: { month: new Date().toISOString().slice(0, 7) }, signal }),
    apiRequest<Subscription[]>({ url: '/api/subscriptions', signal }),
	apiRequest<Goal[]>({ url: '/api/goals', signal }),
	apiRequest<MCCCategoryRule[]>({ url: '/api/mcc-rules', signal }),
	apiRequest<MonobankConnection | null>({ url: '/api/integrations/monobank', signal }),
  ])
  return { dashboard, categories, accounts, transactions, budgets, subscriptions, goals, mccRules, monobankConnection }
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

export const updateAccount = (id: string, input: UpdateAccountInput) =>
  apiRequest<Account>({ url: `/api/accounts/${id}`, method: 'PATCH', data: input })

export const deleteAccount = (id: string) =>
  apiRequest<void>({ url: `/api/accounts/${id}`, method: 'DELETE' })

export const createTransaction = (input: CreateTransactionInput) =>
  apiRequest<Transaction>({ url: '/api/transactions', method: 'POST', data: input })

export const saveBudget = (input: SaveBudgetInput) =>
  apiRequest<Budget>({ url: '/api/budgets', method: 'POST', data: input })

export const saveEmergencyFund = (input: SaveEmergencyFundInput) =>
  apiRequest<EmergencyFund>({ url: '/api/emergency-fund', method: 'PUT', data: input })

export const createGoal = (input: CreateGoalInput) =>
  apiRequest<Goal>({ url: '/api/goals', method: 'POST', data: input })

export const createSubscription = (input: CreateSubscriptionInput) =>
  apiRequest<Subscription>({ url: '/api/subscriptions', method: 'POST', data: input })

export const previewMonobank = (token: string) =>
	apiRequest<MonobankPreview>({ url: '/api/integrations/monobank/preview', method: 'POST', data: { token } })

export const completeMonobank = (input: CompleteMonobankInput) =>
	apiRequest<MonobankConnection>({ url: '/api/integrations/monobank/complete', method: 'POST', data: input })

export const registerMonobankWebhook = () =>
	apiRequest<MonobankConnection>({ url: '/api/integrations/monobank/webhook', method: 'PUT' })

export const disconnectMonobankWebhook = () =>
	apiRequest<MonobankConnection>({ url: '/api/integrations/monobank/webhook', method: 'DELETE' })

export const saveMCCRule = (input: SaveMCCRuleInput) =>
	apiRequest<MCCCategoryRule>({ url: '/api/mcc-rules', method: 'POST', data: input })

export const deleteMCCRule = (id: string) =>
	apiRequest<void>({ url: `/api/mcc-rules/${id}`, method: 'DELETE' })

export const assignTransactionCategory = (id: string, input: AssignTransactionCategoryInput) =>
	apiRequest<Transaction>({ url: `/api/transactions/${id}/category`, method: 'PATCH', data: input })
