export type {
  Account,
  APIError,
  Budget,
  Category,
  CreateAccountInput,
  CreateCategoryInput,
  CreateSubscriptionInput,
  CreateTransactionInput,
  Dashboard,
  EmergencyFund,
  GoogleLoginInput,
  Insight,
  LoginInput,
  RegisterInput,
  ReorderCategoriesInput,
  SaveBudgetInput,
  SaveEmergencyFundInput,
  Subscription,
  Tokens,
  Transaction,
  UpdateCategoryInput,
  User,
} from '@/api/generated'

import type { Account, Budget, Category, Dashboard, Subscription, Transaction } from '@/api/generated'

export type FinanceData = {
  dashboard: Dashboard
  categories: Category[]
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  subscriptions: Subscription[]
}

export type FinanceActions = {
  data: FinanceData
  isDemo: boolean
  onDemoChange: (data: FinanceData) => void
}
